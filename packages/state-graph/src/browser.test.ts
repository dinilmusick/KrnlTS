import {describe, expect, it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('state-graph browser surface', () => {
  it('is exported separately from the Krnl-backed root', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.exports['./browser']).toEqual({
      import: './dist/browser.js',
      types: './dist/browser.d.ts',
      default: './dist/browser.js',
    });
  });

  it('keeps the built browser surface free of Krnl/server-only references', () => {
    const built = fs.readFileSync(path.join(root, 'dist/browser.js'), 'utf8');
    expect(built).not.toContain('@ultrst-armada/krnl');
    expect(built).not.toContain('node:dgram');
    expect(built).not.toContain('node:fs');
    expect(built).not.toContain('node:path');
    expect(built).not.toContain('StateLifecycleServiceDefinition');
    expect(built).not.toContain('createServiceDefinition');
  });
});
