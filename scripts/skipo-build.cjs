#!/usr/bin/env node

/**
 * @file skipo-build.cjs
 * @description Kone single-pass application build pipeline.
 * Produces the browser frontend and universal backend from one command.
 *
 * Cloudflare Workers static assets have a 25 MiB per-file limit. Large
 * ONNX Runtime WASM binaries are therefore stored as gzip sidecars and
 * transparently decompressed by the Worker asset handler at request time.
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

/**
 * Store WASM files as gzip sidecars. The Worker serves these at the original
 * .wasm URL after streaming decompression, so browser/runtime URLs do not change.
 */
function compressWasmAssets() {
  if (!fs.existsSync(distDir)) throw new Error('Vite output directory was not created.');

  let compressedCount = 0;
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.wasm')) continue;

      const source = fs.readFileSync(filePath);
      const compressed = zlib.gzipSync(source, { level: 9 });
      const sidecarPath = `${filePath}.gz`;
      fs.writeFileSync(sidecarPath, compressed);
      fs.unlinkSync(filePath);
      compressedCount++;
      console.log(
        `[skipo-build] Compressed WASM asset ${path.relative(distDir, filePath)}: ` +
        `${(source.length / 1024 / 1024).toFixed(2)} MiB -> ` +
        `${(compressed.length / 1024 / 1024).toFixed(2)} MiB`,
      );
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
    'inspector', '@aws-sdk/*', 'node:*',
    '@ultrst-armada/kloks/backend/node'
  ].map((m) => `'--external:${m}'`).join(' ');

  run(
    `npx esbuild src/backend/adapters/universalEntry.ts --bundle --platform=neutral --main-fields=module,main --format=esm --define:import.meta.url='"https://kone.internal/api/index.js"' ${nodeBuiltins} --outfile=api/index.js`,
    'Bundling Single Universal Polyglot Backend (api/index.js)'
  );

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ [kone-build] Single-application build completed in ${duration}s.`);
} catch (error) {
  console.error('\n❌ [skipo-build] Build failed:', error.message);
  process.exit(error.status || 1);
}
