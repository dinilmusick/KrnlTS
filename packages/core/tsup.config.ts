import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'esnext',
  external: ['ws', 'zod', 'zod-to-json-schema', 'esbuild'],
  noExternal: ['p-queue'],
});
