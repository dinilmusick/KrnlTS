#!/usr/bin/env node
/**
 * @file sync-ecosystem-secrets.mjs
 * @description Deterministically synchronizes ecosystem-wide GitHub Actions secrets (e.g. SYSTEM_DATABASE_URL)
 * across all downstream Skipo applications and scaffolds, while explicitly excluding library and template repos.
 *
 * NOTE: APP_URL is intentionally NOT managed as a GitHub secret because each deployment instance
 * (Cloudflare Workers, Vercel, preview domains, local dev) has its own instance-specific origin
 * configured via wrangler.toml [vars] or local .env.
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

const DEFAULT_DB_URL =
  process.env.SYSTEM_DATABASE_URL ||
  'postgresql://neondb_owner:npg_JoS3bApHWOR9@ep-muddy-wildflower-aeyd7k6j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'dinilmusick';

// Downstream application engines and scaffolds
const DOWNSTREAM_REPOS = [
  'Aiko',
  'Srkl-Engine',
  'Kone',
  'Depm-Engine',
  'DocuStack-Engine',
  'Fod-Engine',
  'Loky-Engine',
  'Krusbl-Engine',
  'Qwnsr-Engine',
  'Theta-Engine',
  'Dea-Engine',
  'Hubrys-Engine',
  'Mer-Engine',
  'Brwlr-Engine',
  'Brom-Engine',
  'Kelt-Engine',
  'Kult-Engine',
  'Skipo',
  'Skipo-Vite-Scaffold',
];

console.log('════════════════════════════════════════════════════════════════════');
console.log(' SKIPO ECOSYSTEM SECRETS SYNCHRONIZATION');
console.log('════════════════════════════════════════════════════════════════════');
console.log(`Target Owner: ${GITHUB_OWNER}`);
console.log(`Repository Count: ${DOWNSTREAM_REPOS.length}`);
console.log('Excluded: All tpl_* templates and foundation libraries (KrnlTS, FrnlTS, Kloks, Floks, GutTS, Luth)');
console.log('APP_URL Policy: Per-instance deployment config (wrangler.toml / .env), never static GitHub Secret.');
console.log('────────────────────────────────────────────────────────────────────');

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

const CANDIDATE_OWNERS = ['dinilmusick', 'Blueprint-Ninja-Studios'];

for (const repo of DOWNSTREAM_REPOS) {
  let fullRepo = null;
  for (const owner of CANDIDATE_OWNERS) {
    const candidate = `${owner}/${repo}`;
    try {
      execSync(`gh repo view "${candidate}" >/dev/null 2>&1`);
      fullRepo = candidate;
      break;
    } catch {}
  }

  if (!fullRepo) {
    console.log(`⚠️  [SKIP] Repository not found in candidates: ${repo}`);
    skipCount++;
    continue;
  }

  try {
    // Set SYSTEM_DATABASE_URL secret
    execSync(
      `gh secret set SYSTEM_DATABASE_URL -R "${fullRepo}" --body "${DEFAULT_DB_URL}"`,
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    console.log(`✔ [OK] Synced SYSTEM_DATABASE_URL -> ${fullRepo}`);
    successCount++;
  } catch (err) {
    const errorStr = String(err?.stderr || err?.message || '');
    console.error(`✖ [FAIL] Failed to sync ${fullRepo}:`, errorStr.trim());
    errorCount++;
  }
}

console.log('────────────────────────────────────────────────────────────────────');
console.log(`Summary: ${successCount} synced, ${skipCount} skipped, ${errorCount} errors`);
if (errorCount > 0) {
  process.exit(1);
}
