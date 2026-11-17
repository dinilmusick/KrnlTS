import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PlaywrightInspectionRuntime } from './playwrightInspectionService.js';

let origin = '';
let closeServer: (() => Promise<void>) | undefined;

beforeAll(async () => {
  const server = createServer((request, response) => {
    if (request.url === '/clean') {
      response.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><title>Clean</title><h1>Clean page</h1>');
      return;
    }
    if (request.url === '/missing.js' || request.url === '/broken.png') {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('missing');
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html>
      <html><head><title>Inspection fixture</title></head><body>
      <h1>Rendered application</h1><button id="action" onclick="document.querySelector('#status').textContent='clicked'">Run</button>
      <p id="status">idle</p><img src="/broken.png" alt="broken fixture image"><div style="width:600px;height:1px"></div>
      <script src="/missing.js"></script>
      <script>console.log('fixture console info'); console.warn('fixture console warning'); console.error('fixture console error'); setTimeout(() => { throw new Error('fixture page exception'); }, 0);</script>
      </body></html>`);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not bind inspection fixture');
  origin = `http://127.0.0.1:${address.port}`;
  closeServer = () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

afterAll(async () => { await closeServer?.(); });

describe('PlaywrightInspectionRuntime', () => {
  it('captures browser, HTTP and rendered-page evidence', async () => {
    const directory = process.env.CI ? join(process.cwd(), 'artifacts/playwright') : await mkdtemp(join(tmpdir(), 'kloks-playwright-'));
    try {
      const result = await new PlaywrightInspectionRuntime().inspect({
        url: origin,
        timeoutMs: 10000,
        waitUntil: 'networkidle',
        screenshotDirectory: directory,
        reportPath: join(directory, 'report.json'),
        captureDom: true,
        checks: [
          { selector: 'h1', visible: true, text: 'Rendered application' },
          { selector: '#action', action: { type: 'click' } },
          { selector: '#status', text: 'clicked' },
        ],
        viewports: [{ width: 1440, height: 900 }, { width: 390, height: 844 }],
      });
      expect(result.ok).toBe(false);
      expect(result.title, JSON.stringify(result.errors)).toBe('Inspection fixture');
      expect(result.errors.some(item => item.kind === 'console')).toBe(true);
      expect(result.logs.some(item => item.message === 'fixture console error')).toBe(true);
      expect(result.logs.some(item => item.type === 'log' && item.message.includes('fixture console info'))).toBe(true);
      expect(result.logs.some(item => item.type === 'warning' && item.message.includes('fixture console warning'))).toBe(true);
      expect(result.logs.some(item => item.type === 'error' && item.message.includes('fixture console error'))).toBe(true);
      expect(result.errors.some(item => item.kind === 'pageerror')).toBe(true);
      expect(result.errors.some(item => item.kind === 'http' && item.status === 404)).toBe(true);
      expect(result.errors.some(item => item.kind === 'asset' && item.url?.endsWith('/broken.png'))).toBe(true);
      expect(result.errors.some(item => item.kind === 'layout' && item.message.includes('Horizontal overflow'))).toBe(true);
      expect(result.checks.every(item => item.passed)).toBe(true);
      expect(result.screenshots).toHaveLength(2);
      expect(result.reportPath).toBe(join(directory, 'report.json'));
      expect(result.domSnapshot).toContain('Rendered application');
      expect(await readFile(result.screenshots[0])).toBeTruthy();
      expect(JSON.parse(await readFile(result.reportPath!, 'utf8')).errors).toHaveLength(result.errors.length);
    } finally {
      if (!process.env.CI) await rm(directory, { recursive: true, force: true });
    }
  }, 45000);

  it('returns a passing result for a clean rendered page', async () => {
    const result = await new PlaywrightInspectionRuntime().inspect({
      url: `${origin}/clean`,
      timeoutMs: 10000,
      waitUntil: 'domcontentloaded',
      checks: [{ selector: 'h1', text: 'Clean page' }],
      captureDom: true,
    });
    expect(result.checks[0]?.passed, JSON.stringify({ errors: result.errors, checks: result.checks, title: result.title })).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.screenshots).toHaveLength(2);
    expect(result.reportPath).toBeTruthy();
  }, 25000);
});
