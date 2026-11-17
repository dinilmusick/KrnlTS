// ══════════════════════════════════════════════════════════════════════════════
// VITE BUILD CONFIGURATION & PLUGINS - AIKO GATEWAY
// ══════════════════════════════════════════════════════════════════════════════

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        crypto: path.resolve(__dirname, 'src/libraries/shims/cryptoShim.ts'),
        '@ultrst-armada/floks$': '@ultrst-armada/floks/ui',
        child_process: path.resolve(__dirname, 'src/libraries/shims/childProcessShim.ts'),
        'node:child_process': path.resolve(__dirname, 'src/libraries/shims/childProcessShim.ts'),
        'fs/promises': path.resolve(__dirname, 'src/libraries/shims/fsPromisesShim.ts'),
        'node:fs/promises': path.resolve(__dirname, 'src/libraries/shims/fsPromisesShim.ts'),
        path: path.resolve(__dirname, 'src/libraries/shims/pathShim.ts'),
        'node:path': path.resolve(__dirname, 'src/libraries/shims/pathShim.ts'),
        os: path.resolve(__dirname, 'src/libraries/shims/osShim.ts'),
        'node:os': path.resolve(__dirname, 'src/libraries/shims/osShim.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true' ? { port: 24680 } : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/.skipo/**', '**/.aiko_vault/**', '**/data/**', '**/*.log', '**/*.json', '**/tmp/**'],
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'INVALID_ANNOTATION' ||
            warning.message?.includes('annotation that Rollup cannot interpret') ||
            (warning.id && warning.id.includes('node_modules/zod'))
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },
  };
});