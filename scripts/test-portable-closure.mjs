import assert from 'node:assert/strict';
import { builtinModules } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

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

function selectImportTarget(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const selected = selectImportTarget(candidate);
      if (selected) return selected;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const condition of ['import', 'node', 'default']) {
    if (condition in value) {
      const selected = selectImportTarget(value[condition]);
      if (selected) return selected;
    }
  }
  return null;
}

function resolvePackageImport(specifier, importer) {
  const name = packageName(specifier);
  const subpath = specifier.slice(name.length).replace(/^\//, '');
  let directory = path.dirname(importer);

  while (true) {
    const packageDirectory = path.join(directory, 'node_modules', name);
    const packageJsonPath = path.join(packageDirectory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      let target = null;
      const exportsField = packageJson.exports;

      if (exportsField !== undefined) {
        if (typeof exportsField === 'string' || Array.isArray(exportsField)) {
          if (!subpath) target = selectImportTarget(exportsField);
        } else if (exportsField && typeof exportsField === 'object') {
          const key = subpath ? './' + subpath : '.';
          const entry = Object.prototype.hasOwnProperty.call(exportsField, key)
            ? exportsField[key]
            : (!subpath && !Object.keys(exportsField).some((item) => item.startsWith('.')) ? exportsField : null);
          target = selectImportTarget(entry);
        }
      }

      if (!target) {
        target = subpath || packageJson.module || packageJson.main || 'index.js';
      }
      const resolved = path.resolve(packageDirectory, target);
      const candidates = [
        resolved,
        resolved + '.js',
        resolved + '.mjs',
        resolved + '.cjs',
        path.join(resolved, 'index.js'),
      ];
      const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (found) return fs.realpathSync(found);
      throw new Error('Resolved package target does not exist: ' + specifier + ' -> ' + resolved);
    }

    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }

  throw new Error('Unable to resolve package "' + specifier + '" from ' + importer);
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
      resolved = resolvePackageImport(specifier, file);
    } catch (error) {
      assert.fail('Unable to resolve portable dependency "' + specifier + '" from ' + file + ': ' + error.message);
    }
    if (/\.(?:js|mjs|cjs)$/.test(resolved) && fs.existsSync(resolved)) pending.push(resolved);
  }
}

assert.ok(visited.has(entry), 'Portable kernel entrypoint must be inspected');
console.log(JSON.stringify({
  entry: 'packages/core/dist/index.js',
  inspectedModules: visited.size,
  result: 'portable import closure verified',
}, null, 2));
