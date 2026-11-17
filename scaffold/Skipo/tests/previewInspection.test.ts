import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildPreviewTargets, resolvePreviewInspectionConfig, runPreviewInspection } from '../scripts/inspect_preview.mjs';

const temporaryDirectories: string[] = [];
afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe('Skipo rendered preview inspection contract', () => {
  it('resolves routes, viewport profiles and browser assertions', () => {
    const config = resolvePreviewInspectionConfig({ browserInspection: {
      enabled: true, routes: ['/', '/settings'], viewports: [{ width: 1280, height: 800 }],
      checks: [{ selector: '[data-testid="app-shell"]', visible: true }],
      captureDom: true, timeoutMs: 12000, waitUntil: 'networkidle',
    } });
    expect(config.routes).toEqual(['/', '/settings']);
    expect(config.checks[0]?.selector).toBe('[data-testid="app-shell"]');
    expect(config.timeoutMs).toBe(12000);
  });

  it('preserves preview subpaths while expanding route and viewport targets', () => {
    const config = resolvePreviewInspectionConfig({ browserInspection: {
      enabled: true, routes: ['/', '/settings'], viewports: [{ width: 1440, height: 900 }, { width: 390, height: 844 }],
    } });
    const targets = buildPreviewTargets('https://preview.example.test/app/', config);
    expect(targets).toHaveLength(4);
    expect(targets.map(target => target.url)).toEqual([
      'https://preview.example.test/app/', 'https://preview.example.test/app/settings',
      'https://preview.example.test/app/', 'https://preview.example.test/app/settings',
    ]);
  });

  it('rejects disabled inspection, non-http URLs and malformed routes', () => {
    expect(() => resolvePreviewInspectionConfig({ browserInspection: { enabled: false } })).toThrow(/disabled/);
    const validConfig = resolvePreviewInspectionConfig({ browserInspection: { enabled: true } });
    const malformedConfig = { ...validConfig, routes: ['bad-route'] };
    expect(() => buildPreviewTargets('file:///tmp/app', validConfig)).toThrow(/HTTP or HTTPS/);
    expect(() => resolvePreviewInspectionConfig({ browserInspection: { enabled: true, routes: ['bad-route'] } })).toThrow(/begin with/);
    expect(() => buildPreviewTargets('https://preview.example.test', malformedConfig)).toThrow(/begin with/);
  });

  it('delegates each real preview target to the canonical Kloks inspector and persists evidence', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'skipo-preview-'));
    temporaryDirectories.push(outputDirectory);
    const inspectedRequests: Array<Record<string, unknown>> = [];
    const inspector = {
      inspect: async (request: Record<string, any>) => {
        inspectedRequests.push(request);
        return {
          ok: false, url: request.url, title: 'Preview app', status: 200, durationMs: 8,
          logs: [{ type: 'warning', message: 'layout warning' }, { type: 'error', message: 'render failure' }],
          errors: [
            { kind: 'console', message: 'render failure' },
            { kind: 'pageerror', message: 'uncaught render exception' },
            { kind: 'requestfailed', message: 'net::ERR_FAILED' },
            { kind: 'http', message: 'HTTP 503' },
          ],
          checks: [{ selector: 'main', passed: true }],
          screenshots: [request.screenshotDirectory + '/inspection-800x600.png'],
          reportPath: request.reportPath,
          domSnapshot: '<html><body>Workspace home</body></html>',
        };
      },
    };
    const result = await runPreviewInspection({
      baseUrl: 'https://preview.test', outputDirectory,
      manifest: { browserInspection: {
        enabled: true, routes: ['/'], viewports: [{ width: 800, height: 600 }],
        checks: [{ selector: 'main', visible: true, text: 'Workspace' }],
      } },
      inspector,
    });
    const persisted = JSON.parse(await readFile(result.reportPath, 'utf8'));
    expect(result.ok).toBe(false);
    expect(result.summary.consoleLogs).toBe(2);
    expect(result.summary.errors).toBe(4);
    expect(persisted.schemaVersion).toBe(2);
    expect(persisted.results[0].title).toBe('Preview app');
    expect(persisted.results[0].domSnapshot).toContain('Workspace home');
    expect(persisted.results[0].checks[0].passed).toBe(true);
    expect(persisted.results[0].errors.map((error: { kind: string }) => error.kind)).toEqual(['console', 'pageerror', 'requestfailed', 'http']);
    expect(inspectedRequests[0].viewports).toEqual([{ width: 800, height: 600 }]);
    expect(inspectedRequests[0].reportPath).toContain('reports');
  });
});
