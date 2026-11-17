import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const frontendRoot = path.join(root, 'src/frontend');

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [target] : [];
  });
}

test('all same-origin SRKL API requests use the canonical Luth transport', () => {
  const violations: string[] = [];
  for (const file of walk(frontendRoot)) {
    const relative = path.relative(root, file);
    if (relative === 'src/frontend/auth/luthAuthClient.ts') continue;
    const source = fs.readFileSync(file, 'utf8');
    if (/\bfetch\(\s*['"`]\/api\//.test(source)) violations.push(relative + ': direct API fetch');
    if (/new EventSource\(\s*['"`]\/api\//.test(source)) violations.push(relative + ': unauthenticated EventSource');
    if (/['"]x-user-id['"]\s*:/.test(source)) violations.push(relative + ': caller-supplied identity header');
  }
  assert.deepEqual(violations, []);
});
