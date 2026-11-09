import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.ok(pkg.name, 'package.json must declare a package name');
assert.ok(pkg.exports && typeof pkg.exports === 'object', 'package.json must declare an explicit exports map');

function targets(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) targets(nested, out);
  }
  return out;
}

function importTarget(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  return value.import ?? value.default ?? value.node ?? null;
}

const checked = [];
for (const [key, value] of Object.entries(pkg.exports)) {
  const allTargets = targets(value);
  assert.ok(allTargets.length, `Export ${key} must resolve to a concrete target`);
  for (const target of allTargets) {
    assert.ok(!target.includes('/src/'), `Export ${key} exposes source path ${target}`);
    assert.ok(fs.existsSync(path.resolve(root, target)), `Export ${key} target is missing: ${target}`);
  }

  const declaration = allTargets.find((target) => target.endsWith('.d.ts'));
  if (declaration) {
    assert.ok(fs.existsSync(path.resolve(root, declaration)), `Declaration for ${key} is missing: ${declaration}`);
  }

  const runtimeTarget = importTarget(value);
  if (!runtimeTarget || !/\.(?:mjs|cjs|js)$/.test(runtimeTarget)) continue;
  const specifier = pkg.name + (key === '.' ? '' : key.slice(1));
  const resolved = import.meta.resolve(specifier);
  assert.ok(resolved, `Public import does not resolve: ${specifier}`);
  await import(specifier);
  checked.push({ key, specifier, resolved: pathToFileURL(path.resolve(root, runtimeTarget)).href });
}

assert.ok(checked.length > 0, 'At least one JavaScript public entry point must be import-tested');
console.log(JSON.stringify({ package: pkg.name, publicEntryPointsImported: checked }, null, 2));
