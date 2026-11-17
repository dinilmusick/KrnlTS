import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sourceRoots = ['src', 'app', 'api'].map((name) => path.join(root, name)).filter(fs.existsSync);
const suffixes = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const files = [];
const generatedWorker = path.join(root, 'api/index.js');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.next', '.git'].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(target);
    // The generated worker contains upstream package internals. Check app-owned source here.
    else if (target !== generatedWorker && suffixes.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
}
for (const rootDir of sourceRoots) walk(rootDir);
const serverEntry = path.join(root, 'server.ts');
if (fs.existsSync(serverEntry)) files.push(serverEntry);

const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const forbidden = [
  [/\b(?:bcrypt|bcryptjs)\b/i, 'bcrypt'],
  [/\b(?:hashPassword|verifyPassword|comparePassword|checkPassword)\s*\(/i, 'local password verification'],
  [/\b(?:password_hash|passwordHash)\b/i, 'credential hash storage'],
  [/\b(?:createSession|generateSession|issueSession|mintSession|signSession)\s*\(/i, 'local session issuance'],
  [/\bjsonwebtoken\b.*\bsign\s*\(/is, 'local JWT issuance'],
  [/\bAuthServiceFacade\b/i, 'legacy AuthServiceFacade'],
  [/\bBearer\s+sess::/i, 'synthetic local session token'],
  [/\/api\/auth\/(?:login|register)(?:["']|\b)/i, 'local login/register route'],
];
for (const [pattern, label] of forbidden) assert.equal(pattern.test(source), false, label);

const canonicalMarkers = [
  '@dinilmusick/gutts/auth',
  '@ultrst-armada/kloks/backend',
  'LuthAuthPage',
  'createLuthAuthClient',
  'DEFAULT_LUTH_URL',
  'resolveAikoLuthUser',
];
assert.ok(canonicalMarkers.some((marker) => source.includes(marker)), 'No canonical Luth integration marker found');

for (const packageName of ['@dinilmusick/gutts', '@ultrst-armada/kloks', '@ultrst-armada/floks']) {
  assert.ok(manifest.dependencies?.[packageName] || manifest.devDependencies?.[packageName], 'Missing canonical dependency: ' + packageName);
}

console.log('Canonical Luth-only application auth contract: PASS');
