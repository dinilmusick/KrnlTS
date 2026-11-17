import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('Floks public canonical auth package export', () => {
  it('maps the consumer auth subpath to built UI JavaScript and declarations', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const auth = manifest.exports['./auth'];
    expect(auth.import).toBe('./packages/ui/dist/components/auth/index.js');
    expect(auth.default).toBe(auth.import);
    expect(fs.existsSync(path.join(root, auth.import))).toBe(true);
    expect(fs.existsSync(path.join(root, auth.types))).toBe(true);
    const publicApi = fs.readFileSync(path.join(root, 'packages/ui/src/components/auth/index.ts'), 'utf8');
    expect(publicApi).toContain("export * from './LuthAuthPage.js'");
    expect(publicApi).toContain("export * from './LuthProtectedRoute.js'");
    expect(publicApi).toContain("export * from './LoginModal.js'");
    expect(publicApi).toContain("export * from './LuthAuthClient.js'");
  });
});
