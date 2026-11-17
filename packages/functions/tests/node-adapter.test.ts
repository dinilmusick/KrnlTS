import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileCache, loadEnv } from '../src/node.js';

describe('Node-only function adapters', () => {
  it('persists FileCache data without exposing filesystem imports from the portable entrypoint', () => {
    const directory = mkdtempSync(join(tmpdir(), 'kloks-file-cache-'));
    try {
      const cache = new FileCache<{ value: number }>(directory);
      cache.set('item', { value: 42 });
      expect(cache.get('item')).toEqual({ value: 42 });
      cache.delete('item');
      expect(cache.get('item')).toBeNull();

      const envFile = join(directory, '.env');
      const key = 'KLOKS_PORTABILITY_TEST_ENV';
      const previous = process.env[key];
      writeFileSync(envFile, `${key}="portable-node"`, 'utf8');
      delete process.env[key];
      loadEnv(envFile);
      expect(process.env[key]).toBe('portable-node');
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
