/**
 * @file LuthDiscoveryService.ts
 * @description Universal Luth Auth Service Discovery with multi-deployment fallback and round-robin.
 * Runs identically in Node.js, Vercel Serverless, and Cloudflare Workers (< 200 lines).
 */

import { DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';

let cachedLuthUrls: { urls: string[]; expiresAt: number } | null = null;
let roundRobinIndex = 0;

export async function getRegisteredLuthDeploymentUrls(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string[]> {
  if (cachedLuthUrls && Date.now() < cachedLuthUrls.expiresAt && cachedLuthUrls.urls.length > 0) {
    return cachedLuthUrls.urls;
  }

  if (queryDb) {
    try {
      const res = await queryDb(
        `SELECT url FROM "ultrst-luth-deployments" WHERE is_active = true ORDER BY is_primary DESC, priority DESC, created_at ASC`,
        []
      );
      if (res.rows.length > 0) {
        const urls = res.rows
          .map((r: any) => String(r.url || '').trim().replace(/\/+$/, ''))
          .filter(Boolean);
        if (urls.length > 0) {
          cachedLuthUrls = { urls, expiresAt: Date.now() + 5 * 60 * 1000 };
          return urls;
        }
      }
    } catch {
      // Graceful fallback to ultrst-apps if deployments table does not yet exist
      try {
        const res2 = await queryDb(
          `SELECT origin FROM "ultrst-apps" WHERE app_id = 'luth' AND status = 'active' AND origin IS NOT NULL LIMIT 1`,
          []
        );
        if (res2.rows.length > 0 && res2.rows[0].origin) {
          const u = String(res2.rows[0].origin).trim().replace(/\/+$/, '');
          cachedLuthUrls = { urls: [u], expiresAt: Date.now() + 5 * 60 * 1000 };
          return [u];
        }
      } catch {}
    }
  }

  const fallback = [DEFAULT_LUTH_URL];
  cachedLuthUrls = { urls: fallback, expiresAt: Date.now() + 5 * 60 * 1000 };
  return fallback;
}

export async function getPrimaryLuthDeploymentUrl(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string> {
  const urls = await getRegisteredLuthDeploymentUrls(queryDb);
  return urls[0] || DEFAULT_LUTH_URL;
}

export async function getNextLuthDeploymentUrl(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string> {
  const urls = await getRegisteredLuthDeploymentUrls(queryDb);
  if (urls.length === 0) return DEFAULT_LUTH_URL;
  const next = urls[roundRobinIndex % urls.length];
  roundRobinIndex = (roundRobinIndex + 1) % urls.length;
  return next;
}

export function clearLuthDiscoveryCache(): void {
  cachedLuthUrls = null;
  roundRobinIndex = 0;
}
