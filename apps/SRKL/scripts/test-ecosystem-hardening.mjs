import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const adapterPath = path.join(root, 'src/backend/adapters/httpsAdapter.ts');
const adapterText = await readFile(adapterPath, 'utf8');
const adapter = ts.createSourceFile(adapterPath, adapterText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function findFetchHandler(sourceFile) {
  return sourceFile.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name?.text === 'fetchHandler');
}
function text(statement) { return statement.getText(adapter); }
function indexOf(statements, pattern) { return statements.findIndex(statement => pattern.test(text(statement))); }
function isFetchCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const expression = node.expression;
  if (ts.isIdentifier(expression)) return expression.text === 'fetch';
  return ts.isPropertyAccessExpression(expression) && expression.name.text === 'fetch'
    && ts.isIdentifier(expression.expression) && ['window', 'globalThis', 'self'].includes(expression.expression.text);
}
async function collectFiles(directory, output = []) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return output; }
  for (const entry of entries) {
    if (['node_modules', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(full, output);
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) && !/\.(?:test|spec)\.[^.]+$/i.test(entry.name)) output.push(full);
  }
  return output;
}

test('SRKL Worker passes non-API assets before deployment registration and API route handlers', () => {
  const handler = findFetchHandler(adapter);
  assert.ok(handler?.body, 'fetchHandler must exist with an inspectable body');
  const statements = [...handler.body.statements];
  const optionsIndex = indexOf(statements, /method\s*===\s*['"]OPTIONS['"]/);
  const assetsIndex = indexOf(statements, /env\.ASSETS[\s\S]*!pathname\.startsWith\(['"]\/api\/['"]\)/);
  assert.notEqual(optionsIndex, -1, 'OPTIONS/CORS preflight gate is required');
  assert.notEqual(assetsIndex, -1, 'Non-API ASSETS passthrough is required');
  assert.ok(optionsIndex < assetsIndex, 'OPTIONS must precede asset passthrough');
  const assetStatement = statements[assetsIndex].getText(adapter);
  const healthIndex = indexOf(statements, /pathname\s*===\s*['"]\/api\/health['"][\s\S]*pathname\s*===\s*['"]\/health['"]/);
  assert.notEqual(healthIndex, -1, 'Explicit health probe route must remain present');
  assert.ok(assetsIndex < healthIndex, 'Non-API assets must be dispatched before health probes');
  assert.match(assetStatement, /pathname\s*!==\s*['"]\/health['"]/, 'The asset passthrough must reserve /health for the health probe');


  const interceptors = [
    ['deployment registration side effect', /registerSrklDeployment\s*\(/],
    ['deployment registry API', /getRegisteredSrklDeployments\s*\(/],
    ['Aiko route delegation', /handleAikoRoutes\s*\(/],
    ['FOD route delegation', /handleFodRoutes\s*\(/],
    ['SRKL business route dispatch', /SrklBackend\.services\./],
  ];
  for (const [label, pattern] of interceptors) {
    const index = indexOf(statements, pattern);
    assert.notEqual(index, -1, `Expected ${label} in fetchHandler`);
    assert.ok(assetsIndex < index, `${label} must not intercept or execute before non-API asset passthrough`);
  }
  const fallbackIndex = indexOf(statements, /target:\s*['"]SrklBackend-HTTPS-Adapter['"]/);
  assert.ok(fallbackIndex > assetsIndex, 'Unknown-route fallback must remain after asset passthrough');
});


test('SRKL Worker authenticates protected API requests and never trusts caller-supplied user IDs', () => {
  const handler = findFetchHandler(adapter);
  assert.ok(handler?.body, 'fetchHandler must exist');
  const statements = [...handler.body.statements];
  const authIndex = indexOf(statements, /(?:verifyLuthRequest|requireLuthPrincipal|authenticateRequest)\s*\(/);
  assert.notEqual(authIndex, -1,
    'Worker fetchHandler must apply the canonical Luth verification boundary before protected route dispatch');

  for (const [label, pattern] of [
    ['Aiko route delegation', /handleAikoRoutes\s*\(/],
    ['SRKL/FOD route delegation', /handleFodRoutes\s*\(/],
    ['SRKL service dispatch', /SrklBackend\.services\./],
  ]) {
    const index = indexOf(statements, pattern);
    assert.notEqual(index, -1, `Expected ${label}`);
    assert.ok(authIndex < index, `${label} must execute only after canonical Luth verification`);
  }

  const identityHelper = adapter.statements.find(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === 'getUserId'
  );
  assert.ok(identityHelper, 'getUserId identity helper must remain explicit and auditable');
  const identitySource = identityHelper.getText(adapter);
  assert.doesNotMatch(identitySource, /headers\.get\(\s*['"]x-user-id['"]\s*\)/i,
    'x-user-id is caller-controlled and cannot establish identity');
  assert.doesNotMatch(identitySource, /searchParams\.get\(\s*['"]userId['"]\s*\)/i,
    'userId query parameters are caller-controlled and cannot establish identity');
});

test('SRKL frontend network calls use canonical authenticated transport', async () => {
  const files = await collectFiles(path.join(root, 'src/frontend'));
  assert.ok(files.length > 0, 'Expected SRKL frontend source files to scan');
  const violations = [];
  for (const file of files) {
    const sourceText = await readFile(file, 'utf8');
    const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true,
      /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      if (isFetchCall(node)) violations.push(path.relative(root, file) + ':' + (source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1));
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(violations, [],
    'Raw fetch is forbidden in SRKL frontend code; use Kloks createUniversalAuthFetch:\n' + violations.join('\n'));
});

test('SRKL has no application-local password/session authority competing with Luth', async () => {
  const roots = ['src/backend', 'src/server'].map(name => path.join(root, name));
  const files = [];
  for (const directory of roots) files.push(...await collectFiles(directory));
  const forbidden = [];
  const patterns = [
    [/coreAuth\.loginUser\s*\(/, 'local login endpoint'],
    [/coreAuth\.getCurrentUser\s*\(/, 'local identity lookup'],
    [/\b(?:hashPassword|verifyPassword|comparePassword|checkPassword)\s*\(/, 'local password verification'],
    [/\b(?:createSession|generateSession|issueSession|mintSession|signSession)\s*\(/, 'local session issuance'],
  ];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const [pattern, label] of patterns) if (pattern.test(content)) forbidden.push(label + ': ' + path.relative(root, file));
  }
  assert.deepEqual(forbidden, [], 'Luth must remain the only identity/session authority:\n' + forbidden.join('\n'));
});

test('SRKL build-artifact freshness verification is wired into the repository contract', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.ok(manifest.scripts?.['verify:build-artifacts'], 'package.json must expose verify:build-artifacts');
  assert.ok(manifest.scripts.test?.includes('test:ecosystem-hardening'), 'npm test must include the ecosystem hardening suite');
  await assert.doesNotReject(readFile(path.join(root, 'scripts/verify-build-artifacts-freshness.mjs')),
    'The build-artifact verifier must exist before this suite can pass');
});

test('SRKL Cloudflare Worker config identifies the generated Worker entry and build command', async () => {
  const wrangler = await readFile(path.join(root, 'wrangler.toml'), 'utf8');
  assert.match(wrangler, /^main\s*=\s*['"]api\/index\.js['"]/m);
  assert.match(wrangler, /^command\s*=\s*['"]npm run build['"]/m);
  assert.match(wrangler, /^binding\s*=\s*['"]ASSETS['"]/m);
  assert.match(wrangler, /^directory\s*=\s*['"]dist['"]/m);
});

test('SRKL CI runs build-artifact freshness verification after the build', async () => {
  const workflowDirectory = path.join(root, '.github/workflows');
  let entries = [];
  try { entries = await readdir(workflowDirectory, { withFileTypes: true }); } catch {}
  const workflowFiles = entries.filter(entry => entry.isFile() && /\.ya?ml$/i.test(entry.name));
  assert.ok(workflowFiles.length > 0, 'GitHub Actions workflow files must exist');
  const workflowTexts = await Promise.all(workflowFiles.map(entry => readFile(path.join(workflowDirectory, entry.name), 'utf8')));
  const wired = workflowTexts.some(content => {
    const build = content.indexOf('npm run build');
    const verify = content.indexOf('npm run verify:build-artifacts');
    return build >= 0 && verify > build;
  });
  assert.ok(wired, 'A GitHub Actions job must run npm run verify:build-artifacts after npm run build');
});
