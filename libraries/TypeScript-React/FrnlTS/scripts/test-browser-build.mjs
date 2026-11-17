import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { builtinModules } from 'node:module';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'frnlts-browser-build-'));
const outDir = path.join(temp, 'dist');

try {
  execFileSync('pnpm', [
    'exec', 'tsup',
    'src/react/index.ts',
    '--format', 'esm',
    '--platform', 'browser',
    '--out-dir', outDir,
    '--external', 'react',
    '--external', 'react-dom',
  ], { cwd: root, stdio: 'inherit' });

  const entry = path.join(outDir, 'index.js');
  assert.ok(fs.existsSync(entry), 'Browser build must emit the React entry point');
  const source = fs.readFileSync(entry, 'utf8');
  const builtins = new Set(builtinModules.flatMap((name) => [name, 'node:' + name]));
  const patterns = [
    /\bimport\s*(?:[^'\";]*?\sfrom\s*)?['\"]([^'\"]+)['\"]/g,
    /\bexport\s+(?:\*\s+as\s+[\w$]+|\*|\{[^}]*\})\s+from\s*['\"]([^'\"]+)['\"]/g,
    /\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)/g,
  ];
  const imports = new Set();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) imports.add(match[1]);
  }
  for (const specifier of imports) {
    assert.ok(!builtins.has(specifier), 'Browser build contains Node builtin: ' + specifier);
  }
  assert.doesNotMatch(source, /(?:from\s*|import\s*)['\"][^'\"]+\.css['\"]/, 'React build must not pull CSS implicitly');

  const cssTargets = [];
  function collectTargets(value) {
    if (typeof value === 'string' && value.endsWith('.css')) cssTargets.push(value);
    else if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) collectTargets(nested);
    }
  }
  for (const value of Object.values(manifest.exports ?? {})) collectTargets(value);
  for (const target of cssTargets) {
    assert.ok(fs.existsSync(path.resolve(root, target)), 'Declared CSS export is missing: ' + target);
  }

  console.log(JSON.stringify({
    package: manifest.name,
    browserEntry: 'src/react/index.ts',
    emittedEntry: path.relative(root, entry),
    externalImports: [...imports].sort(),
    cssExports: cssTargets,
    result: 'passed',
  }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
