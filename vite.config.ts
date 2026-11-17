import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 2000,
    },
    resolve: {
      alias: [
        { find: '@skipo/ui', replacement: path.resolve(__dirname, './src/frontend/ui/skipoUi.tsx') },
        { find: '@/frontend', replacement: path.resolve(__dirname, './src/frontend') },
        { find: '@/backend', replacement: path.resolve(__dirname, './src/backend') },
        { find: '@/libraries', replacement: path.resolve(__dirname, './src/libraries') },
        { find: '@/frontend-state', replacement: path.resolve(__dirname, './src/frontend-state') },
        { find: /^fs\/promises$/, replacement: path.resolve(__dirname, 'src/libraries/shims/fsShim.ts') },
        { find: /^node:fs\/promises$/, replacement: path.resolve(__dirname, 'src/libraries/shims/fsShim.ts') },
        { find: /^fs$/, replacement: path.resolve(__dirname, 'src/libraries/shims/fsShim.ts') },
        { find: /^node:fs$/, replacement: path.resolve(__dirname, 'src/libraries/shims/fsShim.ts') },
        { find: /^path$/, replacement: path.resolve(__dirname, 'src/libraries/shims/pathShim.ts') },
        { find: /^node:path$/, replacement: path.resolve(__dirname, 'src/libraries/shims/pathShim.ts') },
        { find: /^os$/, replacement: path.resolve(__dirname, 'src/libraries/shims/osShim.ts') },
        { find: /^node:os$/, replacement: path.resolve(__dirname, 'src/libraries/shims/osShim.ts') },
        { find: /^child_process$/, replacement: path.resolve(__dirname, 'src/libraries/shims/childProcessShim.ts') },
        { find: /^node:child_process$/, replacement: path.resolve(__dirname, 'src/libraries/shims/childProcessShim.ts') },
        { find: /^crypto$/, replacement: path.resolve(__dirname, 'src/libraries/shims/cryptoShim.ts') },
        { find: /^node:crypto$/, replacement: path.resolve(__dirname, 'src/libraries/shims/cryptoShim.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});