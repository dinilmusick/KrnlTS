import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('GutTS promotion manifest', () => {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'gutts.manifest.json'), 'utf8'));

  it('matches the published package identity and version', () => {
    expect(pkg.private).toBe(false);
    expect(manifest.package).toBe(pkg.name);
    expect(manifest.version).toBe(pkg.version);
    expect(pkg.files).toContain('gutts.manifest.json');
    expect(pkg.exports['./gutts.manifest.json']).toBe('./gutts.manifest.json');
  });

  it('advertises only declared package subpaths and requires explicit promotion evidence', () => {
    const expected = Object.keys(pkg.exports)
      .filter((key) => key.startsWith('./') && !key.endsWith('.json'))
      .map((key) => pkg.name + '/' + key.slice(2));
    expect(manifest.exports).toEqual(expected);
    expect(manifest.promotion).toMatchObject({ eligible: true, requiresExplicitEvidence: true });
  });
});
