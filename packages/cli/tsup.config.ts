import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts', 'src/bin/frnl.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  noExternal: ['@ultrst-armada/frnlts-validate'],
  external: ['typescript'],
});
