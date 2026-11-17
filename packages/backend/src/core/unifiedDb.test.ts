import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@neondatabase/serverless', () => {
  throw new Error('The optional Neon driver must not load during module initialization.');
});
import { cleanDbUrl, configureUnifiedDatabaseEnvironmentResolver, getUnifiedDbUrl } from './unifiedDb';
import { normalizeSystemEnvironment, resolveSystemDatabaseUrl, resolveSystemDatabaseUrlCandidates, tryResolveSystemDatabaseUrl } from '../resolver/systemDatabaseUrl';

const keys = ['SYSTEM_DATABASE_URL', 'SYSTEM_DATABASE_URL_1', 'SYSTEM_DATABASE_URL_2', 'SYSTEM_DATABASE_URL_3', 'DATABASE_URL'] as const;
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));

afterEach(() => {
  configureUnifiedDatabaseEnvironmentResolver(null);
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('canonical system database URL contract', () => {
  it('keeps the optional Neon driver lazy until a query executes', () => {
    expect(getUnifiedDbUrl({ SYSTEM_DATABASE_URL: 'postgresql://worker/db' })).toBe('postgresql://worker/db');
  });

  it('cleans quoted database URLs', () => {
    expect(cleanDbUrl('  "postgresql://primary/db"  ')).toBe('postgresql://primary/db');
  });

  it('prefers SYSTEM_DATABASE_URL over the supported failover URLs', () => {
    expect(getUnifiedDbUrl({
      SYSTEM_DATABASE_URL: 'postgresql://primary/db',
      SYSTEM_DATABASE_URL_2: 'postgresql://two/db',
      SYSTEM_DATABASE_URL_3: 'postgresql://three/db',
    })).toBe('postgresql://primary/db');
  });


  it('returns primary and fallback URLs in precedence order without duplicates', () => {
    expect(resolveSystemDatabaseUrlCandidates({
      SYSTEM_DATABASE_URL: 'postgresql://primary/db',
      SYSTEM_DATABASE_URL_2: 'postgresql://fallback/db',
      SYSTEM_DATABASE_URL_3: 'postgresql://fallback/db',
    })).toEqual([
      'postgresql://primary/db',
      'postgresql://fallback/db',
    ]);
  });

  it('uses SYSTEM_DATABASE_URL_2 and then SYSTEM_DATABASE_URL_3 only when primary is absent', () => {
    expect(resolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL_2: 'postgresql://two/db', SYSTEM_DATABASE_URL_3: 'postgresql://three/db' }))
      .toBe('postgresql://two/db');
    expect(resolveSystemDatabaseUrl({ SYSTEM_DATABASE_URL_3: 'postgresql://three/db' }))
      .toBe('postgresql://three/db');
  });

  it('does not use process.env to mask a missing explicit Worker binding', () => {
    const previous = process.env.SYSTEM_DATABASE_URL;
    process.env.SYSTEM_DATABASE_URL = 'postgresql://stale-node-value/db';
    expect(getUnifiedDbUrl({ SYSTEM_DATABASE_URL: undefined, SYSTEM_DATABASE_URL_2: undefined, SYSTEM_DATABASE_URL_3: undefined })).toBe('');
    if (previous === undefined) delete process.env.SYSTEM_DATABASE_URL;
    else process.env.SYSTEM_DATABASE_URL = previous;
  });

  it('uses Node environment only after the explicit Node adapter is configured', () => {
    for (const key of keys) delete process.env[key];
    process.env.SYSTEM_DATABASE_URL_2 = 'postgresql://two/db';
    expect(getUnifiedDbUrl()).toBe('');
    configureUnifiedDatabaseEnvironmentResolver(() => process.env);
    expect(getUnifiedDbUrl()).toBe('postgresql://two/db');
    process.env.SYSTEM_DATABASE_URL = 'postgresql://primary/db';
    expect(getUnifiedDbUrl()).toBe('postgresql://primary/db');
  });


  it('preserves Node compatibility for partial service context while treating normalized bindings as authoritative', () => {
    const previous = process.env.SYSTEM_DATABASE_URL;
    process.env.SYSTEM_DATABASE_URL = 'postgresql://node-primary/db';
    configureUnifiedDatabaseEnvironmentResolver(() => process.env);
    expect(getUnifiedDbUrl({ WORKSPACE_APP_ID: 'aiko' })).toBe('postgresql://node-primary/db');
    expect(getUnifiedDbUrl({
      WORKSPACE_APP_ID: 'kone',
      SYSTEM_DATABASE_URL: undefined,
      SYSTEM_DATABASE_URL_2: undefined,
      SYSTEM_DATABASE_URL_3: undefined,
    })).toBe('');
    if (previous === undefined) delete process.env.SYSTEM_DATABASE_URL;
    else process.env.SYSTEM_DATABASE_URL = previous;
  });


  it('normalizes canonical database bindings and APP_URL without importing Node runtime APIs', () => {
    const workerEnv = normalizeSystemEnvironment(
      { SYSTEM_DATABASE_URL: '  "postgresql://worker/db"  ', APP_URL: 'https://aiko.example' },
      { SYSTEM_DATABASE_URL: 'postgresql://node/db', APP_URL: 'https://node.example' },
      'https://request.example/api',
    );
    expect(workerEnv.SYSTEM_DATABASE_URL).toBe('postgresql://worker/db');
    expect(workerEnv.APP_URL).toBe('https://aiko.example');

    const nodeEnv = normalizeSystemEnvironment(
      {},
      { SYSTEM_DATABASE_URL: 'postgresql://node/db', APP_URL: 'https://node.example' },
      'http://localhost:3000/api',
    );
    expect(nodeEnv.SYSTEM_DATABASE_URL).toBe('postgresql://node/db');
    expect(nodeEnv.APP_URL).toBe('https://node.example');

    const requestFallback = normalizeSystemEnvironment({}, {}, 'https://request.example/api');
    expect(requestFallback.APP_URL).toBe('https://request.example');
    expect(requestFallback.SYSTEM_DATABASE_URL).toBeUndefined();
  });

  it('does not accept retired database URL aliases during normalization', () => {
    const normalized = normalizeSystemEnvironment(
      { SYSTEM_DATABASE_URL_1: 'postgresql://retired/db', DATABASE_URL: 'postgresql://legacy/db' },
      {},
    );
    expect(normalized.SYSTEM_DATABASE_URL).toBeUndefined();
    expect(normalized.SYSTEM_DATABASE_URL_1).toBe('postgresql://retired/db');
    expect(normalized.DATABASE_URL).toBe('postgresql://legacy/db');
    expect(tryResolveSystemDatabaseUrl(normalized)).toBeNull();
  });

  it('rejects legacy DATABASE_URL and SYSTEM_DATABASE_URL_1 aliases', () => {
    for (const key of keys) delete process.env[key];
    process.env.DATABASE_URL = 'postgresql://legacy/db';
    process.env.SYSTEM_DATABASE_URL_1 = 'postgresql://retired/db';
    expect(tryResolveSystemDatabaseUrl(process.env)).toBeNull();
    configureUnifiedDatabaseEnvironmentResolver(() => process.env);
    expect(getUnifiedDbUrl()).toBe('');
  });
});
