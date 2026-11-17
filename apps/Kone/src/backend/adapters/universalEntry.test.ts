import { afterEach, describe, expect, it, vi } from 'vitest';
import { tryResolveSystemDatabaseUrl } from '@ultrst-armada/kloks/backend/resolver';
import { normalizeEnv } from './universalEntry.js';

const originalPrimary = process.env.SYSTEM_DATABASE_URL;
const originalFallback2 = process.env.SYSTEM_DATABASE_URL_2;
const originalFallback3 = process.env.SYSTEM_DATABASE_URL_3;

afterEach(() => {
  if (originalPrimary === undefined) delete process.env.SYSTEM_DATABASE_URL;
  else process.env.SYSTEM_DATABASE_URL = originalPrimary;
  if (originalFallback2 === undefined) delete process.env.SYSTEM_DATABASE_URL_2;
  else process.env.SYSTEM_DATABASE_URL_2 = originalFallback2;
  if (originalFallback3 === undefined) delete process.env.SYSTEM_DATABASE_URL_3;
  else process.env.SYSTEM_DATABASE_URL_3 = originalFallback3;
  vi.unstubAllEnvs();
});

describe('KONE Fetch system database environment boundary', () => {
  it('retains the canonical primary URL, ordered fallbacks and APP_URL', () => {
    const normalized = normalizeEnv({
      SYSTEM_DATABASE_URL: '  "postgresql://primary.example/db"  ',
      SYSTEM_DATABASE_URL_2: 'postgresql://fallback-two.example/db',
      SYSTEM_DATABASE_URL_3: 'postgresql://fallback-three.example/db',
      APP_URL: 'https://kone.example',
    }, 'https://request.example/api/health');

    expect(normalized.SYSTEM_DATABASE_URL).toBe('postgresql://primary.example/db');
    expect(normalized.SYSTEM_DATABASE_URL_2).toBe('postgresql://fallback-two.example/db');
    expect(normalized.SYSTEM_DATABASE_URL_3).toBe('postgresql://fallback-three.example/db');
    expect(normalized.APP_URL).toBe('https://kone.example');
    expect(tryResolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL: normalized.SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2: normalized.SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3: normalized.SYSTEM_DATABASE_URL_3 })).toBe('postgresql://primary.example/db');
  });

  it('promotes fallback two before fallback three when the primary is absent', () => {
    const normalized = normalizeEnv({
      SYSTEM_DATABASE_URL: undefined,
      SYSTEM_DATABASE_URL_2: 'postgresql://fallback-two.example/db',
      SYSTEM_DATABASE_URL_3: 'postgresql://fallback-three.example/db',
    }, 'https://kone.example/api/health');

    expect(normalized.SYSTEM_DATABASE_URL).toBe('postgresql://fallback-two.example/db');
    expect(normalized.SYSTEM_DATABASE_URL_2).toBe('postgresql://fallback-two.example/db');
    expect(normalized.SYSTEM_DATABASE_URL_3).toBe('postgresql://fallback-three.example/db');
    expect(tryResolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL: normalized.SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2: normalized.SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3: normalized.SYSTEM_DATABASE_URL_3 })).toBe('postgresql://fallback-two.example/db');
  });

  it('uses fallback three when both the primary and fallback two are absent', () => {
    const normalized = normalizeEnv({
      SYSTEM_DATABASE_URL: undefined,
      SYSTEM_DATABASE_URL_2: undefined,
      SYSTEM_DATABASE_URL_3: 'postgresql://fallback-three.example/db',
    }, 'https://kone.example/api/health');

    expect(normalized.SYSTEM_DATABASE_URL).toBe('postgresql://fallback-three.example/db');
    expect(tryResolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL: normalized.SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2: normalized.SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3: normalized.SYSTEM_DATABASE_URL_3 })).toBe('postgresql://fallback-three.example/db');
  });

  it('does not populate empty Fetch bindings from stale process.env', () => {
    vi.stubEnv('SYSTEM_DATABASE_URL', 'postgresql://stale-node-environment/db');
    const normalized = normalizeEnv({
      SYSTEM_DATABASE_URL: undefined,
      SYSTEM_DATABASE_URL_2: undefined,
      SYSTEM_DATABASE_URL_3: undefined,
    }, 'https://kone.example/api/health');

    expect(normalized.SYSTEM_DATABASE_URL).toBeUndefined();
    expect(normalized.SYSTEM_DATABASE_URL_2).toBeUndefined();
    expect(normalized.SYSTEM_DATABASE_URL_3).toBeUndefined();
    expect(normalized.APP_URL).toBe('https://kone.example');
    expect(tryResolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL: normalized.SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2: normalized.SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3: normalized.SYSTEM_DATABASE_URL_3 })).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(normalized, 'SYSTEM_DATABASE_URL_1')).toBe(false);
  });

  it('never accepts the legacy SYSTEM_DATABASE_URL_1 alias', () => {
    const normalized = normalizeEnv({
      SYSTEM_DATABASE_URL: undefined,
      SYSTEM_DATABASE_URL_1: 'postgresql://legacy-alias.example/db',
      SYSTEM_DATABASE_URL_2: undefined,
      SYSTEM_DATABASE_URL_3: undefined,
    }, 'https://kone.example/api/health');

    expect(normalized.SYSTEM_DATABASE_URL).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(normalized, 'SYSTEM_DATABASE_URL_1')).toBe(false);
    expect(tryResolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL: normalized.SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2: normalized.SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3: normalized.SYSTEM_DATABASE_URL_3 })).toBeNull();
  });
});
