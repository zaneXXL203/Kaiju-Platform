import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { WebSocket } from 'ws';

let runtime;
let baseUrl;
let wsUrl;
let regularToken;
let officialToken;
let ownerToken;
let uploadedModelId;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'kaiju-test-secret';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaiju-platform-'));
  const { createRuntime } = await import('../server.js');
  runtime = await createRuntime({ dbPath: path.join(tmp, 'test.sqlite'), reset: true });
  const address = await runtime.start(0);
  baseUrl = `http://127.0.0.1:${address.port}`;
  wsUrl = `ws://127.0.0.1:${address.port}`;
});

after(async () => {
  await runtime?.close();
});

test('health endpoint reports the platform', async () => {
  const data = await request('/api/health');
  assert.equal(data.ok, true);
  assert.equal(data.name, 'Kaiju CAD Library');
});

test('regular registration creates a regular account', async () => {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `regular_${Date.now()}`,
      email: `regular_${Date.now()}@test.local`,
      password: 'secret123'
    }
  });
  regularToken = data.token;
  assert.equal(data.user.role, 'regular');
});

test('secret entry validation and registration can create an official account', async () => {
  const check = await request('/api/auth/check-secret', {
    method: 'POST',
    body: { secretCode: 'official-demo' }
  });
  assert.equal(check.accepted, true);
  assert.equal(check.role, 'official');

  const data = await request('/api/auth/register', {
    method: 'POST',
    body: {
      username: `official_${Date.now()}`,
      email: `official_${Date.now()}@test.local`,
      password: 'secret123',
      secretCode: 'official-demo'
    }
  });
  officialToken = data.token;
  assert.equal(data.user.role, 'official');
});

test('owner demo login receives owner role', async () => {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: { identity: 'owner@kaiju.local', password: 'owner-demo' }
  });
  ownerToken = data.token;
  assert.equal(data.user.role, 'owner');
});

test('model listing includes seeded badges and official filtering', async () => {
  const allModels = await request('/api/models');
  assert.ok(allModels.models.length >= 6);
  assert.ok(allModels.models.some((model) => model.badge === 'OWNER'));
  assert.ok(allModels.models.some((model) => model.badge === 'OFFICIAL'));

  const officialOnly = await request('/api/models?official=true');
  assert.ok(officialOnly.models.length >= 1);
  assert.ok(officialOnly.models.every((model) => ['official', 'owner'].includes(model.creatorRole)));
});

test('official users can upload CAD models with .kaiju wrapping', async () => {
  const form = new FormData();
  form.append('title', 'Automated Lattice Plate');
  form.append('description', 'Uploaded by the API test suite.');
  form.append('category', 'Mechanical');
  form.append('tags', 'test,lattice,plate');
  form.append('convertToKaiju', 'true');
  form.append('material', 'PETG');
  form.append('dimensions', '100 x 60 x 8 mm');
  form.append('officialNotes', 'Verified by automated test.');
  form.append('file', new Blob(['solid automated-test-cad'], { type: 'application/octet-stream' }), 'plate.stl');

  const response = await fetch(`${baseUrl}/api/models`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${officialToken}` },
    body: form
  });
  const data = await response.json();
  assert.equal(response.status, 201);
  assert.equal(data.model.format, 'kaiju');
  assert.equal(data.model.badge, 'OFFICIAL');
  uploadedModelId = data.model.id;
});

test('model detail, like, and download routes work', async () => {
  const detail = await request(`/api/models/${uploadedModelId}`, { token: regularToken });
  assert.equal(detail.model.id, uploadedModelId);

  const like = await request(`/api/models/${uploadedModelId}/like`, {
    method: 'POST',
    token: regularToken
  });
  assert.equal(like.liked, true);
  assert.equal(typeof like.likes, 'number');

  const download = await fetch(`${baseUrl}/api/models/${uploadedModelId}/download`, {
    headers: { Authorization: `Bearer ${regularToken}` }
  });
  assert.equal(download.status, 200);
});

test('official dashboard is role gated', async () => {
  await assert.rejects(
    request('/api/admin/overview', { token: regularToken }),
    /Insufficient role/
  );

  const overview = await request('/api/admin/overview', { token: officialToken });
  assert.ok(overview.totals.models >= 1);
});

test('owner telemetry REST and WebSocket are owner-only', async () => {
  await assert.rejects(
    request('/api/owner/telemetry', { token: officialToken }),
    /Insufficient role/
  );

  const telemetry = await request('/api/owner/telemetry', { token: ownerToken });
  assert.equal(telemetry.live, true);

  const ws = new WebSocket(`${wsUrl}/ws/owner-telemetry?token=${encodeURIComponent(ownerToken)}`);
  const [message] = await once(ws, 'message');
  const data = JSON.parse(message.toString());
  assert.equal(data.type, 'telemetry');
  assert.equal(data.payload.live, true);
  ws.close();
});

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof data === 'object' ? data.error : data);
  }
  return data;
}
