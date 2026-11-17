import { describe, expect, it } from 'vitest';
import { builtinModules, createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import * as ts from 'typescript';

const repositoryRoot = process.cwd();
const builtinNames = new Set(builtinModules.map((name) => name.replace(/^node:/, '')));
const legacyDriveFile = /(?:^|[/\\])(?:GoogleDriveAdapter|GoogleDriveStorageAdapter|GoogleDriveStorageService|GoogleDriveOAuth|googleDriveSdk)(?:\.[cm]?js)?$/i;
const googleSdkSpecifier = /^(?:googleapis|@googleapis)(?:\/|$)/;

function isInside(parent: string, candidate: string): boolean {
  const path = relative(parent, candidate);
  return path === '' || (path !== '..' && !path.startsWith('..' + sep) && !isAbsolute(path));
}

function resolveRelativeImport(fromFile: string, specifier: string): string | undefined {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    base + '.js',
    base + '.mjs',
    base + '.cjs',
    base + '.json',
    join(base, 'index.js'),
    join(base, 'index.mjs'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function readModuleSpecifiers(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const specifiers = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node)) {
      const firstArgument = node.arguments[0];
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if ((isDynamicImport || isRequire) && firstArgument && ts.isStringLiteralLike(firstArgument)) {
        specifiers.add(firstArgument.text);
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return [...specifiers];
}

type ImportGraph = {
  files: string[];
  builtins: string[];
  googleSdkImports: string[];
  legacyDriveFiles: string[];
  legacyDriveImports: string[];
  unresolvedRelativeImports: string[];
  externalImports: string[];
};

function inspectPackedImportGraph(entryFile: string, consumerRoot: string): ImportGraph {
  const visited = new Set<string>();
  const builtins = new Set<string>();
  const googleSdkImports = new Set<string>();
  const legacyDriveFiles = new Set<string>();
  const legacyDriveImports = new Set<string>();
  const unresolvedRelativeImports = new Set<string>();
  const externalImports = new Set<string>();
  const pending = [resolve(entryFile)];

  while (pending.length > 0) {
    const file = pending.pop()!;
    if (visited.has(file) || !existsSync(file)) continue;
    visited.add(file);

    if (legacyDriveFile.test(file)) legacyDriveFiles.add(relative(consumerRoot, file));

    for (const specifier of readModuleSpecifiers(file)) {
      const builtinName = specifier.replace(/^node:/, '');
      if (builtinNames.has(builtinName)) {
        builtins.add(specifier);
        continue;
      }
      if (googleSdkSpecifier.test(specifier)) {
        googleSdkImports.add(specifier);
        continue;
      }
      if (legacyDriveFile.test(specifier)) {
        legacyDriveImports.add(specifier);
      }

      if (specifier.startsWith('.')) {
        const target = resolveRelativeImport(file, specifier);
        if (target) pending.push(target);
        else unresolvedRelativeImports.add(relative(consumerRoot, file) + ' -> ' + specifier);
        continue;
      }

      externalImports.add(specifier);
      try {
        const resolved = createRequire(file).resolve(specifier);
        if (isInside(consumerRoot, resolved)) pending.push(resolved);
      } catch {
        // Optional peer dependencies may not be installed in this clean consumer.
        // Their specifiers are still recorded above, so forbidden imports fail.
      }
    }
  }

  return {
    files: [...visited].map((file) => relative(consumerRoot, file)).sort(),
    builtins: [...builtins].sort(),
    googleSdkImports: [...googleSdkImports].sort(),
    legacyDriveFiles: [...legacyDriveFiles].sort(),
    legacyDriveImports: [...legacyDriveImports].sort(),
    unresolvedRelativeImports: [...unresolvedRelativeImports].sort(),
    externalImports: [...externalImports].sort(),
  };
}

function exportImportTarget(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.import === 'string') return record.import;
  if (typeof record.default === 'string') return record.default;
  return undefined;
}

const packedConsumerProgram = [
  "import assert from 'node:assert/strict';",
  '',
  'const savedProcess = Object.getOwnPropertyDescriptor(globalThis, "process");',
  'const savedBuffer = Object.getOwnPropertyDescriptor(globalThis, "Buffer");',
  'const restoreGlobals = () => {',
  '  if (savedProcess) Object.defineProperty(globalThis, "process", savedProcess);',
  '  if (savedBuffer) Object.defineProperty(globalThis, "Buffer", savedBuffer);',
  '};',
  '',
  'let service;',
  'let storageWorkspace;',
  'try {',
  '  if (savedProcess) Object.defineProperty(globalThis, "process", { configurable: true, enumerable: savedProcess.enumerable, writable: true, value: undefined });',
  '  if (savedBuffer) Object.defineProperty(globalThis, "Buffer", { configurable: true, enumerable: savedBuffer.enumerable, writable: true, value: undefined });',
  '',
  '  const backend = await import("@ultrst-armada/kloks/backend");',
  '  storageWorkspace = await import("@ultrst-armada/kloks/backend/storage-workspace");',
  '  assert.ok(backend, "The packed portable backend entrypoint must resolve.");',
  '  assert.equal(typeof storageWorkspace.GoogleDriveWorkspaceService, "function", "The packed storage-workspace entrypoint must export GoogleDriveWorkspaceService.");',
  '  assert.equal(storageWorkspace.GOOGLE_DRIVE_WORKSPACE_SCOPE, "https://www.googleapis.com/auth/drive");',
  '',
  '  service = new storageWorkspace.GoogleDriveWorkspaceService({',
  '    clientId: "test-client-id",',
  '    clientSecret: "server-only-test-secret",',
  '    redirectUri: "https://consumer.invalid/google/callback",',
  '    tokens: { accessToken: "expired-access-token", refreshToken: "existing-refresh-token", expiresAt: 1 },',
  '    fetcher: async () => { throw new Error("The injected fetcher must not run until Node globals are restored."); },',
  '    persistTokens: async () => {},',
  '  });',
  '  assert.equal(service.getConnectionMetadata().provider, "google_drive");',
  '  assert.equal(JSON.stringify(service.getConnectionMetadata()).includes("server-only-test-secret"), false);',
  '} finally {',
  '  restoreGlobals();',
  '}',
  '',
  'const requests = [];',
  'const persisted = [];',
  'service = new storageWorkspace.GoogleDriveWorkspaceService({',
  '  clientId: "test-client-id",',
  '  clientSecret: "server-only-test-secret",',
  '  redirectUri: "https://consumer.invalid/google/callback",',
  '  tokens: { accessToken: "expired-access-token", refreshToken: "existing-refresh-token", expiresAt: 1 },',
  '  fetcher: async (input, init = {}) => {',
  '    const url = String(input);',
  '    requests.push({ url, init });',
  '    if (url === "https://oauth2.googleapis.com/token") {',
  '      return new Response(JSON.stringify({ access_token: "fresh-access-token", expires_in: 3600 }), {',
  '        status: 200,',
  '        headers: { "content-type": "application/json" },',
  '      });',
  '    }',
  '    if (url.startsWith("https://www.googleapis.com/drive/v3/about")) {',
  '      return new Response(JSON.stringify({ user: { permissionId: "test-drive-account", emailAddress: "drive@example.invalid" } }), {',
  '        status: 200,',
  '        headers: { "content-type": "application/json" },',
  '      });',
  '    }',
  '    return new Response("unexpected request", { status: 500 });',
  '  },',
  '  persistTokens: async (tokens) => { persisted.push(tokens); },',
  '});',
  '',
  'const identity = await service.getAccountIdentity();',
  'assert.equal(identity.accountId, "test-drive-account");',
  'assert.equal(identity.email, "drive@example.invalid");',
  'assert.equal(requests.length, 2, "Token refresh and Drive identity must both use the injected fetcher.");',
  'assert.equal(requests[0].url, "https://oauth2.googleapis.com/token");',
  'assert.equal(new Headers(requests[1].init.headers).get("authorization"), "Bearer fresh-access-token", "Drive requests must send the refreshed bearer token.");',
  'assert.equal(persisted.length, 1, "A successful token refresh must invoke injected persistence.");',
  'assert.equal(persisted[0].accessToken, "fresh-access-token");',
  'assert.equal(persisted[0].refreshToken, "existing-refresh-token", "Google omission of a replacement refresh token must preserve the existing token.");',
  'assert.equal(service.getConnectionMetadata().provider, "google_drive");',
  'assert.equal(JSON.stringify(service.getConnectionMetadata()).includes("server-only-test-secret"), false);',
  'console.log(JSON.stringify({ backendImported: true, storageWorkspaceImported: true, driveServiceInstantiatedWithoutNodeGlobals: true, injectedFetchCalls: requests.length, persistedRefresh: true }));',
].join('\n');

describe('Kloks packed portable runtime closure', () => {
  it('imports the packed backend and Fetch-native Drive service from an isolated consumer and proves the built dependency closure', async () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'kloks-packed-runtime-closure-'));
    const packDirectory = join(temporaryRoot, 'pack');
    const consumerDirectory = join(temporaryRoot, 'consumer');
    mkdirSync(packDirectory, { recursive: true });
    mkdirSync(consumerDirectory, { recursive: true });

    try {
      execFileSync(
        'npm',
        ['pack', '--ignore-scripts', '--pack-destination', packDirectory],
        { cwd: repositoryRoot, encoding: 'utf8', timeout: 120_000 },
      );
      // Do not depend on npm CLI JSON output shape: the release workflow upgrades
      // npm independently of the project toolchain. The generated tarball itself
      // is the stable artifact contract.
      const packedFiles = readdirSync(packDirectory).filter((name) => name.endsWith('.tgz'));
      expect(packedFiles, 'npm pack must produce exactly one package tarball.').toHaveLength(1);
      const tarball = join(packDirectory, packedFiles[0]);
      const consumerManifest = {
        name: 'kloks-packed-runtime-closure-consumer',
        version: '1.0.0',
        private: true,
        type: 'module',
      };
      writeFileSync(join(consumerDirectory, 'package.json'), JSON.stringify(consumerManifest, null, 2));
      execFileSync(
        'npm',
        ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', tarball],
        { cwd: consumerDirectory, encoding: 'utf8', timeout: 240_000 },
      );

      const packageDirectory = join(consumerDirectory, 'node_modules', '@ultrst-armada', 'kloks');
      const packedManifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8')) as {
        name?: string;
        version?: string;
        exports?: Record<string, unknown>;
      };
      const portableEntrypoints = [
        ['./backend', 'portable backend'],
        ['./backend/storage-workspace', 'portable Fetch-native storage workspace'],
      ] as const;

      const resolvedEntries = portableEntrypoints.map(([subpath, description]) => {
        const target = exportImportTarget(packedManifest.exports?.[subpath]);
        expect(target, 'The packed package must declare its ' + description + ' export.').toBeTruthy();
        expect(target!.startsWith('./'), 'The ' + description + ' export must resolve inside the package.').toBe(true);
        const entry = resolve(packageDirectory, target!);
        expect(existsSync(entry), 'The packed tarball must contain ' + target + '.').toBe(true);
        return { description, entry };
      });

      const graphResults = resolvedEntries.map(({ description, entry }) => {
        const graph = inspectPackedImportGraph(entry, consumerDirectory);
        expect(graph.files.length, description + ' must have a non-empty packed import graph.').toBeGreaterThan(0);
        expect(graph.builtins, description + ' must not import Node built-ins (including node:stream, node:fs, or node:path).').toEqual([]);
        expect(graph.googleSdkImports, description + ' must not import googleapis or @googleapis packages.').toEqual([]);
        expect(graph.legacyDriveFiles, description + ' must not include a Node-only Google Drive adapter/SDK module.').toEqual([]);
        expect(graph.legacyDriveImports, description + ' must not reference a Node-only Google Drive adapter/SDK module.').toEqual([]);
        expect(graph.unresolvedRelativeImports, description + ' must not contain dangling relative imports in its packed graph.').toEqual([]);
        return { description, files: graph.files.length, builtins: graph.builtins, googleSdkImports: graph.googleSdkImports, legacyDriveFiles: graph.legacyDriveFiles, legacyDriveImports: graph.legacyDriveImports, unresolvedRelativeImports: graph.unresolvedRelativeImports };
      });

      const consumerProgram = join(consumerDirectory, 'consumer.mjs');
      writeFileSync(consumerProgram, packedConsumerProgram);
      const consumerOutput = execFileSync(process.execPath, [consumerProgram], {
        cwd: consumerDirectory,
        encoding: 'utf8',
        timeout: 60_000,
      });
      console.log('[kloks-packed-runtime-closure] ' + JSON.stringify({ package: { name: packedManifest.name, version: packedManifest.version, tarball: packedFiles[0] }, portableEntrypoints: graphResults, consumer: consumerOutput.trim() }));
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }, 360_000);
});
