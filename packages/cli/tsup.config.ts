import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/krnl.ts'],
  dts: true,
  clean: true,
  format: ['esm', 'cjs'],
  noExternal: [
    '@ultrst-armada/krnl-validate',
    '@ultrst-armada/krnl-core'
  ],
  external: ['ts-morph', 'ws', 'esbuild', '@dinilmusick/gutts', 'zod', 'zod-to-json-schema']
});
