import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    // Deduplicate shared packages — ensures all code (including FrnlTS source
    // aliased from ../FrnlTS/src/) uses the single Floks-installed instance.
    dedupe: ['react', 'react-dom', 'zustand', 'zod'],
    alias: {
      '@floks/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@floks/canvas-ui': path.resolve(__dirname, 'packages/canvas-ui/src/index.ts'),
      '@floks/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@ultrst-armada/floks/ui/services': path.resolve(__dirname, 'packages/ui/dist/serviceUIComponents/index.js'),
      '@ultrst-armada/floks/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@ultrst-armada/floks/canvas-ui': path.resolve(__dirname, 'packages/canvas-ui/src/index.ts'),
      '@ultrst-armada/floks/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@ultrst-armada/floks': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@kloks/state-graph': '@ultrst-armada/kloks/state-graph',
      '@kloks/audio-midi': '@ultrst-armada/kloks/audio-midi',
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  esbuild: {
    jsx: 'automatic',
  },
});
