import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const buildScript = String(rootPackage.scripts?.build || '');
const npmrcPath = new URL('../../.npmrc', import.meta.url);

describe('Kloks monorepo build resource policy', () => {
  it('bounds recursive workspace build concurrency to two or fewer workers', () => {
    const npmrc = existsSync(npmrcPath) ? readFileSync(npmrcPath, 'utf8') : '';
    const boundedByCommand = /--workspace-concurrency(?:=|\s+)2\b/.test(buildScript);
    const boundedByConfig = /^workspace-concurrency\s*=\s*2\s*$/m.test(npmrc);
    expect(boundedByCommand || boundedByConfig,
      'Root build must cap pnpm recursive workspace concurrency at 2; avoid relying on Node heap increases alone').toBe(true);
  });

  it('keeps the root build dependency-aware and declaration normalization enabled', () => {
    expect(buildScript).toMatch(/pnpm\s+-r\s+run\s+build/);
    expect(buildScript).toMatch(/normalize-package-declarations\.mjs/);
  });
});
