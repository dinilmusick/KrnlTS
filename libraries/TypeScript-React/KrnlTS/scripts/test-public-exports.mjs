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
  assert.ok(key !== './*' && !key.endsWith('/*'), `Wildcard public export is forbidden: ${key}`);
  const allTargets = targets(value);
  assert.ok(allTargets.length, `Export ${key} must resolve to a concrete target`);
  for (const target of allTargets) {
    assert.ok(!target.includes('/src/'), `Export ${key} exposes source path ${target}`);
    assert.ok(fs.existsSync(path.resolve(root, target)), `Export ${key} target is missing: ${target}`);
  }

  const runtimeTarget = importTarget(value);
  const declaration = allTargets.find((target) => target.endsWith('.d.ts'))
    ?? (runtimeTarget?.endsWith('.js') ? runtimeTarget.replace(/\.js$/, '.d.ts') : null);
  if (declaration) {
    assert.ok(fs.existsSync(path.resolve(root, declaration)), `Declaration for ${key} is missing: ${declaration}`);
  }

  if (!runtimeTarget || !/\.(?:mjs|cjs|js)$/.test(runtimeTarget)) continue;
  const specifier = pkg.name + (key === '.' ? '' : key.slice(1));
  const resolved = import.meta.resolve(specifier);
  assert.ok(resolved, `Public import does not resolve: ${specifier}`);
  await import(specifier);
  checked.push({ key, specifier, resolved: pathToFileURL(path.resolve(root, runtimeTarget)).href });
}

if (pkg.name === '@ultrst-armada/krnl') {
  const core = JSON.parse(fs.readFileSync(path.join(root, 'packages/core/package.json'), 'utf8'));
  assert.equal(core.dependencies?.['@dinilmusick/gutts'], pkg.dependencies?.['@dinilmusick/gutts'],
    'KrnlTS core and root must use the same supported GutTS release range');
  assert.ok(core.exports?.['./node'], 'Core package must expose explicit Node adapters');

  const portable = await import(pathToFileURL(path.join(root, 'packages/core/dist/index.js')).href);
  const node = await import(pathToFileURL(path.join(root, 'packages/core/dist/node.js')).href);
  for (const name of ['HttpProtocolAdapter', 'WebSocketProtocolAdapter', 'UdpProtocolAdapter', 'KrnlPackageReconciler', 'gutts']) {
    assert.equal(name in portable, false, 'Portable kernel must not export Node-only API: ' + name);
  }
  for (const name of ['HttpProtocolAdapter', 'WebSocketProtocolAdapter', 'UdpProtocolAdapter', 'KrnlPackageReconciler']) {
    assert.equal(typeof node[name], 'function', 'Node entrypoint must export adapter: ' + name);
  }
  assert.ok(node.gutts && typeof node.gutts === 'object',
    'Node compatibility entrypoint must preserve the GutTS namespace export');
}
if (pkg.name === '@ultrst-armada/frnlts') {
  assert.equal(pkg.dependencies?.typescript, undefined,
    'TypeScript compiler tooling must not be a root production dependency');
  assert.ok(pkg.devDependencies?.typescript, 'TypeScript must remain available to build and type-check FrnlTS');
}
if (pkg.name === '@dinilmusick/gutts') {
  const higherLevel = Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies })
    .filter((name) => name.startsWith('@ultrst-armada/'));
  assert.deepEqual(higherLevel, [], 'GutTS must not depend on higher-level ecosystem packages');
}

assert.ok(checked.length > 0, 'At least one JavaScript public entry point must be import-tested');
console.log(JSON.stringify({ package: pkg.name, publicEntryPointsImported: checked }, null, 2));
