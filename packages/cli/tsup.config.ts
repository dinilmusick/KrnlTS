import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/krnl.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  noExternal: [
    '@dinilmusick/krnl-studio',
    '@dinilmusick/krnl-validate',
    '@dinilmusick/krnl-core'
  ],
  external: ['ts-morph', 'ws', 'esbuild', 'vanjs-core', 'rete', 'rete-area-plugin']
});
