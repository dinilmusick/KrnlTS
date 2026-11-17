#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const forbiddenPaths = ['Skipo', 'src/libraries/skipo'];
const violations = [];

for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(path.join(root, relativePath))) {
    violations.push(`forbidden source tree exists: ${relativePath}`);
  }
}


// The Worker/edge entrypoint must remain a Web Fetch module. Node's HTTP
// request bridge is loaded only by the Node server bootstrap, never by this
// dependency graph.
const fetchEnvironment = path.join(root, 'src/backend/adapters/systemEnvironment.ts');
if (fs.existsSync(fetchEnvironment)) {
  const source = fs.readFileSync(fetchEnvironment, 'utf8');
  if (!source.includes("@ultrst-armada/kloks/backend/resolver")) {
    violations.push('src/backend/adapters/systemEnvironment.ts: must use the canonical Kloks database resolver');
  }
  if (/\bprocess\.env\b/.test(source)) {
    violations.push('src/backend/adapters/systemEnvironment.ts: Fetch environment normalization must not read process.env');
  }
}

const workerConfig = path.join(root, 'wrangler.toml');
if (fs.existsSync(workerConfig) && /nodejs_compat_populate_process_env/.test(fs.readFileSync(workerConfig, 'utf8'))) {
  violations.push('wrangler.toml: Worker bindings must not be copied into process.env');
}

const fetchEntrypoint = path.join(root, 'src/backend/adapters/universalEntry.ts');
if (fs.existsSync(fetchEntrypoint)) {
  const source = fs.readFileSync(fetchEntrypoint, 'utf8');
  if (/nodeBridge/.test(source)) {
    violations.push('src/backend/adapters/universalEntry.ts: Fetch entrypoint must not import the Node request bridge');
  }
  if (/\b(?:process\.env|Buffer\.)/.test(source)) {
    violations.push('src/backend/adapters/universalEntry.ts: Fetch entrypoint must not depend on Node runtime globals');
  }
  if (!/async\s+fetch\s*\(\s*request:\s*Request/.test(source)) {
    violations.push('src/backend/adapters/universalEntry.ts: default deployment entrypoint must expose the Web Fetch contract');
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      walk(absolute);
      continue;
    }
    if (!/\.(?:ts|tsx|js|jsx|mjs|cjs|json)$/.test(entry.name)) continue;
    const relative = path.relative(root, absolute);
    const source = fs.readFileSync(absolute, 'utf8');
    if (source.includes('@skipo/') && !source.includes('@skipo/ui')) {
      violations.push(`${relative}: unsupported Skipo package import`);
    }
    if (source.includes('src/libraries/skipo/')) {
      violations.push(`${relative}: forbidden embedded Skipo library import`);
    }
  }
}

walk(path.join(root, 'src'));

if (violations.length) {
  console.error('[build-boundary] Production source boundary violation(s):');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('[build-boundary] Production source boundary verified.');
