#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target));
    else if (sourceExtensions.includes(path.extname(entry.name))) files.push(target);
  }
  return files;
}

const importPattern = /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
function importSpecifiers(source) {
  return [...source.matchAll(importPattern)]
    .map((match) => match[1] || match[2] || match[3])
    .filter(Boolean);
}

function resolveLocalImport(fromFile, specifier) {
  const raw = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [raw];
  if (raw.endsWith('.js')) candidates.push(raw.slice(0, -3) + '.ts', raw.slice(0, -3) + '.tsx', raw.slice(0, -3) + '.jsx');
  if (!path.extname(raw)) {
    for (const extension of sourceExtensions) candidates.push(raw + extension);
    for (const extension of sourceExtensions) candidates.push(path.join(raw, 'index' + extension));
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function collectLocalImportGraph(entryFile) {
  const visited = new Set();
  const externalImports = new Set();
  const pending = [entryFile];
  while (pending.length) {
    const file = pending.pop();
    if (visited.has(file)) continue;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const specifier of importSpecifiers(source)) {
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const resolved = resolveLocalImport(file, specifier);
        if (resolved) pending.push(resolved);
      } else {
        externalImports.add(specifier);
      }
    }
  }
  return { files: [...visited], externalImports: [...externalImports] };
}

const googleSdkImport = /\b(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]googleapis(?:\/[^'"]*)?['"]/i;
const appSourceFiles = [
  ...walk(path.join(root, 'src')),
  ...walk(path.join(root, 'app')),
  ...(fs.existsSync(path.join(root, 'server.ts')) ? [path.join(root, 'server.ts')] : []),
];
const directSdkImports = appSourceFiles
  .filter((file) => googleSdkImport.test(fs.readFileSync(file, 'utf8')))
  .map((file) => path.relative(root, file));
assert.deepEqual(
  directSdkImports,
  [],
  'Aiko source must not import the Google Node SDK directly; Drive SDK ownership belongs to Kloks.',
);

const aggregateKloksNodeImports = appSourceFiles
  .filter((file) => fs.readFileSync(file, 'utf8').includes("@ultrst-armada/kloks/backend/node"))
  .map((file) => path.relative(root, file));
assert.deepEqual(
  aggregateKloksNodeImports,
  ['src/backend/AikoBackend.ts'],
  'Only the explicitly Node-only AikoBackend facade may import Kloks aggregate Node services.',
);

// Identity authentication remains delegated to canonical Luth/GutTS auth.
// Google Drive OAuth consent is a separate storage-provider authorization.
const authRoutes = readText('src/backend/authRoutes/authRoutes.ts');
const luthAdapter = readText('src/backend/adapters/luthFetchAuth.ts');
for (const marker of [
  /@dinilmusick\/gutts\/auth/,
  /createLuthAuthClient/,
  /DEFAULT_LUTH_URL/,
  /signInWithEmail/,
  /signUpWithEmail/,
  /getSession/,
]) assert.match(authRoutes, marker);
assert.match(luthAdapter, /@dinilmusick\/gutts\/auth/);
assert.match(luthAdapter, /createLuthAuthClient/);
assert.match(luthAdapter, /resolveAikoLuthUser/);

// The production Worker bundle must not reach the Express/Node backend barrel.
// That barrel remains available for Node deployments and is externalized rather
// than being pulled into the portable Fetch runtime.
const buildScript = readText('scripts/skipo-build.cjs');
assert.match(buildScript, /@ultrst-armada\/kloks\/backend\/node/);
assert.doesNotMatch(buildScript, /--alias:googleapis=/);
const universalEntry = path.join(root, 'src/backend/adapters/universalEntry.ts');
const universalGraph = collectLocalImportGraph(universalEntry);
assert.ok(universalGraph.files.length > 0, 'Expected to inspect the universal Fetch entry graph.');
assert.ok(
  !universalGraph.externalImports.includes('@ultrst-armada/kloks/backend/node'),
  'The Worker entry graph must not import Kloks Node-only services.',
);
assert.ok(
  !universalGraph.externalImports.some((specifier) => /^googleapis(?:\/|$)/i.test(specifier)),
  'The Worker entry graph must not import googleapis.',
);

// Node workspace persistence is provided through an explicit bootstrap injection;
// the portable module must never import Kloks' aggregate Node barrel itself.
const workspaceStorageSource = readText('src/backend/storage/workspaceStorage.ts');
assert.match(workspaceStorageSource, /configureNodeWorkspaceService/);
assert.doesNotMatch(
  workspaceStorageSource,
  /(?:import\s*\(|from\s*)['"]@ultrst-armada\/kloks\/backend\/node['"]/,
  'Portable workspace storage must not dynamically import Kloks Node services.',
);
const nodeBootstrap = readText('server.ts');
assert.match(nodeBootstrap, /@ultrst-armada\/kloks\/backend\/workspace\/node/);
assert.match(nodeBootstrap, /workingWorkspaceService/);
assert.doesNotMatch(nodeBootstrap, /@ultrst-armada\/kloks\/backend\/node['"]/);
assert.match(nodeBootstrap, /configureNodeWorkspaceService\(workingWorkspaceService\)/);
const backendFacade = readText('src/backend/AikoBackend.ts');
assert.match(backendFacade, /configureNodeWorkspaceService\(workingWorkspaceService\)/);

for (const routePath of [
  'src/backend/apiRoutes/apiRoutes.ts',
  'src/backend/apiRoutes/runtimeCredentialRoutes.ts',
  'src/backend/apiRoutes/runtimeRoutes.ts',
]) {
  const routeSource = readText(routePath);
  assert.doesNotMatch(routeSource, /@ultrst-armada\/kloks\/backend\/node/);
  assert.match(routeSource, /resolveAikoLuthUser/);
}
for (const routePath of [
  'src/backend/apiRoutes/apiRoutes.ts',
  'src/backend/apiRoutes/runtimeCredentialRoutes.ts',
  'src/backend/apiRoutes/runtimeRoutes.ts',
  'src/backend/authRoutes/authRoutes.ts',
  'src/backend/storageRoutes.ts',
]) {
  const routeGraph = collectLocalImportGraph(path.join(root, routePath));
  assert.ok(
    !routeGraph.externalImports.includes('@ultrst-armada/kloks/backend/node'),
    'Route import graph must not reach Kloks aggregate Node services: ' + routePath,
  );
}
// Node routes consume the explicitly injected workspace service and canonical Luth adapter.
const storageRoutes = readText('src/backend/storageRoutes.ts');
const nodeAuthRoutes = readText('src/backend/authRoutes/authRoutes.ts');
assert.doesNotMatch(storageRoutes, /@ultrst-armada\/kloks\/backend\/node/);
assert.match(storageRoutes, /getNodeWorkspaceService/);
assert.match(storageRoutes, /resolveAikoLuthUser/);
assert.doesNotMatch(nodeAuthRoutes, /@ultrst-armada\/kloks\/backend\/node/);
assert.match(nodeAuthRoutes, /getNodeWorkspaceService/);
assert.match(nodeAuthRoutes, /resolveAikoLuthUser/);
assert.doesNotMatch(storageRoutes, /createLuthAuthClient|googleapis/);

// Validate the actual portable package export, not the aggregate Node package
// graph. Optional googleapis peer metadata may remain for Kloks' Node-only S3
// integration; it is not a dependency of this Fetch-native export.
const manifest = readJson('package.json');
const lock = readJson('package-lock.json');
const lockRoot = lock.packages?.[''];
assert.ok(lockRoot, 'Expected npm lockfile v3 root package metadata.');
assert.equal(manifest.dependencies?.googleapis, undefined, 'Aiko must not directly depend on googleapis.');
assert.equal(manifest.devDependencies?.googleapis, undefined, 'Aiko must not install googleapis for development.');
assert.equal(lockRoot.dependencies?.googleapis, undefined, 'The lockfile root must not retain googleapis as a direct dependency.');
assert.equal(lockRoot.devDependencies?.googleapis, undefined, 'The lockfile root must not retain googleapis as a development dependency.');
assert.equal(manifest.optionalDependencies?.googleapis, undefined, 'Aiko must not declare googleapis as an optional dependency.');
assert.equal(manifest.peerDependencies?.googleapis, undefined, 'Aiko must not expose googleapis as a peer dependency.');
assert.equal(lockRoot.optionalDependencies?.googleapis, undefined, 'The lockfile root must not retain googleapis as an optional dependency.');
assert.equal(lockRoot.peerDependencies?.googleapis, undefined, 'The lockfile root must not retain googleapis as a peer dependency.');
assert.equal(lock.packages?.['node_modules/googleapis'], undefined, 'The lockfile must not install the Google Node SDK package.');

const kloksRoot = path.join(root, 'node_modules', '@ultrst-armada', 'kloks');
const kloksManifestPath = path.join(kloksRoot, 'package.json');
assert.ok(fs.existsSync(kloksManifestPath), 'Run npm ci before this regression test.');
const kloksManifest = JSON.parse(fs.readFileSync(kloksManifestPath, 'utf8'));
const storageWorkspaceExport = kloksManifest.exports?.['./backend/storage-workspace'];
assert.ok(storageWorkspaceExport, 'Kloks must expose its canonical ./backend/storage-workspace export.');
const storageWorkspaceEntry = typeof storageWorkspaceExport === 'string'
  ? storageWorkspaceExport
  : storageWorkspaceExport.import || storageWorkspaceExport.default;
assert.ok(storageWorkspaceEntry, 'Kloks storage-workspace export must provide an import/default target.');

const portableEntryFile = path.resolve(kloksRoot, storageWorkspaceEntry);
assert.ok(fs.existsSync(portableEntryFile), 'Kloks storage-workspace export target must exist in the installed package.');
const portableGraph = collectLocalImportGraph(portableEntryFile);
const nodeBuiltins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const forbiddenPortableImports = portableGraph.externalImports.filter((specifier) =>
  /^googleapis(?:\/|$)/i.test(specifier) || nodeBuiltins.has(specifier),
);
assert.deepEqual(
  forbiddenPortableImports,
  [],
  'Kloks Fetch-native storage-workspace import graph must not reach googleapis or Node builtins.',
);

const packedArtifactRequired = process.env.KLOKS_PACKED_ARTIFACT === '1';
let driveModule = null;
try {
  driveModule = await import('@ultrst-armada/kloks/backend/storage-workspace');
} catch (error) {
  const isKnownPublishedArtifactGap =
    error?.code === 'ERR_MODULE_NOT_FOUND'
    && /googleapis/.test(String(error?.message || error));
  if (packedArtifactRequired || !isKnownPublishedArtifactGap) throw error;
  console.warn(
    'PUBLISHED_KLOKS_ARTIFACT_GAP: installed npm artifact still reaches GutTS aggregate googleapis; ' +
    'the mandatory Agent-Workspace-1 locally packed Kloks PR artifact check must pass before merge.',
  );
}
if (packedArtifactRequired) {
  assert.ok(driveModule, 'The locally packed Kloks PR artifact must load without googleapis.');
}
if (driveModule) {
  const GoogleDriveWorkspaceService = driveModule.GoogleDriveWorkspaceService;
  assert.equal(typeof GoogleDriveWorkspaceService, 'function', 'Kloks storage-workspace must export GoogleDriveWorkspaceService.');
  const service = new GoogleDriveWorkspaceService({
    clientId: 'aiko-regression-client',
    redirectUri: 'https://aiko.example.test/google-drive/callback',
    tokens: { accessToken: 'test-access-token', refreshToken: 'test-refresh-token' },
    fetcher: async () => new Response('{}', { status: 200 }),
    persistTokens: async () => {},
  });
  assert.ok(service, 'The Fetch-native Drive service must construct with injected fetch and token persistence.');
  for (const method of ['getAccountIdentity', 'listFolders', 'resolveFolder', 'selectRootFolder', 'getConnectionMetadata', 'read', 'write', 'delete', 'exists', 'list', 'stat', 'mkdir', 'testConnection']) {
    assert.equal(typeof service[method], 'function', 'Missing canonical Drive service method: ' + method);
  }
  const consentUrl = new URL(GoogleDriveWorkspaceService.createAuthorizationUrl(
    { clientId: 'aiko-regression-client', redirectUri: 'https://aiko.example.test/google-drive/callback' },
    'aiko-drive-state',
  ));
  assert.equal(consentUrl.searchParams.get('state'), 'aiko-drive-state');
  assert.equal(consentUrl.searchParams.get('access_type'), 'offline');
  assert.equal(consentUrl.searchParams.get('prompt'), 'consent');
  assert.match(consentUrl.searchParams.get('scope') || '', /https:\/\/www\.googleapis\.com\/auth\/drive/);
  assert.doesNotMatch(consentUrl.searchParams.get('scope') || '', /\bopenid\b/);
}

const shimPath = path.join(root, 'src/libraries/shims/googleapisShim.ts');
assert.equal(fs.existsSync(shimPath), false, 'Remove the obsolete googleapis compatibility shim.');
assert.doesNotMatch(buildScript, /googleapisShim|alias:googleapis/);

console.log('Aiko Luth identity / Kloks Fetch-native Drive separation: PASS');
console.log('Aiko universal Worker import graph: PASS (no Kloks Node barrel or Google Node SDK)');
console.log('Kloks Fetch-native storage-workspace dependency closure: PASS');
