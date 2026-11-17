import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageName = sourceManifest.name;
const version = sourceManifest.version;
assert.ok(packageName && version, 'package name and version are required for registry verification');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'published-package-boundary-'));
const packDir = path.join(temp, 'pack');
const consumerDir = path.join(temp, 'consumer');
const unpackedDir = path.join(temp, 'unpacked');
fs.mkdirSync(packDir);
fs.mkdirSync(consumerDir);
fs.mkdirSync(unpackedDir);

try {
  const packedJson = execFileSync('npm', ['pack', `${packageName}@${version}`, '--json', '--pack-destination', packDir], { encoding: 'utf8' });
  const packed = JSON.parse(packedJson);
  assert.ok(packed[0]?.filename, 'npm pack must return the published tarball filename');
  const tarball = path.join(packDir, packed[0].filename);

  execFileSync('tar', ['-xzf', tarball, '-C', unpackedDir, '--strip-components=1']);
  const publishedManifest = JSON.parse(fs.readFileSync(path.join(unpackedDir, 'package.json'), 'utf8'));
  assert.equal(publishedManifest.name, packageName);
  assert.equal(publishedManifest.version, version);
  assert.ok(publishedManifest.exports && typeof publishedManifest.exports === 'object',
    'published artifact must contain its explicit exports map');

  execFileSync('npm', ['install', '--prefix', consumerDir, '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { stdio: 'inherit' });

  function collectTargets(value, out = []) {
    if (typeof value === 'string') out.push(value);
    else if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) collectTargets(nested, out);
    }
    return out;
  }
  function runtimeTarget(value) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return null;
    return value.import ?? value.default ?? value.node ?? null;
  }

  const optionalPeers = Object.entries(publishedManifest.peerDependenciesMeta ?? {})
    .filter(([, metadata]) => metadata?.optional)
    .map(([name]) => {
      const range = publishedManifest.peerDependencies?.[name];
      return range ? `${name}@${range}` : null;
    })
    .filter(Boolean);
  let optionalPeersInstalled = false;
  const imported = [];
  for (const [key, value] of Object.entries(publishedManifest.exports)) {
    const allTargets = collectTargets(value);
    for (const target of allTargets) {
      assert.ok(!target.includes('/src/'), `Published export ${key} exposes source path ${target}`);
      assert.ok(fs.existsSync(path.join(unpackedDir, target)), `Published export target is missing: ${key} -> ${target}`);
    }
    const js = runtimeTarget(value);
    if (!js || !/\.(?:mjs|cjs|js)$/.test(js)) continue;
    const specifier = packageName + (key === '.' ? '' : key.slice(1));
    const code = `await import(${JSON.stringify(specifier)}); console.log('imported ${specifier}')`;
    try {
      execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: consumerDir, stdio: 'inherit' });
    } catch (error) {
      if (!optionalPeers.length || optionalPeersInstalled) throw error;
      console.log('Installing declared optional peer providers before testing provider-specific exports.');
      execFileSync('npm', ['install', '--prefix', consumerDir, '--ignore-scripts', '--no-audit', '--no-fund', ...optionalPeers],
        { stdio: 'inherit' });
      optionalPeersInstalled = true;
      execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: consumerDir, stdio: 'inherit' });
    }
    imported.push(specifier);
  }
  assert.ok(imported.length > 0, 'at least one published JavaScript entry point must be imported');
  console.log(JSON.stringify({ package: packageName, version, publishedTarball: packed[0].filename, optionalPeersInstalled, imported }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
