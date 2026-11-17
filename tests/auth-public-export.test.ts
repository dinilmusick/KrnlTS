import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('GutTS public authentication package export', () => {
  it('publishes a resolvable auth entrypoint and declaration file', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const auth = manifest.exports['./auth'];
    expect(auth.import).toBe('./dist/auth/index.js');
    expect(auth.default).toBe(auth.import);
    expect(fs.existsSync(path.join(root, auth.import))).toBe(true);
    expect(fs.existsSync(path.join(root, auth.types))).toBe(true);
    const declarations = fs.readFileSync(path.join(root, auth.types), 'utf8');
    expect(declarations).toContain("'./luthAuthClient.js'");
    const clientDeclarations = path.join(root, 'dist/auth/luthAuthClient.d.ts');
    expect(fs.existsSync(clientDeclarations)).toBe(true);
    const clientTypes = fs.readFileSync(clientDeclarations, 'utf8');
    expect(clientTypes).toContain('LuthAuthClient');
    expect(clientTypes).toContain('createLuthAuthClient');
  });
});
