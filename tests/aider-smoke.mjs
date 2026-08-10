import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WebSocket } from 'ws';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'kaiju-aider-smoke-secret';
process.env.GROQ_API_KEY = '';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaiju-aider-'));
const { createRuntime } = await import('../server.js');
const runtime = await createRuntime({ dbPath: path.join(tmp, 'aider.sqlite'), reset: true });
const address = await runtime.start(0);
const baseUrl = `ws://127.0.0.1:${address.port}`;

const ws = new WebSocket(`${baseUrl}/ws/aider-x`);
const events = [];

try {
  const reply = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AIDER-X smoke timed out')), 8000);
    ws.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      events.push(data.type);
      if (data.type === 'hello') ws.send('Give me one upload tip.');
      if (data.type === 'assistant') {
        clearTimeout(timer);
        resolve(data.message);
      }
    });
    ws.on('error', reject);
  });

  assert.ok(events.includes('hello'));
  assert.ok(events.includes('typing'));
  assert.ok(events.includes('assistant'));
  assert.match(reply, /upload|Kaiju|model|geometry/i);
  console.log('AIDER-X smoke passed');
} finally {
  ws.close();
  await once(ws, 'close').catch(() => {});
  await runtime.close();
}
