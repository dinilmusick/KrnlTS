import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/krnl.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  noExternal: [
    '@dinilmusick/krnl-validate',
    '@dinilmusick/krnl-core'
  ],
  external: ['ts-morph', 'ws', 'esbuild']
});
