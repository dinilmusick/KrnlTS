import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@skipo/ui/theme': path.resolve(__dirname, 'src/libraries/skipo/ui/theme/index.ts'),
        '@skipo/ui/dist/index.css': path.resolve(__dirname, 'src/libraries/skipo/ui/theme/tokens.css'),
        '@skipo/ui': path.resolve(__dirname, 'src/libraries/skipo/ui/index.ts'),
        '@skipo/core': path.resolve(__dirname, 'src/libraries/skipo/core/index.ts'),
        '@skipo/backend': path.resolve(__dirname, 'src/libraries/skipo/backend/index.ts'),
        '@skipo/systems': path.resolve(__dirname, 'src/libraries/skipo/systems/index.ts'),
        'crypto': path.resolve(__dirname, 'src/frontend/browser/crypto.ts'),
        'node-fetch': path.resolve(__dirname, 'src/frontend/browser/nodeFetch.ts'),
        'process': path.resolve(__dirname, 'src/frontend/browser/process.ts'),
        'events': path.resolve(__dirname, 'src/frontend/browser/events.ts'),
        '@ultrst-armada/kloks/services': path.resolve(__dirname, 'src/frontend/browser/kloks-services.ts'),
        '@kone/floks-canvas': path.resolve(__dirname, 'src/frontend/browser/floks-canvas.ts'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
        onwarn(warning, defaultHandler) {
          if (
            warning.code === 'INVALID_ANNOTATION' ||
            warning.message?.includes('annotation that Rollup cannot interpret') ||
            (warning.id && warning.id.includes('node_modules/zod'))
          ) return;
          defaultHandler(warning);
        },
      },
    },
  };
});
