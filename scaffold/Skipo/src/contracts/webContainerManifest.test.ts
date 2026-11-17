import { describe, expect, it } from 'vitest';
import { resolveSkipoWebContainerManifest, SkipoWebContainerManifestSchema } from './webContainerManifest.js';

describe('Skipo WebContainer manifest', () => {
  it('resolves standard commands and browser inspection defaults', () => {
    const manifest = resolveSkipoWebContainerManifest({ packageManager: 'pnpm@10.33.0', scripts: { dev: 'vite', lint: 'tsc --noEmit', test: 'vitest run', build: 'vite build' } });
    expect(manifest.workspaceRoot).toBe('/workspace');
    expect(manifest.commands.install).toEqual(['pnpm', 'install', '--no-frozen-lockfile']);
    expect(manifest.commands.dev).toEqual(['pnpm', 'dev', '--host', '0.0.0.0']);
    expect(manifest.commands.validate).toEqual(['pnpm', 'lint']);
    expect(manifest.browserInspection.enabled).toBe(true);
    expect(manifest.browserInspection.routes).toEqual(['/']);
    expect(manifest.browserInspection.viewports).toEqual([{ width: 1440, height: 900 }, { width: 390, height: 844 }]);
    expect(manifest.browserInspection.waitUntil).toBe('domcontentloaded');
    expect(manifest.browserInspection.timeoutMs).toBe(30000);
    expect(manifest.browserInspection.checks).toEqual([]);
  });

  it('honours explicit app command overrides', () => {
    const manifest = resolveSkipoWebContainerManifest({ packageManager: 'npm@10.0.0', scripts: { dev: 'vite', validate: 'node validate.mjs' } }, { commands: { dev: ['node', 'server.js'], validate: ['npm', 'run', 'validate'] } });
    expect(manifest.commands.dev).toEqual(['node', 'server.js']);
    expect(manifest.commands.validate).toEqual(['npm', 'run', 'validate']);
  });

  it('accepts app-specific routes, viewports and rendered selectors', () => {
    const manifest = resolveSkipoWebContainerManifest({}, { browserInspection: {
      enabled: true, routes: ['/', '/settings'], viewports: [{ width: 1280, height: 800 }],
      captureDom: true, screenshotDirectory: 'artifacts/browser', timeoutMs: 15000,
      waitUntil: 'networkidle', checks: [{ selector: '[data-testid="app-shell"]', visible: true, text: 'Workspace' }],
    } });
    expect(manifest.browserInspection.routes).toEqual(['/', '/settings']);
    expect(manifest.browserInspection.viewports).toEqual([{ width: 1280, height: 800 }]);
    expect(manifest.browserInspection.checks[0]?.selector).toBe('[data-testid="app-shell"]');
    expect(manifest.browserInspection.timeoutMs).toBe(15000);
    expect(manifest.browserInspection.waitUntil).toBe('networkidle');
  });

  it('rejects unsupported package managers, empty commands and invalid inspection checks', () => {
    expect(() => SkipoWebContainerManifestSchema.parse({ packageManager: 'bun' })).toThrow();
    expect(() => SkipoWebContainerManifestSchema.parse({ commands: { test: [] } })).toThrow();
    expect(() => SkipoWebContainerManifestSchema.parse({ browserInspection: { checks: [{ selector: '' }] } })).toThrow();
  });
});
