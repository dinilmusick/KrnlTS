import assert from 'node:assert/strict';
import { builtinModules } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = process.cwd();
const entry = path.join(root, 'packages/core/dist/index.js');
assert.ok(fs.existsSync(entry), 'Portable kernel build is missing: ' + entry);

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => 'node:' + name),
]);
const nodeOnlyPackages = new Set([
  'ws',
  'better-sqlite3',
  'esbuild',
  'protobufjs',
  'protobufjs-cli',
  'ts-morph',
]);
const visited = new Set();
const pending = [entry];
const importPattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

while (pending.length) {
  const file = path.resolve(pending.pop());
  if (visited.has(file) || !fs.existsSync(file)) continue;
  visited.add(file);
  const source = fs.readFileSync(file, 'utf8');

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    const builtinName = specifier.startsWith('node:') ? specifier.slice(5) : specifier;
    assert.ok(!builtins.has(specifier) && !builtins.has(builtinName),
      'Portable kernel closure imports Node builtin "' + specifier + '" from ' + path.relative(root, file));

    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      const target = path.resolve(path.dirname(file), specifier);
      if (/\.(?:js|mjs|cjs)$/.test(target)) pending.push(target);
      continue;
    }

    const name = packageName(specifier);
    assert.ok(!nodeOnlyPackages.has(name),
      'Portable kernel closure imports Node-only package "' + name + '" from ' + path.relative(root, file));

    let resolved;
    try {
      resolved = import.meta.resolve(specifier, pathToFileURL(file).href);
    } catch (error) {
      assert.fail('Unable to resolve portable dependency "' + specifier + '" from ' + file + ': ' + error.message);
    }
    if (resolved.startsWith('file:')) {
      const target = fileURLToPath(resolved);
      if (/\.(?:js|mjs|cjs)$/.test(target) && fs.existsSync(target)) pending.push(target);
    }
  }
}

assert.ok(visited.has(entry), 'Portable kernel entrypoint must be inspected');
console.log(JSON.stringify({
  entry: 'packages/core/dist/index.js',
  inspectedModules: visited.size,
  result: 'portable import closure verified',
}, null, 2));
