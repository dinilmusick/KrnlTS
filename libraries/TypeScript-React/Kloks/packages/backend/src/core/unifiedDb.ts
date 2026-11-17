/**
 * @file unifiedDb.ts
 * @description Canonical isomorphic database client using the Neon Serverless HTTP driver.
 * The normalized SYSTEM_DATABASE_URL contract is resolved in one shared location.
 */

import { resolveSystemDatabaseUrlCandidates, tryResolveSystemDatabaseUrl } from '../resolver/systemDatabaseUrl.js';

let neon: any;
type SystemEnvironmentResolver = () => Record<string, unknown>;
let defaultSystemEnvironmentResolver: SystemEnvironmentResolver | null = null;

/** Installed only by the explicit Node backend entrypoint. */
export function configureUnifiedDatabaseEnvironmentResolver(
  resolver: SystemEnvironmentResolver | null,
): void {
  defaultSystemEnvironmentResolver = resolver;
}

function defaultSystemEnvironment(): Record<string, unknown> {
  return defaultSystemEnvironmentResolver?.() || {};
}

export interface UnifiedQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export function cleanDbUrl(url?: unknown): string {
  if (typeof url !== 'string') return '';
  return url.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Fully normalized Worker/Fetch env objects carry all three canonical keys,
 * even when unset. Such an object is authoritative and must not be masked by
 * process.env. Partial service context objects (for example {WORKSPACE_APP_ID})
 * retain the Node compatibility fallback used by existing callers.
 */
export function getUnifiedDbUrl(env?: Record<string, unknown>): string {
  const supplied = env || {};
  const hasCanonicalBindings = [
    'SYSTEM_DATABASE_URL',
    'SYSTEM_DATABASE_URL_2',
    'SYSTEM_DATABASE_URL_3',
  ].some((key) => Object.prototype.hasOwnProperty.call(supplied, key));

  // A complete Fetch binding object is authoritative, including explicit
  // undefined values. Partial service contexts may inherit only the Node
  // resolver installed by /backend/node; Worker builds have no such resolver.
  const effective = env === undefined
    ? defaultSystemEnvironment()
    : hasCanonicalBindings
      ? supplied
      : { ...defaultSystemEnvironment(), ...supplied };
  return tryResolveSystemDatabaseUrl(effective) || '';
}

function isConnectionLevelFailure(error: unknown): boolean {
  const value = error as { code?: unknown; cause?: { code?: unknown }; message?: unknown };
  const code = String(value?.code || value?.cause?.code || '').toUpperCase();
  if ([
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'UND_ERR_CONNECT_TIMEOUT',
    '08000',
    '08001',
    '08003',
    '08004',
    '08006',
    '08007',
    '57P03',
  ].includes(code)) return true;

  const message = String(value?.message || error || '').toLowerCase();
  return (
    message.includes('fetch failed')
    || message.includes('network error')
    || message.includes('connection terminated unexpectedly')
    || message.includes('socket hang up')
    || message.includes('connect timeout')
  );
}

export async function queryUnifiedDb<T = any>(
  sqlText: string,
  params: any[] = [],
  env?: Record<string, unknown>,
): Promise<UnifiedQueryResult<T>> {
  const supplied = env || {};
  const hasCanonicalBindings = [
    'SYSTEM_DATABASE_URL',
    'SYSTEM_DATABASE_URL_2',
    'SYSTEM_DATABASE_URL_3',
  ].some((key) => Object.prototype.hasOwnProperty.call(supplied, key));
  const effectiveEnv = env === undefined
    ? defaultSystemEnvironment()
    : hasCanonicalBindings
      ? supplied
      : { ...defaultSystemEnvironment(), ...supplied };
  const databaseUrls = resolveSystemDatabaseUrlCandidates(effectiveEnv);
  if (databaseUrls.length === 0) {
    throw new Error(
      '[UnifiedDB] Missing system database configuration. ' +
      'Set SYSTEM_DATABASE_URL; SYSTEM_DATABASE_URL_2 and SYSTEM_DATABASE_URL_3 are optional failover URLs.',
    );
  }

  if (!neon) {
    const mod = await import('@neondatabase/serverless');
    neon = mod.neon;
  }

  let lastError: unknown;
  for (let index = 0; index < databaseUrls.length; index += 1) {
    const databaseUrl = databaseUrls[index];
    try {
      const sql = neon(databaseUrl);
      const rows = (await ((sql as any).query
        ? (sql as any).query(sqlText, params)
        : (sql as any)(sqlText, params))) as T[];
      return {
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      };
    } catch (error) {
      lastError = error;
      const hasNextFallback = index < databaseUrls.length - 1;
      if (!hasNextFallback || !isConnectionLevelFailure(error)) {
        // Do not mask SQL errors or retry writes against another database.
        break;
      }
    }
  }

  // Database driver errors can contain SQL fragments or parameter values.
  // Preserve only the stable SQLSTATE for diagnostics and optional-table logic.
  const rawCode = String(
    (lastError as { code?: unknown; cause?: { code?: unknown } } | null)?.code
    || (lastError as { cause?: { code?: unknown } } | null)?.cause?.code
    || '',
  ).toUpperCase();
  const safeCode = /^[A-Z0-9]{5}$/.test(rawCode) ? rawCode : '';
  console.error('[UnifiedDB] Query execution failed.', safeCode ? { code: safeCode } : undefined);
  const sanitizedError = new Error(
    safeCode
      ? `[UnifiedDB] Query execution failed (database code ${safeCode}).`
      : '[UnifiedDB] Query execution failed.',
  );
  if (safeCode) Object.assign(sanitizedError, { code: safeCode });
  throw sanitizedError;

}
