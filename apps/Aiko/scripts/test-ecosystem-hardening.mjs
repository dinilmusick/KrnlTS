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
  return sourceFile.statements.find(statement =>
    ts.isFunctionDeclaration(statement) && statement.name?.text === 'fetchHandler'
  );
}
function statementText(statement) { return statement.getText(adapter); }
function indexOfStatement(statements, pattern) {
  return statements.findIndex(statement => pattern.test(statementText(statement)));
}
function isFetchCall(node) {
  if (!ts.isCallExpression(node)) return false;
  const expression = node.expression;
  if (ts.isIdentifier(expression)) return expression.text === 'fetch';
  return ts.isPropertyAccessExpression(expression)
    && expression.name.text === 'fetch'
    && ts.isIdentifier(expression.expression)
    && ['window', 'globalThis', 'self'].includes(expression.expression.text);
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

test('Aiko request pipeline serves non-API assets before application handlers and authentication', () => {
  const handler = findFetchHandler(adapter);
  assert.ok(handler?.body, 'fetchHandler must exist as a function with an inspectable body');
  const statements = [...handler.body.statements];
  const optionsIndex = indexOfStatement(statements, /method\s*===\s*['"]OPTIONS['"]/);
  const assetsIndex = indexOfStatement(statements, /env\.ASSETS[\s\S]*!pathname\.startsWith\(['"]\/api\/['"]\)/);
  assert.notEqual(optionsIndex, -1, 'OPTIONS/CORS preflight gate is required');
  assert.notEqual(assetsIndex, -1, 'Non-API ASSETS passthrough is required');
  assert.ok(optionsIndex < assetsIndex, 'OPTIONS must precede asset passthrough');
  const assetStatement = statements[assetsIndex].getText(adapter);
  const healthIndex = indexOfStatement(statements, /pathname\s*===\s*['"]\/api\/health['"][\s\S]*pathname\s*===\s*['"]\/health['"]/);
  assert.notEqual(healthIndex, -1, 'Explicit health probe route must remain present');
  assert.ok(assetsIndex < healthIndex, 'Non-API assets must be dispatched before health probes');
  assert.match(assetStatement, /pathname\s*!==\s*['"]\/health['"]/, 'The asset passthrough must reserve /health for the health probe');


  const interceptors = [
    ['auth/database handler', /handleAuthAndDatabaseRequest\s*\(/],
    ['storage handler', /handleStorageRequest\s*\(/],
    ['public provider route', /PROVIDERS_META/],
    ['public model catalog route', /modelCatalog\.getCatalog\s*\(/],
    ['Luth principal gate', /requireLuthPrincipal\s*\(/],
  ];
  for (const [label, pattern] of interceptors) {
    const index = indexOfStatement(statements, pattern);
    assert.notEqual(index, -1, `Expected ${label} in fetchHandler`);
    assert.ok(assetsIndex < index, `${label} must not intercept a non-API request before asset passthrough`);
  }


  const orderedStages = [
    ['health probe', /pathname\s*===\s*['"]\/api\/health['"]/],
    ['public provider route', /PROVIDERS_META/],
    ['public model catalog route', /modelCatalog\.getCatalog\s*\(/],
    ['auth/database handler', /handleAuthAndDatabaseRequest\s*\(/],
    ['storage handler', /handleStorageRequest\s*\(/],
    ['Luth principal gate', /requireLuthPrincipal\s*\(/],
  ].map(([label, pattern]) => ({ label, index: indexOfStatement(statements, pattern) }));
  for (const stage of orderedStages) assert.notEqual(stage.index, -1, `Missing request-pipeline stage: ${stage.label}`);
  for (let i = 1; i < orderedStages.length; i++) {
    assert.ok(orderedStages[i - 1].index < orderedStages[i].index,
      `Request pipeline order violation: ${orderedStages[i - 1].label} must precede ${orderedStages[i].label}`);
  }

  const notFoundIndex = indexOfStatement(statements, /Not Found:.*pathname/);
  assert.ok(notFoundIndex > assetsIndex, 'Non-API 404 fallback must run after asset passthrough');
});

test('Aiko frontend and API-client network traffic uses the canonical jsonFetch transport', async () => {
  const roots = ['src/frontend', 'src/libraries/apiClient'].map(name => path.join(root, name));
  const files = [];
  for (const directory of roots) files.push(...await collectFiles(directory));
  assert.ok(files.length > 0, 'Expected frontend/API-client source files to scan');

  const violations = [];
  let canonicalFetchCount = 0;
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true,
      /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const isCanonicalClient = path.relative(root, file).replaceAll('\\', '/') === 'src/libraries/apiClient/apiClient.ts';

    function visit(node, insideJsonFetch = false) {
      const isJsonFetchFunction = ts.isFunctionDeclaration(node) && node.name?.text === 'jsonFetch';
      const allowed = insideJsonFetch || (isCanonicalClient && isJsonFetchFunction);
      if (isFetchCall(node)) {
        if (allowed && isCanonicalClient) canonicalFetchCount++;
        else violations.push(path.relative(root, file) + ':' + source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
      }
      ts.forEachChild(node, child => visit(child, allowed));
    }
    visit(source);
  }

  assert.ok(canonicalFetchCount >= 1, 'Canonical jsonFetch must own the permitted raw fetch call');
  assert.deepEqual(violations, [],
    'Raw fetch is forbidden in frontend/API-client code outside canonical jsonFetch:\n' + violations.join('\n'));
});

test('Aiko build-artifact freshness verification is wired into the repository contract', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const verifier = path.join(root, 'scripts/verify-build-artifacts-freshness.mjs');
  assert.ok(manifest.scripts?.['verify:build-artifacts'],
    'package.json must expose verify:build-artifacts');
  assert.ok(manifest.scripts.test?.includes('test:ecosystem-hardening'),
    'npm test must include the ecosystem hardening contract suite');
  await assert.doesNotReject(readFile(verifier),
    'The verifier implementation must exist before the hardening suite can pass');
});

test('Aiko Cloudflare Worker config identifies the generated Worker entry and build command', async () => {
  const wrangler = await readFile(path.join(root, 'wrangler.toml'), 'utf8');
  assert.match(wrangler, /^main\s*=\s*["']api\/index\.js["']/m);
  assert.match(wrangler, /^command\s*=\s*["']npm run build["']/m);
  assert.match(wrangler, /^binding\s*=\s*["']ASSETS["']/m);
  assert.match(wrangler, /^directory\s*=\s*["']\.?\/dist["']/m);
});

test('Aiko CI runs build-artifact freshness verification after the build', async () => {
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
