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
  const packedJson = execFileSync('npm', ['pack', '--json', '--pack-destination', packDir], { cwd: root, encoding: 'utf8' });
  const packed = JSON.parse(packedJson);
  assert.ok(packed[0]?.filename, 'npm pack must return the published tarball filename');
  const tarball = path.join(packDir, packed[0].filename);

  execFileSync('tar', ['-xzf', tarball, '-C', unpackedDir, '--strip-components=1']);
  const publishedManifest = JSON.parse(fs.readFileSync(path.join(unpackedDir, 'package.json'), 'utf8'));
  const validatorDeclaration = fs.readFileSync(path.join(unpackedDir, 'packages/validate/dist/index.d.ts'), 'utf8');
  assert.ok(
    !validatorDeclaration.includes("from 'ts-morph'") && !validatorDeclaration.includes('from "ts-morph"'),
    'Validator declarations must not expose Node-only ts-morph types',
  );

  assert.equal(publishedManifest.name, packageName);
  assert.equal(publishedManifest.version, version);
  for (const forbidden of ['esbuild', 'ts-morph', 'ws']) {
    assert.ok(!Object.hasOwn(publishedManifest.dependencies ?? {}, forbidden), `Universal install must not pull Node-only package ${forbidden}`);
    assert.equal(publishedManifest.peerDependenciesMeta?.[forbidden]?.optional, true, `${forbidden} must be an optional peer for Node-only subpaths`);
  }
  assert.ok(publishedManifest.exports && typeof publishedManifest.exports === 'object',
    'published artifact must contain its explicit exports map');
  assert.equal(
    publishedManifest.bin?.krnl,
    'packages/cli/dist/bin/krnl.js',
    'published artifact must retain the normalized krnl CLI executable mapping',
  );
  assert.ok(
    fs.existsSync(path.join(unpackedDir, publishedManifest.bin.krnl)),
    'published krnl CLI executable target must exist in the tarball',
  );


  execFileSync('npm', ['install', '--prefix', consumerDir, '--ignore-scripts', '--no-audit', '--no-fund', tarball],
    { stdio: 'inherit' });

  // The universal root and Fetch subpath must work before optional Node peers are installed.
  const portableSpecifiers = [packageName, packageName + '/fetch'];
  for (const specifier of portableSpecifiers) {
    const esmCode = `const m = await import(${JSON.stringify(specifier)}); if (typeof m.FetchProtocolAdapter !== 'function') throw new Error('Fetch export missing from ' + ${JSON.stringify(specifier)});`;
    execFileSync(process.execPath, ['--input-type=module', '-e', esmCode], { cwd: consumerDir, stdio: 'inherit' });
    const cjsCode = `const m = require(${JSON.stringify(specifier)}); if (typeof m.FetchProtocolAdapter !== 'function') throw new Error('Fetch export missing from ' + ${JSON.stringify(specifier)});`;
    execFileSync(process.execPath, ['-e', cjsCode], { cwd: consumerDir, stdio: 'inherit' });
  }

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
  const commonJsImported = [];
  for (const [key, value] of Object.entries(publishedManifest.exports)) {
    const cjs = typeof value === 'string' ? value : value?.require;
    if (!cjs || !/\.(?:cjs|js)$/.test(cjs)) continue;
    const specifier = packageName + (key === '.' ? '' : key.slice(1));
    const code = `require(${JSON.stringify(specifier)}); console.log('required ${specifier}')`;
    execFileSync(process.execPath, ['-e', code], { cwd: consumerDir, stdio: 'inherit' });
    commonJsImported.push(specifier);
  }
  assert.ok(imported.length > 0, 'at least one published JavaScript entry point must be imported');
  assert.ok(commonJsImported.includes(packageName) && commonJsImported.includes(packageName + '/fetch'), 'root and Fetch CommonJS exports must both import successfully');
  const cliExecutable = path.join(
    consumerDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'krnl.cmd' : 'krnl',
  );
  assert.ok(fs.existsSync(cliExecutable), 'npm consumer must receive the krnl CLI executable link');
  const cliHelp = execFileSync(cliExecutable, ['--help'], { cwd: consumerDir, encoding: 'utf8' });
  assert.match(cliHelp, /Usage: krnl/, 'installed krnl CLI must execute from the published tarball');

  console.log(JSON.stringify({ package: packageName, version, localTarball: packed[0].filename, optionalPeersInstalled, portableEntryPointsImported: portableSpecifiers, imported, commonJsImported }, null, 2));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
