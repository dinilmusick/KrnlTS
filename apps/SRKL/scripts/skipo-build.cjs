#!/usr/bin/env node

/**
 * @file skipo-build.cjs
 * @description Single Universal Build Pipeline for Skipo framework applications.
 * Conforms to Law L22 (Single Build Pipeline).
 *
 * Compiles all targets into ONE universal artifact set:
 * 1. Frontend SPA (Vite) -> dist/
 * 2. Universal Polyglot Backend (esbuild) -> api/index.js
 *    (Serves Local Node, Vercel Serverless, and Cloudflare Workers identically)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('[skipo-build] Starting Universal Single-Pass Build...');
const startTime = Date.now();

fs.mkdirSync(path.join(rootDir, 'api'), { recursive: true });

function run(cmd, desc) {
  console.log(`[skipo-build] ${desc}...`);
  execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

function compressWasmAssets() {
  if (!fs.existsSync(distDir)) throw new Error('Vite output directory was not created.');
  let compressedCount = 0;
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) { visit(p); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.wasm')) continue;
      const src = fs.readFileSync(p);
      fs.writeFileSync(`${p}.gz`, zlib.gzipSync(src, { level: 9 }));
      fs.unlinkSync(p);
      compressedCount++;
    }
  };
  visit(distDir);
  console.log(`[skipo-build] Prepared ${compressedCount} compressed WASM asset(s) for Cloudflare.`);
}

try {
  run('npx vite build', 'Building Vite frontend assets');
  compressWasmAssets();

  const nodeBuiltins = [
    'http', 'https', 'http2', 'events', 'stream', 'buffer', 'fs', 'path',
    'url', 'util', 'net', 'tls', 'zlib', 'os', 'child_process',
    'crypto', 'worker_threads', 'cluster', 'dgram', 'dns', 'readline', 'vm',
    'querystring', 'process', 'assert', 'tty', 'perf_hooks', 'string_decoder',
    'inspector',
    '@aws-sdk/*', 'node:*',
    '@ultrst-armada/kloks/backend/node'
  ].map((m) => `'--external:${m}'`).join(' ');

  run(
    `npx esbuild src/backend/adapters/universalEntry.ts --bundle --platform=neutral --main-fields=module,main --format=esm --define:import.meta.url='"https://srkl-engine.internal/api/index.js"' ${nodeBuiltins} --outfile=api/index.js`,
    'Bundling Single Universal Polyglot Backend (api/index.js)'
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ [skipo-build] Universal single-artifact build completed in ${duration}s.`);
} catch (error) {
  console.error('\n❌ [skipo-build] Build failed:', error.message);
  process.exit(error.status || 1);
}
