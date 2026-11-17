import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const manifest = readJson('package.json');
const lock = readJson('package-lock.json');

const pinned = {
  '@dinilmusick/gutts': '2.1.1',
  '@ultrst-armada/krnl': '1.0.25',
  '@ultrst-armada/frnlts': '0.5.23',
  '@ultrst-armada/kloks': '2.0.5',
  '@ultrst-armada/floks': '2.0.6',
};

for (const [name, version] of Object.entries(pinned)) {
  assert.equal(manifest.dependencies?.[name], version, `package.json must pin ${name}@${version}`);
  assert.equal(lock.packages?.['']?.dependencies?.[name], version, `package-lock root must pin ${name}@${version}`);

  const lockEntry = lock.packages?.[`node_modules/${name}`];
  assert.ok(lockEntry, `package-lock is missing ${name}`);
  assert.equal(lockEntry.version, version, `package-lock resolved the wrong ${name} version`);
  assert.match(lockEntry.resolved || '', /^https:\/\/registry\.npmjs\.org\//, `${name} must resolve from the public npm registry`);
  assert.match(lockEntry.integrity || '', /^sha512-/, `${name} must have an npm SHA-512 integrity digest`);

  const installedManifestPath = path.join(root, 'node_modules', name, 'package.json');
  assert.ok(existsSync(installedManifestPath), `${name} is not installed; run npm ci first`);
  const installed = JSON.parse(readFileSync(installedManifestPath, 'utf8'));
  assert.equal(installed.version, version, `installed ${name} version does not match the lockfile`);
}

const packageJson = (name) => JSON.parse(readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
const exportTarget = (value) => typeof value === 'string'
  ? value
  : value?.import || value?.default || value?.node || value?.require || value?.types;

const requiredExports = {
  '@dinilmusick/gutts': ['.'],
  '@ultrst-armada/krnl': ['.'],
  '@ultrst-armada/frnlts': ['.', './react'],
  '@ultrst-armada/kloks': ['.', './auth', './backend', './backend/node'],
  '@ultrst-armada/floks': ['.', './ui'],
};

for (const [name, subpaths] of Object.entries(requiredExports)) {
  const installed = packageJson(name);
  for (const subpath of subpaths) {
    const target = exportTarget(installed.exports?.[subpath]);
    assert.ok(target, `${name} is missing public export ${subpath}`);
    assert.ok(existsSync(path.resolve(root, 'node_modules', name, target)), `${name} export ${subpath} points to missing file ${target}`);
  }
}

const kloksLock = lock.packages['node_modules/@ultrst-armada/kloks'];
assert.notEqual(kloksLock.version, '1.24.11', 'known flagged Kloks 1.24.11 must never enter the SRKL lockfile');

const sourceRoot = path.join(root, 'src');
const sourceFiles = [];
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.(?:[cm]?[jt]sx?)$/i.test(entry.name)) sourceFiles.push(full);
  }
}
collect(sourceRoot);

const forbiddenSourcePatterns = [
  { pattern: /fetchCloudflareData/, label: 'SRKL must not call the Kloks Cloudflare fallback helper' },
  { pattern: /serviceId=cloudflare&token=/i, label: 'SRKL must not forward Cloudflare tokens in URL query strings' },
];
for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  for (const { pattern, label } of forbiddenSourcePatterns) {
    assert.equal(pattern.test(content), false, `${label}: ${path.relative(root, file)}`);
  }
}

const kloksRoot = path.join(root, 'node_modules', '@ultrst-armada', 'kloks');
const kloksJavaScriptFiles = [];
function collectKloksArtifacts(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collectKloksArtifacts(full);
    else if (/\.(?:[cm]?js)$/i.test(entry.name)) kloksJavaScriptFiles.push(full);
  }
}
collectKloksArtifacts(kloksRoot);

for (const file of kloksJavaScriptFiles) {
  const content = readFileSync(file, 'utf8');
  assert.equal(
    /serviceId=cloudflare&token=/i.test(content),
    false,
    `Installed Kloks artifact forwards Cloudflare tokens to SRKL: ${path.relative(root, file)}`,
  );
}

console.log('[ecosystem-package-chain] PASS');
console.log('[ecosystem-package-chain] Verified exact npm-resolved versions, registry URLs, integrity digests, installed exports, and SRKL/Kloks Cloudflare credential boundaries.');
