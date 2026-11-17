import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { builtinModules } from 'node:module';

const dist = resolve(process.cwd(), 'packages/backend/dist');
const functionsDist = resolve(process.cwd(), 'packages/functions/dist');
const builtins = new Set(builtinModules.flatMap((name) => [name, 'node:' + name]));
const blocked = ['LocalFSAdapter', 'GoogleDriveAdapter', 'GoogleDriveOAuth',
  'WorkingWorkspaceService', 'nodeGraphPersistence', '/server/', '/core/',
  'unifiedDb', 'workspaceSyncEngine', '/client/'];

function graphFrom(root: string, entry: string) {
  const files = new Set<string>();
  const imports = new Set<string>();
  const external = new Set<string>();
  const pending = [resolve(root, entry)];
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  while (pending.length) {
    const file = pending.pop()!;
    if (files.has(file) || !existsSync(file)) continue;
    files.add(file);
    const source = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const specifier = match[1];
        if (builtins.has(specifier)) imports.add(specifier);
        else if (specifier.startsWith('.')) {
          const target = resolve(dirname(file), specifier);
          if (existsSync(target)) pending.push(target);
        } else {
          external.add(specifier);
        }
      }
    }
  }
  return { files: [...files], builtins: [...imports], external: [...external] };
}

function graph(entry: string) {
  return graphFrom(dist, entry);
}

describe('Kloks portable and Node dependency graphs', () => {
  it('keeps portable backend exports free of Node built-ins and server adapters', () => {
    const result = graph('index.js');
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.builtins).toEqual([]);
    expect(result.external.some((specifier) => specifier === '@kloks/functions' || specifier.startsWith('@kloks/functions/'))).toBe(false);
    expect(result.external.some((specifier) => specifier.startsWith('@kloks/'))).toBe(false);
    expect(result.external).not.toContain('@ultrst-armada/krnl');
    expect(result.files.some((file) => file.includes('client/'))).toBe(false);
    for (const file of result.files) {
      for (const name of blocked) expect(file).not.toContain(name);
    }
  });

  it('keeps the default functions entry portable and retains Node utilities behind /node', () => {
    const portable = graphFrom(functionsDist, 'index.js');
    expect(portable.builtins).toEqual([]);
    expect(portable.files.some((file) => /\/(?:fs|fs-lock|shell)\.js$/.test(file))).toBe(false);

    const portableFunctions = graphFrom(functionsDist, 'portable.js');
    expect(portableFunctions.builtins).toEqual([]);
    expect(portableFunctions.external).not.toContain('@ultrst-armada/krnl');

    const nodeFunctions = graphFrom(functionsDist, 'node.js');
    expect(nodeFunctions.external).not.toContain('@ultrst-armada/krnl');
    expect(nodeFunctions.builtins.some((name) => ['fs', 'node:fs'].includes(name))).toBe(true);
    expect(nodeFunctions.builtins.some((name) => ['child_process', 'node:child_process'].includes(name))).toBe(true);
  });

  it('retains Node filesystem capabilities behind explicit adapters', () => {
    const result = graph('node.js');
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.builtins.some((name) => ['fs', 'node:fs'].includes(name))).toBe(true);
    expect(result.builtins.some((name) => ['path', 'node:path'].includes(name))).toBe(true);
    expect(result.external.some((specifier) => specifier === '@kloks/functions' || specifier.startsWith('@kloks/functions/'))).toBe(false);
  });


  it('keeps the portable Krnl service facade separate from Node-only storage factories', () => {
    const result = graph('krnl-services.js');
    expect(result.files.length).toBeGreaterThan(0);
    // The shared Fetch-facing facade may use guarded Web/Node fallback helpers,
    // but must not statically import the filesystem adapter graph.
    expect(result.files.some((file) => file.endsWith('/storage/LocalFSAdapter.js'))).toBe(false);
    expect(result.files.some((file) => file.endsWith('/storage/StorageAdapterFactory.js'))).toBe(false);
    expect(result.files.some((file) => file.endsWith('/services/workspaceGraphService.js'))).toBe(false);
    expect(result.files.some((file) => file.endsWith('/core/SrklStorageService.js'))).toBe(false);

    const source = readFileSync(resolve(process.cwd(), 'packages/backend/src/krnl-services.ts'), 'utf8');
    expect(source).not.toContain('StorageAdapterFactory');
    expect(source).not.toContain('workspaceGraphService');
    expect(source).not.toMatch(/\bfrom\s+['"](?:node:|fs(?:\/|['"])|path(?:\/|['"]))/);
    expect(source).not.toMatch(/\bimport\(\s*['"](?:node:|fs(?:\/|['"])|path(?:\/|['"]))/);
  });

  it('keeps filesystem-backed graph services behind the explicit Node backend entrypoint', () => {
    const portableSource = readFileSync(resolve(process.cwd(), 'packages/backend/src/krnl-services.ts'), 'utf8');
    const nodeSource = readFileSync(resolve(process.cwd(), 'packages/backend/src/node.ts'), 'utf8');
    const nodeServicesSource = readFileSync(resolve(process.cwd(), 'packages/backend/src/krnl-services.node.ts'), 'utf8');

    expect(portableSource).not.toContain('workspaceGraphService');
    expect(portableSource).not.toContain('StorageAdapterFactory');
    expect(nodeSource).toContain("export * from './krnl-services.node.js';");
    expect(nodeServicesSource).toContain("from './services/workspaceGraphService.js'");
  });

  it('publishes separate portable and Node adapter package exports', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'packages/backend/package.json'), 'utf8'));
    expect(pkg.exports['.'].import).toBe('./dist/index.js');
    expect(pkg.exports['./node'].import).toBe('./dist/node.js');
    expect(pkg.exports['./storage/node'].import).toBe('./dist/storage/node.js');
    expect(pkg.exports['./services/node'].import).toBe('./dist/services/node.js');
    expect(pkg.exports['./workspace/node'].import).toBe('./dist/workspace/node.js');

    const functionsPkg = JSON.parse(readFileSync(resolve(process.cwd(), 'packages/functions/package.json'), 'utf8'));
    expect(functionsPkg.exports['.'].import).toBe('./dist/index.js');
    expect(functionsPkg.exports['./base'].import).toBe('./dist/base.js');
    expect(functionsPkg.exports['./portable'].import).toBe('./dist/portable.js');
    expect(functionsPkg.exports['./node'].import).toBe('./dist/node.js');

    const rootPkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(rootPkg.exports['./functions'].import).toBe('./packages/functions/dist/index.js');
    expect(rootPkg.exports['./functions/base'].import).toBe('./packages/functions/dist/base.js');
    expect(rootPkg.exports['./functions/portable'].import).toBe('./packages/functions/dist/portable.js');
    expect(rootPkg.exports['./functions/node'].import).toBe('./packages/functions/dist/node.js');
    expect(rootPkg.exports['./backend'].import).toBe('./packages/backend/dist/index.js');
    expect(rootPkg.exports['./backend/node'].import).toBe('./packages/backend/dist/node.js');
    expect(rootPkg.exports['./backend/storage/node'].import).toBe('./packages/backend/dist/storage/node.js');
    expect(rootPkg.exports['./backend/services/node'].import).toBe('./packages/backend/dist/services/node.js');
    expect(rootPkg.exports['./backend/workspace/node'].import).toBe('./packages/backend/dist/workspace/node.js');
  });
});
