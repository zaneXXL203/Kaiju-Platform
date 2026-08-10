import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'kaiju-ui-smoke-secret';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaiju-ui-'));
const { createRuntime } = await import('../server.js');
const runtime = await createRuntime({ dbPath: path.join(tmp, 'ui.sqlite'), reset: true });
const address = await runtime.start(0);
const baseUrl = `http://127.0.0.1:${address.port}`;

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.model-card');
  await page.waitForSelector('#hero-viewport canvas');
  await page.waitForSelector('.ai-command-bar');
  const heroCanvas = await page.locator('#hero-viewport canvas').boundingBox();
  assert.ok(heroCanvas.width > 200);
  assert.ok(heroCanvas.height > 200);
  const aiBar = await page.locator('.ai-command-bar').boundingBox();
  assert.ok(aiBar.width > 700);
  assert.ok(aiBar.height >= 90);

  fs.mkdirSync(path.join(process.cwd(), 'test-results'), { recursive: true });
  await page.screenshot({ path: path.join(process.cwd(), 'test-results', 'home.png'), fullPage: true });

  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="identity"]', 'owner@kaiju.local');
  await page.fill('input[name="password"]', 'owner-demo');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/owner');
  await page.waitForSelector('[data-owner-telemetry]');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'owner');
  await page.screenshot({ path: path.join(process.cwd(), 'test-results', 'owner.png'), fullPage: true });

  const models = await fetch(`${baseUrl}/api/models`).then((res) => res.json());
  await page.goto(`${baseUrl}/models/${models.models[0].id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#detail-viewport canvas');
  const detailCanvas = await page.locator('#detail-viewport canvas').boundingBox();
  assert.ok(detailCanvas.width > 200);
  assert.ok(detailCanvas.height > 200);
  await page.screenshot({ path: path.join(process.cwd(), 'test-results', 'model-detail.png'), fullPage: true });

  console.log(`UI smoke passed at ${baseUrl}`);
} finally {
  await browser?.close();
  await runtime.close();
}
