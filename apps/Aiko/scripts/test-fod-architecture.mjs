import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.toml', '.env', '.sh', '.py', '.html', '.css', '.map']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage']);
const productionFiles = new Map();
const testFiles = new Map();

async function walk(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = join(directory, entry.name);
    const path = relative(root, full).replaceAll('\\', '/');
    if (path === 'scripts/test-fod-architecture.mjs') continue;
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) await walk(full);
      continue;
    }
    const extension = entry.name.includes('.') ? '.' + entry.name.split('.').pop() : '';
    if (!extensions.has(extension)) continue;
    const isTest = /\.(?:test|spec)\.[^.]+$/i.test(entry.name) || /(^|\/)tests?\//i.test(path);
    const isDedicatedTestScript = /^scripts\/test-(?!fod-architecture\.mjs$).+\.mjs$/i.test(path);
    if (isTest || isDedicatedTestScript) testFiles.set(path, await readFile(full, 'utf8'));
    else if (/^(src|api|scripts|\.github)\//.test(path)) productionFiles.set(path, await readFile(full, 'utf8'));
  }
}

for (const directory of ['src', 'api', 'scripts', '.github', 'tests']) await walk(join(root, directory));
for (const file of ['server.ts', 'package.json', '.env.example', 'Dockerfile', 'docker-compose.yml', 'wrangler.toml', 'fly.toml', 'render.yaml', 'vercel.json', 'netlify.toml']) {
  try { productionFiles.set(file, await readFile(join(root, file), 'utf8')); } catch {}
}

const sources = [...productionFiles.entries()];
const tests = [...testFiles.entries()];
const corpus = sources.map(([path, text]) => '\n/* ' + path + ' */\n' + text).join('\n');
const testCorpus = tests.map(([path, text]) => '\n/* ' + path + ' */\n' + text).join('\n');

function violations(label, pattern, selected = sources) {
  const found = [];
  for (const [path, text] of selected) {
    if (pattern.test(text)) found.push(label + ': ' + path);
    pattern.lastIndex = 0;
  }
  return found;
}

test('production source and deployment configuration contain no external FOD service contract', () => {
  const found = [
    ...violations('legacy FOD integration variable', /\b(?:FOD_BASE_URL|AIKO_API_URL|AIKO_MODULE_TOKEN)\b/gi),
    ...violations('standalone FOD origin', /https?:\/\/[^\s"']*(?:fod[-.]engine|fod[-.]|\bfod\b)[^\s"']*/gi),
    ...violations('external FOD client adapter', /\bFodClient\b|\bgetEditorUrl\b/gi),
  ];
  assert.deepEqual(found, [], found.join('\n'));
});

test('native editor is not an iframe or remotely hosted FOD application', () => {
  const found = [
    ...violations('remote FOD/workflow iframe', /<iframe\b[^>]*(?:fod|workflow)[^>]*>/gi),
    ...violations('remote FOD editor URL', /(?:src|href)\s*=\s*["'][^"']*(?:fod[-.]engine|FOD_BASE_URL)[^"']*["']/gi),
  ];
  assert.deepEqual(found, [], found.join('\n'));
});

test('engine and runtime node execution contain no HTTP round-trip into Aiko', () => {
  const runtimeSources = sources.filter(([path]) => /(?:workflows\/engine|runtime)/i.test(path));
  const found = [
    ...violations('loopback HTTP call', /(?:fetch|axios\.(?:get|post|put|delete)|https?\.request)\s*\(\s*["']https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\//gi, runtimeSources),
    ...violations('Aiko origin HTTP call from runtime node', /(?:runtimeNode|runtimeAdapter|nodeHandler)[\s\S]{0,500}(?:fetch|axios|http\.request)\s*\([^)]*(?:APP_URL|AIKO_API_URL|localhost)/gi, runtimeSources),
  ];
  assert.deepEqual(found, [], found.join('\n'));
});

test('Luth remains the only identity/session authority', () => {
  const found = [
    ...violations('FOD-local password/session implementation', /(?:fod|FOD)[\w./-]{0,80}(?:passwordHash|hashPassword|verifyPassword|refreshToken|sessionStore|localSession|registerRoute|loginRoute)/gi),
    ...violations('browser-persisted identity', /localStorage\.(?:setItem|getItem)\s*\(\s*["'][^"']*(?:auth|identity|session|token|user)[^"']*["']/gi),
  ];
  assert.deepEqual(found, [], found.join('\n'));
});

test('production graph persistence never falls back to FOD filesystem projects/', () => {
  const found = [
    ...violations('filesystem write to FOD projects directory', /(?:writeFile|writeFileSync|createWriteStream|mkdir|mkdirSync)\s*\([^)]*(?:projects\/|projects\\)/gi),
    ...violations('FOD projects directory persistence root', /(?:path\.join|resolve|new URL)\s*\([^)]*["'](?:\.\.\/)*projects\/?["']/gi),
  ];
  assert.deepEqual(found, [], found.join('\n'));
});

test('Aiko composes the in-process graph engine, workspace persistence, Luth auth, runtime and native editor', () => {
  const required = [
    ['in-process graph engine/scheduler/registry', /(?:GraphEngine|GraphExecutor|GraphScheduler|WorkflowEngine|NodeRegistry|GraphRegistry)/i],
    ['workspace-scoped workflow repository', /(?:WorkspaceWorkflowRepository|WorkflowRepository|WorkflowStore)/],
    ['Aiko workspace storage integration', /(?:workspaceStorage|workingWorkspaceService|WorkspaceStorage)/],
    ['Luth principal/workspace authorization', /(?:resolveUserFromToken|requireWorkspaceAccess|authorizeLuthRequest|verified.*Luth|Luth)/i],
    ['runtime service implementation', /RuntimeService/],
    ['execution-scoped transient cleanup', /cleanupTransient/],
    ['runtime nodes registered with the graph engine', /registerRuntimeNodes|runtimeNodes/],
    ['native workflow graph editor', /(?:WorkflowEditor|WorkflowGraph|GraphEditor|ReactFlow|@xyflow\/react)/i],
    ['canonical system database environment', /SYSTEM_DATABASE_URL/],
    ['canonical public application origin', /\bAPP_URL\b/],
  ];
  const missing = required.filter(([, pattern]) => !pattern.test(corpus)).map(([label]) => label);
  assert.deepEqual(missing, [], 'Missing production composition evidence: ' + missing.join(', '));
});

test('HTTP adapters mount the same Aiko workflow API boundary', () => {
  const express = sources.filter(([path]) => /(?:express|server|apiRouter|apiRoutes)/i.test(path)).map(([, text]) => text).join('\n');
  const worker = sources.filter(([path]) => /(?:worker|httpsAdapter|universalEntry|nodeBridge)/i.test(path)).map(([, text]) => text).join('\n');
  const sharedMarkers = ['apiRouter', 'createApiRouter', 'registerApiRoutes', 'workflowRouter', 'workflowService'];
  const shared = sharedMarkers.some(marker => express.includes(marker) && worker.includes(marker));
  const requiredOperations = ['workflow', 'graph', 'execution'];
  const missingOperations = requiredOperations.filter(operation => !new RegExp(operation, 'i').test(express) || !new RegExp(operation, 'i').test(worker));
  assert.ok(shared, 'Express and Worker must mount a shared API router/route registration boundary');
  assert.deepEqual(missingOperations, [], 'API operation parity missing: ' + missingOperations.join(', '));
});

test('dedicated integration suites cover every FOD absorption boundary', () => {
  assert.ok(tests.length > 0, 'No integration/unit test files were discovered');
  const hasSuite = (pathPattern, contentPattern) => tests.some(([path, text]) => pathPattern.test(path) && contentPattern.test(text));
  const required = [
    ['graph engine scheduling, node data flow and cancellation', hasSuite(/workflows\/engine(?:\/.*)?\.(?:test|spec)\.[^.]+$/i, /(?:GraphEngine|GraphExecutor|GraphScheduler|WorkflowEngine)[\s\S]{0,2000}(?:schedule|node|cancel|abort)|(?:cancel|abort)[\s\S]{0,2000}(?:GraphEngine|GraphExecutor|GraphScheduler)/i)],
    ['workspace graph repository, immutable versions and execution history', hasSuite(/WorkflowRepository\.(?:test|spec)\.ts$/i, /workspace-alpha[\s\S]{0,1500}(?:versions|execution|workspace-beta)|(?:versions|execution)[\s\S]{0,1500}workspace-alpha/i)],
    ['canonical Luth-only application auth contract', hasSuite(/test-canonical-luth-auth\.mjs$/i, /LuthAuthPage[\s\S]{0,1500}resolveAikoLuthUser|resolveAikoLuthUser[\s\S]{0,1500}LuthAuthPage/i)],
    ['Luth workspace authorization and cross-workspace denial', hasSuite(/src\/backend\/apiRoutes\/.*\.(?:test|spec)\.[^.]+$/i, /Luth[\s\S]{0,1500}(?:workspace|unauthorized|forbidden)|(?:workspace|unauthorized|forbidden)[\s\S]{0,1500}Luth/i)],
    ['runtime provider lifecycle, cleanup and credential secrecy', hasSuite(/src\/backend\/runtime\/.*\.(?:test|spec)\.ts$/i, /RuntimeService[\s\S]{0,5000}(?:spawn|terminate|SECRET_LEAK_PREVENTED|REDACTED)/i)],
    ['Express and Worker workflow API parity', hasSuite(/src\/backend\/adapters\/.*\.(?:test|spec)\.[^.]+$/i, /(?:Express|express)[\s\S]{0,1200}(?:Worker|fetch)|(?:Worker|fetch)[\s\S]{0,1200}(?:Express|express)/i)],
    ['native workflow editor rendering and interaction', hasSuite(/(?:WorkflowGraphView|WorkflowEditor).*?\.(?:test|spec)\.[^.]+$/i, /(?:WorkflowGraphView|WorkflowEditor|GraphEditor)[\s\S]{0,1200}(?:render|React|graph|workflow)/i)],
    ['canonical environment and deployment contract', hasSuite(/(?:test-system-database-env\.mjs|requestOrigin\.(?:test|spec)\.ts)$/i, /SYSTEM_DATABASE_URL[\s\S]{0,1000}APP_URL|APP_URL[\s\S]{0,1000}SYSTEM_DATABASE_URL/i)],
  ];
  const missing = required.filter(([, covered]) => !covered).map(([label]) => label);
  assert.deepEqual(missing, [], 'Missing dedicated integration suites: ' + missing.join(', '));
});

async function collectBuildFiles(directory, output = []) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return output; }
  for (const entry of entries) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) await collectBuildFiles(full, output);
    } else if (/\.(?:js|mjs|cjs|html|json|css|map)$/i.test(entry.name)) output.push(full);
  }
  return output;
}

test('production build artifacts contain no external FOD service contract', async t => {
  const artifacts = [
    ...await collectBuildFiles(join(root, 'dist')),
    ...await collectBuildFiles(join(root, 'api')),
  ];
  if (artifacts.length === 0) {
    t.skip('No build artifacts exist yet; CI repeats this gate after fullstack and API builds.');
    return;
  }
  const built = await Promise.all(artifacts.map(async path => [path, await readFile(path, 'utf8')]));
  const found = [];
  for (const [path, text] of built) {
    if (/\b(?:FOD_BASE_URL|AIKO_API_URL|AIKO_MODULE_TOKEN)\b|https?:\/\/[^\s"']*(?:fod[-.]engine|fod[-.]|\bfod\b)/i.test(text)) {
      found.push(relative(root, path));
    }
  }
  assert.deepEqual(found, [], 'External FOD contract found in production bundle: ' + found.join(', '));
});

test('the scanner never counts its own harness as production or integration evidence', () => {
  assert.ok(sources.length > 0, 'Production source/config scan is empty');
  assert.ok(!sources.some(([path]) => path === 'scripts/test-fod-architecture.mjs'));
  assert.ok(!tests.some(([path]) => path === 'scripts/test-fod-architecture.mjs'));
});
