import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const runtimeRoot = process.env.PLAYWRIGHT_RUNTIME_PATH;
const require = createRequire(runtimeRoot ? `${runtimeRoot}/package.json` : import.meta.url);
const playwright = require('playwright');
const executable = playwright.chromium.executablePath();

assert.ok(fs.existsSync(executable), 'Playwright Chromium executable must be installed');
assert.equal(typeof playwright.chromium.launch, 'function');
const args = typeof process.getuid === 'function' && process.getuid() === 0
  ? ['--no-sandbox', '--disable-dev-shm-usage']
  : [];
const browser = await playwright.chromium.launch({ headless: true, args });
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><title>Playwright smoke</title>');
  assert.equal(await page.title(), 'Playwright smoke');
  await page.close();
} finally {
  await browser.close();
}
console.log('Isolated Playwright runtime, Chromium launch, and DOM smoke test passed.');
