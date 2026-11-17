import { defineConfig } from 'tsup';

export default defineConfig({
  noExternal: ['@kloks/functions'],
});
