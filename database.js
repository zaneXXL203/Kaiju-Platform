import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';

let SQL;
let db;
let dbFilePath;

const isoNow = () => new Date().toISOString();

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeParams(params = {}) {
  if (Array.isArray(params)) return params;
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key.startsWith('$') ? key : `$${key}`, value])
  );
}

function persist() {
  if (!db || !dbFilePath) return;
  ensureParent(dbFilePath);
  fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
}

export async function initDatabase(options = {}) {
  const {
    dbPath = path.resolve(process.cwd(), 'data', 'kaiju.sqlite'),
    reset = false
  } = options;

  SQL ??= await initSqlJs();
  dbFilePath = dbPath;

  if (!reset && fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    ensureParent(dbPath);
    db = new SQL.Database();
  }

  migrate();
  seed();
  persist();
  return db;
}

export function closeDatabase() {
  if (!db) return;
  persist();
  db.close();
  db = undefined;
}

export function run(sql, params = {}) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(normalizeParams(params));
    stmt.step();
  } finally {
    stmt.free();
  }
  persist();
}

export function all(sql, params = {}) {
  const stmt = db.prepare(sql);
  const rows = [];
  try {
    stmt.bind(normalizeParams(params));
    while (stmt.step()) rows.push(stmt.getAsObject());
  } finally {
    stmt.free();
  }
  return rows;
}

export function get(sql, params = {}) {
  return all(sql, params)[0] || null;
}

export function value(sql, params = {}) {
  const row = get(sql, params);
  if (!row) return null;
  return Object.values(row)[0];
}

export function recordActivity(type, message, userId = null, modelId = null) {
  run(
    `INSERT INTO activity (id, type, message, user_id, model_id, created_at)
     VALUES ($id, $type, $message, $userId, $modelId, $createdAt)`,
    {
      id: cryptoRandomId('act'),
      type,
      message,
      userId,
      modelId,
      createdAt: isoNow()
    }
  );
}

export function recentActivity(limit = 24) {
  return all(
    `SELECT a.*, u.username
     FROM activity a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT $limit`,
    { limit }
  );
}

export function cryptoRandomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

function migrate() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'regular',
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Abstract',
      format TEXT NOT NULL DEFAULT 'kaiju',
      visibility TEXT NOT NULL DEFAULT 'public',
      tags TEXT NOT NULL DEFAULT '[]',
      build_plan TEXT NOT NULL DEFAULT '{}',
      official_notes TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      file_path TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      thumbnail_url TEXT,
      user_id TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      model_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      body TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, model_id)
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      model_id TEXT NOT NULL,
      format TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      claimed_by TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      rating INTEGER NOT NULL DEFAULT 5,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id TEXT,
      model_id TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seed() {
  const count = value('SELECT COUNT(*) AS count FROM users');
  if (count > 0) return;

  const createdAt = isoNow();
  const ownerId = 'user_owner_zane';
  const officialId = 'user_official_mantiz';
  const regularId = 'user_regular_demo';

  const users = [
    {
      id: ownerId,
      username: 'ZaneOmotoye',
      email: 'owner@kaiju.local',
      password: 'owner-demo',
      role: 'owner',
      displayName: 'ZaneOmotoye',
      bio: 'Creator and owner of the Kaiju CAD Library.'
    },
    {
      id: officialId,
      username: 'MantizOfficial',
      email: 'official@kaiju.local',
      password: 'official-demo',
      role: 'official',
      displayName: 'Mantiz Official',
      bio: 'Official geometry publishing account.'
    },
    {
      id: regularId,
      username: 'demo_engineer',
      email: 'demo@kaiju.local',
      password: 'demo-demo',
      role: 'regular',
      displayName: 'Demo Engineer',
      bio: 'Exploring public geometry.'
    }
  ];

  for (const user of users) {
    run(
      `INSERT INTO users (id, username, email, password_hash, role, display_name, avatar_url, bio, created_at)
       VALUES ($id, $username, $email, $passwordHash, $role, $displayName, $avatarUrl, $bio, $createdAt)`,
      {
        ...user,
        passwordHash: bcrypt.hashSync(user.password, 10),
        avatarUrl: '',
        createdAt
      }
    );
  }

  const models = [
    {
      title: 'Gyroid Heat Exchanger',
      category: 'Mechanical',
      format: 'kaiju',
      userId: ownerId,
      source: 'Kaiju LCEM',
      featured: 1,
      views: 4281,
      downloads: 891,
      likes: 342,
      tags: ['heat-transfer', 'gyroid', 'lattice'],
      notes: 'Validated reference geometry for compact heat exchange studies.',
      buildPlan: {
        geometry: 'Gyroid lattice shell',
        dimensions: '180 x 110 x 72 mm',
        material: 'AlSi10Mg',
        mass: '418 g',
        simulation: 'Peak stress 118 MPa at 2.1 bar differential pressure',
        manufacturing: 'SLM, 40 um layers, support-free internal channels'
      }
    },
    {
      title: 'Aero Lattice Wing Rib',
      category: 'Aerospace',
      format: 'step',
      userId: officialId,
      source: 'manual',
      featured: 1,
      views: 3194,
      downloads: 642,
      likes: 221,
      tags: ['aerospace', 'rib', 'topology'],
      notes: 'Official rib study tuned for additive manufacturing trials.',
      buildPlan: {
        geometry: 'Topology-optimized wing rib',
        dimensions: '420 x 84 x 12 mm',
        material: 'Carbon nylon',
        mass: '96 g',
        simulation: '2.8x stiffness-to-weight over baseline plate',
        manufacturing: 'FFF, 0.2 mm layers, anneal recommended'
      }
    },
    {
      title: 'Rover Wheel V3',
      category: 'Mechanical',
      format: 'stl',
      userId: regularId,
      source: 'manual',
      featured: 0,
      views: 1780,
      downloads: 314,
      likes: 89,
      tags: ['robotics', 'wheel', 'terrain'],
      notes: '',
      buildPlan: {
        geometry: 'Compliant wheel with radial ribs',
        dimensions: '120 mm diameter',
        material: 'TPU 95A',
        mass: '142 g',
        simulation: 'Deflection 7.4 mm under 40 N load',
        manufacturing: 'FFF, 0.24 mm layers, 4 walls'
      }
    },
    {
      title: 'Bio Mesh Cranial Plate',
      category: 'Bio-Medical',
      format: 'kaiju',
      userId: officialId,
      source: 'Kaiju LCEM',
      featured: 0,
      views: 2390,
      downloads: 402,
      likes: 177,
      tags: ['biomedical', 'mesh', 'porous'],
      notes: 'Research model only. Not for clinical use.',
      buildPlan: {
        geometry: 'Porous conformal plate',
        dimensions: '96 x 74 x 2.8 mm',
        material: 'Ti-6Al-4V',
        mass: '28 g',
        simulation: 'Porosity 62 percent, edge stress below 84 MPa',
        manufacturing: 'EBM/SLM, post-process polishing required'
      }
    },
    {
      title: 'Parametric Facade Cell',
      category: 'Architecture',
      format: 'obj',
      userId: regularId,
      source: 'manual',
      featured: 0,
      views: 920,
      downloads: 166,
      likes: 53,
      tags: ['facade', 'architecture', 'panel'],
      notes: '',
      buildPlan: {
        geometry: 'Folded shading cell',
        dimensions: '600 x 600 x 85 mm',
        material: 'Powder-coated aluminum',
        mass: '1.9 kg',
        simulation: '37 percent direct solar gain reduction',
        manufacturing: 'CNC folded sheet, riveted frame'
      }
    },
    {
      title: 'Voronoi Electronics Cage',
      category: 'Electronics',
      format: '3mf',
      userId: ownerId,
      source: 'manual',
      featured: 1,
      views: 2812,
      downloads: 505,
      likes: 199,
      tags: ['electronics', 'enclosure', 'voronoi'],
      notes: 'Owner reference enclosure with airflow-ready lattice walls.',
      buildPlan: {
        geometry: 'Voronoi enclosure with snap lugs',
        dimensions: '155 x 92 x 44 mm',
        material: 'PETG',
        mass: '116 g',
        simulation: '18 C lower peak temperature versus solid enclosure',
        manufacturing: 'FFF, 0.2 mm layers, supports only under clips'
      }
    }
  ];

  for (const model of models) {
    const id = cryptoRandomId('mdl');
    const slug = slugify(model.title, id);
    run(
      `INSERT INTO models (
        id, title, slug, description, category, format, visibility, tags, build_plan,
        official_notes, source, file_path, file_size, thumbnail_url, user_id,
        is_featured, views, downloads, likes, created_at, updated_at
      )
      VALUES (
        $id, $title, $slug, $description, $category, $format, 'public', $tags, $buildPlan,
        $officialNotes, $source, NULL, 0, '', $userId,
        $featured, $views, $downloads, $likes, $createdAt, $updatedAt
      )`,
      {
        id,
        title: model.title,
        slug,
        description: `${model.title} is a publication-ready ${model.category.toLowerCase()} model with structured metadata, preview geometry, and a Kaiju build plan.`,
        category: model.category,
        format: model.format,
        tags: JSON.stringify(model.tags),
        buildPlan: JSON.stringify(model.buildPlan),
        officialNotes: model.notes,
        source: model.source,
        userId: model.userId,
        featured: model.featured,
        views: model.views,
        downloads: model.downloads,
        likes: model.likes,
        createdAt,
        updatedAt: createdAt
      }
    );
  }

  run(
    `INSERT INTO announcements (id, title, body, active, created_by, created_at)
     VALUES ($id, $title, $body, 1, $createdBy, $createdAt)`,
    {
      id: cryptoRandomId('ann'),
      title: 'Kaiju CAD Library is live locally',
      body: 'Explore official geometry, upload models, and test the Owner Command Centre.',
      createdBy: ownerId,
      createdAt
    }
  );

  for (const message of [
    'ZaneOmotoye published Gyroid Heat Exchanger.',
    'MantizOfficial featured Aero Lattice Wing Rib.',
    'demo_engineer downloaded Rover Wheel V3.'
  ]) {
    run(
      `INSERT INTO activity (id, type, message, user_id, model_id, created_at)
       VALUES ($id, 'seed', $message, NULL, NULL, $createdAt)`,
      { id: cryptoRandomId('act'), message, createdAt }
    );
  }
}

function slugify(title, id) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
  return `${base}-${id.slice(-6)}`;
}
