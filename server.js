import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import {
  all,
  closeDatabase,
  cryptoRandomId,
  get,
  initDatabase,
  recentActivity,
  recordActivity,
  run,
  value
} from './database.js';
import { buildPlanFromUpload, createKaijuEnvelope } from './utils/kaiju-format.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACCEPTED_FORMATS = new Set(['kaiju', 'stl', 'obj', 'iges', 'igs', 'step', 'stp', '3mf', 'fbx']);
const MAX_REGULAR_UPLOAD = 500 * 1024 * 1024;
const MAX_OFFICIAL_UPLOAD = 2 * 1024 * 1024 * 1024;
const secretAttempts = new Map();

function now() {
  return new Date().toISOString();
}

function jwtSecret() {
  return process.env.JWT_SECRET || 'kaiju-local-dev-secret-change-me';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function configuredHash(name, devCode) {
  if (process.env[name]) return process.env[name];
  return process.env.NODE_ENV === 'production' ? '' : sha256(devCode);
}

function resolveSecretRole(secretCode) {
  if (!secretCode) return null;
  const submitted = sha256(secretCode);
  const ownerHash = configuredHash('OWNER_CODE_HASH', 'owner-demo');
  const officialHash = configuredHash('OFFICIAL_CODE_HASH', 'official-demo');
  if (ownerHash && submitted === ownerHash) return 'owner';
  if (officialHash && submitted === officialHash) return 'official';
  return null;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.display_name || user.displayName || user.username,
    avatarUrl: user.avatar_url || '',
    bio: user.bio || '',
    createdAt: user.created_at
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function userFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret());
    return get('SELECT * FROM users WHERE id = $id', { id: payload.sub });
  } catch {
    return null;
  }
}

function optionalAuth(req, _res, next) {
  req.user = userFromToken(getBearerToken(req));
  next();
}

function requireAuth(req, res, next) {
  req.user = userFromToken(getBearerToken(req));
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    req.user = userFromToken(getBearerToken(req));
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

function slugify(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'model';
  return `${base}-${nanoid(6)}`;
}

function parseJson(valueToParse, fallback) {
  try {
    return JSON.parse(valueToParse || '');
  } catch {
    return fallback;
  }
}

function shapeModel(row) {
  if (!row) return null;
  const tags = Array.isArray(row.tags) ? row.tags : parseJson(row.tags, []);
  const buildPlan = row.build_plan && typeof row.build_plan === 'object'
    ? row.build_plan
    : parseJson(row.build_plan, {});
  const creatorRole = row.creator_role || row.role || 'regular';
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    category: row.category,
    format: row.format,
    visibility: row.visibility,
    tags,
    buildPlan,
    officialNotes: row.official_notes || '',
    source: row.source,
    filePath: row.file_path || '',
    fileSize: row.file_size || 0,
    thumbnailUrl: row.thumbnail_url || '',
    userId: row.user_id,
    creator: row.creator_username || row.username || 'unknown',
    creatorName: row.creator_name || row.display_name || row.creator_username || row.username || 'Unknown',
    creatorRole,
    badge: creatorRole === 'owner' ? 'OWNER' : creatorRole === 'official' ? 'OFFICIAL' : '',
    isFeatured: Boolean(row.is_featured),
    views: Number(row.views || 0),
    downloads: Number(row.downloads || 0),
    likes: Number(row.likes || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function canReadModel(model, user) {
  if (!model) return false;
  if (model.visibility === 'public') return true;
  if (!user) return false;
  return user.role === 'owner' || user.role === 'official' || model.userId === user.id;
}

function modelQuery() {
  return `
    SELECT m.*, u.username AS creator_username, u.display_name AS creator_name, u.role AS creator_role
    FROM models m
    JOIN users u ON u.id = m.user_id
  `;
}

function filterModels(rows, query, user) {
  const q = String(query.q || query.search || '').trim().toLowerCase();
  const category = String(query.category || '').trim().toLowerCase();
  const officialOnly = query.official === 'true' || query.officialOnly === 'true';
  const featured = query.featured === 'true';

  return rows
    .map(shapeModel)
    .filter((model) => canReadModel(model, user))
    .filter((model) => !q || `${model.title} ${model.description} ${model.tags.join(' ')}`.toLowerCase().includes(q))
    .filter((model) => !category || category === 'all' || model.category.toLowerCase() === category)
    .filter((model) => !officialOnly || model.creatorRole === 'official' || model.creatorRole === 'owner')
    .filter((model) => !featured || model.isFeatured)
    .sort((a, b) => {
      if (b.isFeatured !== a.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return (b.downloads + b.likes) - (a.downloads + a.likes);
    });
}

const uploadStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${nanoid(8)}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_OFFICIAL_UPLOAD }
});

export async function createRuntime(options = {}) {
  await initDatabase({
    dbPath: options.dbPath || path.join(__dirname, 'data', 'kaiju.sqlite'),
    reset: Boolean(options.reset)
  });

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/assets', express.static(path.join(__dirname, 'assets')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three', 'build')));
  app.use('/vendor/three-addons', express.static(path.join(__dirname, 'node_modules', 'three', 'examples', 'jsm')));

  registerApi(app);
  app.use(express.static(__dirname));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  const server = http.createServer(app);
  attachWebSockets(server);

  return {
    app,
    server,
    start(port = Number(process.env.PORT || 4127)) {
      return new Promise((resolve) => {
        server.listen(port, () => resolve(server.address()));
      });
    },
    close() {
      return new Promise((resolve) => {
        server.close(() => {
          closeDatabase();
          resolve();
        });
      });
    }
  };
}

function registerApi(app) {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, name: 'Kaiju CAD Library', time: now() });
  });

  app.post('/api/auth/check-secret', (req, res) => {
    const key = req.ip || 'local';
    const attempts = secretAttempts.get(key) || { count: 0, resetAt: Date.now() + 60_000 };
    if (Date.now() > attempts.resetAt) {
      attempts.count = 0;
      attempts.resetAt = Date.now() + 60_000;
    }
    attempts.count += 1;
    secretAttempts.set(key, attempts);
    if (attempts.count > 20) return res.status(429).json({ accepted: false });

    const role = resolveSecretRole(req.body.secretCode);
    res.json({ accepted: Boolean(role), role: role || null });
  });

  app.post('/api/auth/register', async (req, res) => {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (username.length < 3 || !email.includes('@') || password.length < 6) {
      return res.status(400).json({ error: 'Username, email, and a 6+ character password are required' });
    }

    const existing = get('SELECT id FROM users WHERE username = $username OR email = $email', { username, email });
    if (existing) return res.status(409).json({ error: 'Username or email is already registered' });

    const role = resolveSecretRole(req.body.secretCode) || 'regular';
    const id = cryptoRandomId('usr');
    const passwordHash = await bcrypt.hash(password, 10);
    run(
      `INSERT INTO users (id, username, email, password_hash, role, display_name, avatar_url, bio, created_at)
       VALUES ($id, $username, $email, $passwordHash, $role, $displayName, '', '', $createdAt)`,
      { id, username, email, passwordHash, role, displayName: username, createdAt: now() }
    );

    const user = get('SELECT * FROM users WHERE id = $id', { id });
    recordActivity('register', `${username} joined Kaiju CAD Library.`, id);
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const identity = String(req.body.identity || req.body.email || req.body.username || '').trim();
    const password = String(req.body.password || '');
    const user = get(
      'SELECT * FROM users WHERE lower(username) = lower($identity) OR lower(email) = lower($identity)',
      { identity }
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid login' });
    }
    recordActivity('login', `${user.username} signed in.`, user.id);
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  app.get('/api/models', optionalAuth, (req, res) => {
    const rows = all(`${modelQuery()} ORDER BY m.created_at DESC`);
    res.json({ models: filterModels(rows, req.query, req.user) });
  });

  app.get('/api/search', optionalAuth, (req, res) => {
    const rows = all(`${modelQuery()} ORDER BY m.updated_at DESC`);
    res.json({ models: filterModels(rows, req.query, req.user) });
  });

  app.get('/api/models/:id', optionalAuth, (req, res) => {
    const row = get(`${modelQuery()} WHERE m.id = $id OR m.slug = $id`, { id: req.params.id });
    const model = shapeModel(row);
    if (!canReadModel(model, req.user)) return res.status(404).json({ error: 'Model not found' });

    run('UPDATE models SET views = views + 1 WHERE id = $id', { id: model.id });
    model.views += 1;
    const comments = all(
      `SELECT c.*, u.username, u.role
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.model_id = $id
       ORDER BY c.created_at ASC`,
      { id: model.id }
    );
    res.json({ model, comments });
  });

  app.post('/api/models', requireAuth, upload.single('file'), (req, res) => {
    const file = req.file;
    const title = String(req.body.title || file?.originalname || '').replace(/\.[^.]+$/, '').trim();
    if (!title) return res.status(400).json({ error: 'Model title is required' });
    if (!file) return res.status(400).json({ error: 'CAD file is required' });

    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!ACCEPTED_FORMATS.has(ext)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported CAD format' });
    }

    const limit = req.user.role === 'regular' ? MAX_REGULAR_UPLOAD : MAX_OFFICIAL_UPLOAD;
    if (file.size > limit) {
      fs.unlinkSync(file.path);
      return res.status(413).json({ error: 'File exceeds tier upload limit' });
    }

    const id = cryptoRandomId('mdl');
    const category = String(req.body.category || 'Abstract');
    const visibility = req.body.visibility === 'private' ? 'private' : 'public';
    const converted = req.body.convertToKaiju === 'true' || ext === 'kaiju';
    const format = converted ? 'kaiju' : ext;
    const buildPlan = buildPlanFromUpload(req.body, file);
    const tags = String(req.body.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const officialNotes = ['official', 'owner'].includes(req.user.role)
      ? String(req.body.officialNotes || '')
      : '';
    const createdAt = now();

    run(
      `INSERT INTO models (
        id, title, slug, description, category, format, visibility, tags, build_plan,
        official_notes, source, file_path, file_size, thumbnail_url, user_id,
        is_featured, views, downloads, likes, created_at, updated_at
      )
      VALUES (
        $id, $title, $slug, $description, $category, $format, $visibility, $tags, $buildPlan,
        $officialNotes, $source, $filePath, $fileSize, '', $userId,
        0, 0, 0, 0, $createdAt, $updatedAt
      )`,
      {
        id,
        title,
        slug: slugify(title),
        description: String(req.body.description || ''),
        category,
        format,
        visibility,
        tags: JSON.stringify(tags),
        buildPlan: JSON.stringify(buildPlan),
        officialNotes,
        source: req.body.source || 'manual',
        filePath: `/uploads/${path.basename(file.path)}`,
        fileSize: file.size,
        userId: req.user.id,
        createdAt,
        updatedAt: createdAt
      }
    );

    const model = shapeModel(get(`${modelQuery()} WHERE m.id = $id`, { id }));
    recordActivity('upload', `${req.user.username} uploaded "${model.title}".`, req.user.id, model.id);
    res.status(201).json({ model });
  });

  app.post('/api/models/:id/like', requireAuth, (req, res) => {
    const row = get('SELECT * FROM models WHERE id = $id OR slug = $id', { id: req.params.id });
    const model = shapeModel(row);
    if (!canReadModel(model, req.user)) return res.status(404).json({ error: 'Model not found' });

    const existing = get('SELECT * FROM likes WHERE user_id = $userId AND model_id = $modelId', {
      userId: req.user.id,
      modelId: model.id
    });

    if (existing) {
      run('DELETE FROM likes WHERE user_id = $userId AND model_id = $modelId', {
        userId: req.user.id,
        modelId: model.id
      });
      run('UPDATE models SET likes = MAX(likes - 1, 0) WHERE id = $id', { id: model.id });
    } else {
      run('INSERT INTO likes (user_id, model_id, created_at) VALUES ($userId, $modelId, $createdAt)', {
        userId: req.user.id,
        modelId: model.id,
        createdAt: now()
      });
      run('UPDATE models SET likes = likes + 1 WHERE id = $id', { id: model.id });
      recordActivity('like', `${req.user.username} liked "${model.title}".`, req.user.id, model.id);
    }

    const updated = get('SELECT likes FROM models WHERE id = $id', { id: model.id });
    res.json({ liked: !existing, likes: updated.likes });
  });

  app.get('/api/models/:id/download', optionalAuth, (req, res) => {
    const row = get(`${modelQuery()} WHERE m.id = $id OR m.slug = $id`, { id: req.params.id });
    const model = shapeModel(row);
    if (!canReadModel(model, req.user)) return res.status(404).json({ error: 'Model not found' });

    run('UPDATE models SET downloads = downloads + 1 WHERE id = $id', { id: model.id });
    run(
      `INSERT INTO downloads (id, user_id, model_id, format, created_at)
       VALUES ($id, $userId, $modelId, $format, $createdAt)`,
      {
        id: cryptoRandomId('dl'),
        userId: req.user?.id || null,
        modelId: model.id,
        format: req.query.format || model.format,
        createdAt: now()
      }
    );
    recordActivity('download', `${req.user?.username || 'A visitor'} downloaded "${model.title}".`, req.user?.id || null, model.id);

    if (model.filePath && fs.existsSync(path.join(__dirname, model.filePath))) {
      return res.download(path.join(__dirname, model.filePath));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${model.slug}.kaiju"`);
    res.send(JSON.stringify(createKaijuEnvelope(model), null, 2));
  });

  app.post('/api/models/:id/comments', requireAuth, (req, res) => {
    const row = get('SELECT * FROM models WHERE id = $id OR slug = $id', { id: req.params.id });
    const model = shapeModel(row);
    if (!canReadModel(model, req.user)) return res.status(404).json({ error: 'Model not found' });

    const body = String(req.body.body || '').trim();
    if (body.length < 2) return res.status(400).json({ error: 'Comment is too short' });

    const id = cryptoRandomId('com');
    run(
      `INSERT INTO comments (id, model_id, user_id, parent_id, body, votes, created_at)
       VALUES ($id, $modelId, $userId, $parentId, $body, 0, $createdAt)`,
      {
        id,
        modelId: model.id,
        userId: req.user.id,
        parentId: req.body.parentId || null,
        body,
        createdAt: now()
      }
    );
    recordActivity('comment', `${req.user.username} commented on "${model.title}".`, req.user.id, model.id);
    res.status(201).json({ id });
  });

  app.get('/api/announcements', (_req, res) => {
    res.json({
      announcements: all('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC')
    });
  });

  app.get('/api/requests', optionalAuth, (_req, res) => {
    res.json({ requests: all('SELECT * FROM requests ORDER BY created_at DESC') });
  });

  app.post('/api/requests', requireAuth, (req, res) => {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });
    const id = cryptoRandomId('req');
    run(
      `INSERT INTO requests (id, title, description, category, status, claimed_by, created_by, created_at, updated_at)
       VALUES ($id, $title, $description, $category, 'open', NULL, $createdBy, $createdAt, $updatedAt)`,
      {
        id,
        title,
        description,
        category: req.body.category || 'Mechanical',
        createdBy: req.user.id,
        createdAt: now(),
        updatedAt: now()
      }
    );
    recordActivity('request', `${req.user.username} requested "${title}".`, req.user.id);
    res.status(201).json({ id });
  });

  app.post('/api/requests/:id/claim', requireRole(['official', 'owner']), (req, res) => {
    run(
      `UPDATE requests
       SET status = 'claimed', claimed_by = $claimedBy, updated_at = $updatedAt
       WHERE id = $id`,
      { id: req.params.id, claimedBy: req.user.id, updatedAt: now() }
    );
    res.json({ ok: true });
  });

  app.post('/api/feedback', (req, res) => {
    const name = String(req.body.name || '').trim();
    const message = String(req.body.message || '').trim();
    if (!name || !message) return res.status(400).json({ error: 'Name and message are required' });
    const id = cryptoRandomId('fb');
    run(
      `INSERT INTO feedback (id, name, email, rating, message, created_at)
       VALUES ($id, $name, $email, $rating, $message, $createdAt)`,
      {
        id,
        name,
        email: req.body.email || '',
        rating: Number(req.body.rating || 5),
        message,
        createdAt: now()
      }
    );
    res.status(201).json({ id });
  });

  app.get('/api/feed', optionalAuth, (_req, res) => {
    res.json({ activity: recentActivity(50) });
  });

  app.get('/api/admin/overview', requireRole(['official', 'owner']), (_req, res) => {
    res.json({
      totals: platformTotals(),
      recentActivity: recentActivity(20),
      reports: [],
      feedback: all('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 20'),
      requests: all('SELECT * FROM requests ORDER BY created_at DESC LIMIT 20')
    });
  });

  app.patch('/api/admin/models/:id/feature', requireRole(['official', 'owner']), (req, res) => {
    const featured = req.body.featured ? 1 : 0;
    run('UPDATE models SET is_featured = $featured, updated_at = $updatedAt WHERE id = $id', {
      id: req.params.id,
      featured,
      updatedAt: now()
    });
    res.json({ ok: true });
  });

  app.post('/api/admin/announcements', requireRole(['official', 'owner']), (req, res) => {
    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '').trim();
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
    const id = cryptoRandomId('ann');
    run(
      `INSERT INTO announcements (id, title, body, active, created_by, created_at)
       VALUES ($id, $title, $body, 1, $createdBy, $createdAt)`,
      { id, title, body, createdBy: req.user.id, createdAt: now() }
    );
    recordActivity('announcement', `${req.user.username} posted an announcement.`, req.user.id);
    res.status(201).json({ id });
  });

  app.get('/api/owner/telemetry', requireRole(['owner']), (_req, res) => {
    res.json(ownerTelemetry());
  });

  app.get('/api/owner/users', requireRole(['owner']), (_req, res) => {
    res.json({ users: all('SELECT id, username, email, role, display_name, created_at FROM users ORDER BY created_at DESC') });
  });

  app.patch('/api/owner/users/:id/role', requireRole(['owner']), (req, res) => {
    const role = String(req.body.role || '');
    if (!['regular', 'official', 'owner'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    run('UPDATE users SET role = $role WHERE id = $id', { role, id: req.params.id });
    recordActivity('role', `${req.user.username} changed a user role to ${role}.`, req.user.id);
    res.json({ ok: true });
  });
}

function platformTotals() {
  return {
    users: Number(value('SELECT COUNT(*) FROM users') || 0),
    models: Number(value('SELECT COUNT(*) FROM models') || 0),
    publicModels: Number(value("SELECT COUNT(*) FROM models WHERE visibility = 'public'") || 0),
    downloads: Number(value('SELECT COALESCE(SUM(downloads), 0) FROM models') || 0),
    likes: Number(value('SELECT COALESCE(SUM(likes), 0) FROM models') || 0),
    feedback: Number(value('SELECT COUNT(*) FROM feedback') || 0)
  };
}

function ownerTelemetry() {
  const totals = platformTotals();
  return {
    live: true,
    activeUsers: 34 + Number(value('SELECT COUNT(*) FROM users') || 0),
    downloadsPerMinute: 12 + Math.floor(Math.random() * 8),
    searchesPerMinute: 41 + Math.floor(Math.random() * 19),
    aiChatsPerMinute: 8 + Math.floor(Math.random() * 7),
    totals,
    health: {
      server: 'OK',
      database: 'OK',
      storageUsed: `${Math.min(78, 12 + totals.models * 2)}%`,
      api: 'OK'
    },
    recentActivity: recentActivity(12)
  };
}

async function createAiderReply(text, conversation = []) {
  const trimmed = String(text || '').trim().slice(0, 1200);
  if (!trimmed) return 'Ask me about Kaiju models, uploads, comparison, downloads, or platform workflows.';

  const key = process.env.GROQ_API_KEY;
  if (!key) return fallbackAiderReply(trimmed);

  const modelContext = all(`${modelQuery()} ORDER BY m.downloads DESC LIMIT 6`)
    .map(shapeModel)
    .map((model) => `${model.title} by ${model.creatorName} (${model.category}, .${model.format}, ${model.badge || 'community'}, ${model.downloads} downloads)`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: [
        'You are AIDER-X inside the Kaiju CAD Library platform.',
        'Be concise, practical, and design/engineering focused.',
        'Help users search CAD models, understand .kaiju metadata, prepare uploads, compare models, and use Official/Owner workflows.',
        'Do not claim you performed actions unless the UI/API actually supports them.',
        `Current top platform models:\n${modelContext}`
      ].join('\n\n')
    },
    ...conversation.slice(-8),
    { role: 'user', content: trimmed }
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages,
        temperature: 0.35,
        max_tokens: 520
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${detail.slice(0, 160)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || fallbackAiderReply(trimmed);
  } catch (error) {
    console.warn(error.message);
    return fallbackAiderReply(trimmed);
  }
}

function fallbackAiderReply(text) {
  return `I can help with "${text}". Try searching the discovery grid, opening a model detail page for the 3D viewer, using Compare Mode, or uploading a CAD file with .kaiju wrapping enabled.`;
}

function attachWebSockets(server) {
  const ownerWss = new WebSocketServer({ noServer: true });
  const aiderWss = new WebSocketServer({ noServer: true });

  ownerWss.on('connection', (ws) => {
    const sendTelemetry = () => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'telemetry', payload: ownerTelemetry() }));
    };
    sendTelemetry();
    const interval = setInterval(sendTelemetry, 2000);
    ws.on('close', () => clearInterval(interval));
  });

  aiderWss.on('connection', (ws) => {
    const conversation = [];
    ws.send(JSON.stringify({
      type: 'hello',
      message: process.env.GROQ_API_KEY
        ? 'AIDER-X is online with live AI. Ask about models, upload prep, search, compare, or downloads.'
        : 'AIDER-X is online in local fallback mode. Add GROQ_API_KEY for live AI responses.'
    }));
    ws.on('message', async (message) => {
      const text = String(message).slice(0, 500);
      if (!text.trim()) return;

      ws.send(JSON.stringify({ type: 'typing', message: 'AIDER-X is thinking...' }));
      const reply = await createAiderReply(text, conversation);
      conversation.push({ role: 'user', content: text });
      conversation.push({ role: 'assistant', content: reply });
      if (conversation.length > 10) conversation.splice(0, conversation.length - 10);
      ws.send(JSON.stringify({ type: 'assistant', message: reply }));
    });
  });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/ws/owner-telemetry') {
      const user = userFromToken(url.searchParams.get('token'));
      if (!user || user.role !== 'owner') {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      ownerWss.handleUpgrade(request, socket, head, (ws) => ownerWss.emit('connection', ws, request));
      return;
    }

    if (url.pathname === '/ws/aider-x') {
      aiderWss.handleUpgrade(request, socket, head, (ws) => aiderWss.emit('connection', ws, request));
      return;
    }

    socket.destroy();
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runtime = await createRuntime();
  const address = await runtime.start();
  const port = typeof address === 'object' ? address.port : process.env.PORT || 4127;
  console.log(`Kaiju CAD Library running at http://localhost:${port}`);
  console.log('Demo logins: owner@kaiju.local / owner-demo, official@kaiju.local / official-demo, demo@kaiju.local / demo-demo');
}
