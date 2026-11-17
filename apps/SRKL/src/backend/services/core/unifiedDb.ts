/**
 * @file unifiedDb.ts
 * @description Universal system database client with ordered URL failover.
 */

import { neon } from '@neondatabase/serverless';

declare const process: any;

export interface UnifiedQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export function cleanDbUrl(url?: unknown): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^["']|["']$/g, '');
}

export function getUnifiedDbUrls(env?: Record<string, unknown>): string[] {
  const source = env ?? (typeof process !== 'undefined' ? process.env : {});
  const configured = [
    cleanDbUrl(source?.SYSTEM_DATABASE_URL),
    cleanDbUrl(source?.SYSTEM_DATABASE_URL_2),
    cleanDbUrl(source?.SYSTEM_DATABASE_URL_3),
  ];
  return configured.filter((url, index) => Boolean(url) && configured.indexOf(url) === index);
}

export function getUnifiedDbUrl(env?: Record<string, unknown>): string {
  return getUnifiedDbUrls(env)[0] || '';
}

export async function queryUnifiedDb<T = any>(
  sqlText: string,
  params: any[] = [],
  env?: Record<string, unknown>
): Promise<UnifiedQueryResult<T>> {
  const urls = getUnifiedDbUrls(env);
  if (urls.length === 0) {
    throw new Error('[UnifiedDB] SYSTEM_DATABASE_URL is required; SYSTEM_DATABASE_URL_2 and SYSTEM_DATABASE_URL_3 are optional fallbacks.');
  }

  let lastError: unknown;
  for (const [index, dbUrl] of urls.entries()) {
    try {
      const rows = (await neon(dbUrl).query(sqlText, params)) as T[];
      return {
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
      };
    } catch (error) {
      lastError = error;
      if (index < urls.length - 1) {
        console.warn(`[UnifiedDB] System database ${index + 1} failed; attempting configured fallback.`);
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`[UnifiedDB] All configured system database endpoints failed. Last error: ${lastError.message}`)
    : new Error('[UnifiedDB] All configured system database endpoints failed.');
}
