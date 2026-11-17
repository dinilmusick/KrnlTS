import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// ══════════════════════════════════════════════════════════════════════════════
// VITE CONFIG — SKIPO SCAFFOLD (MyApp)
// ══════════════════════════════════════════════════════════════════════════════

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
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      // Raise chunk warning threshold; Monaco/heavy libs legitimately exceed 500kB
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
        onwarn(warning, defaultHandler) {
          // Suppress harmless non-executable comment annotations from zod v4
          // These are @__PURE__ / @__NO_SIDE_EFFECTS__ comments Rollup cannot interpret
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
