import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Kloks public canonical auth package export', () => {
  it('maps the public auth subpath to built JavaScript and declarations', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const auth = manifest.exports['./auth'];
    expect(auth.import).toBe('./packages/client/dist/auth.js');
    expect(auth.default).toBe(auth.import);
    expect(fs.existsSync(path.join(root, auth.import))).toBe(true);
    expect(fs.existsSync(path.join(root, auth.types))).toBe(true);
    const publicApi = fs.readFileSync(path.join(root, 'packages/client/src/auth.ts'), 'utf8');
    expect(publicApi).toContain('createCanonicalAuthClient');
    expect(publicApi).toContain('LuthAuthClient');
  });
});
