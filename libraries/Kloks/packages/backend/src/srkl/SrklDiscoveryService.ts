/**
 * @file SrklDiscoveryService.ts
 * @description Universal SRKL Service Discovery and Backblaze B2 account federation.
 * Runs identically in Node.js, Vercel Serverless, and Cloudflare Workers (< 200 lines).
 */

import { b2ListBuckets } from '../storage/B2DirectClient.js';
import { resolveUserStorageConnectionSecret } from '../core/storageConnectionCore.js';

let cachedSrklUrls: { urls: string[]; expiresAt: number } | null = null;
let roundRobinIndex = 0;

export async function getRegisteredSrklDeploymentUrls(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string[]> {
  if (cachedSrklUrls && Date.now() < cachedSrklUrls.expiresAt && cachedSrklUrls.urls.length > 0) {
    return cachedSrklUrls.urls;
  }

  if (queryDb) {
    try {
      const res = await queryDb(
        `SELECT url FROM "ultrst-srkl-deployments" WHERE is_active = true ORDER BY is_primary DESC, priority DESC, created_at ASC`,
        []
      );
      if (res.rows.length > 0) {
        const urls = res.rows
          .map((r: any) => String(r.url || '').trim().replace(/\/+$/, ''))
          .filter(Boolean);
        if (urls.length > 0) {
          cachedSrklUrls = { urls, expiresAt: Date.now() + 10 * 60 * 1000 };
          return urls;
        }
      }
    } catch {}
  }

  return cachedSrklUrls?.urls || [];
}

export async function getPrimarySrklDeploymentUrl(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string> {
  const urls = await getRegisteredSrklDeploymentUrls(queryDb);
  return urls[0] || '';
}

export async function getNextSrklDeploymentUrl(
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<string> {
  const urls = await getRegisteredSrklDeploymentUrls(queryDb);
  if (urls.length === 0) return '';
  const next = urls[roundRobinIndex % urls.length];
  roundRobinIndex = (roundRobinIndex + 1) % urls.length;
  return next;
}

export async function fetchSrklWithFallback(
  path: string,
  init?: RequestInit,
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<Response> {
  const urls = await getRegisteredSrklDeploymentUrls(queryDb);
  let lastError: unknown = null;
  for (let i = 0; i < urls.length; i++) {
    const idx = (roundRobinIndex + i) % urls.length;
    const base = urls[idx];
    try {
      const res = await fetch(`${base}${path}`, init);
      if (res.ok || (res.status >= 200 && res.status < 500)) {
        roundRobinIndex = idx;
        return res;
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All SRKL deployments failed to respond.');
}

export async function getSrklAccounts(
  userId: string,
  service?: string,
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>
): Promise<{ success: boolean; deploymentUrl: string; accounts: any[]; count: number; error?: string }> {
  const srklUrl = await getPrimarySrklDeploymentUrl(queryDb);
  const accounts: any[] = [];
  const seenKeys = new Set<string>();

  // 1. Check local user's app_profiles in DB for federated connections
  if (queryDb && userId) {
    try {
      const uRes = await queryDb(`SELECT app_profiles FROM "ultrst-users" WHERE id = $1 LIMIT 1`, [userId]);
      if (uRes.rows.length > 0) {
        const p = typeof uRes.rows[0].app_profiles === 'string' ? JSON.parse(uRes.rows[0].app_profiles) : (uRes.rows[0].app_profiles || {});
        const pool: any[] = [];
        for (const app of Object.values(p)) {
          if (app && typeof app === 'object' && Array.isArray((app as any).storage_connections)) {
            pool.push(...(app as any).storage_connections);
          }
        }
        for (const conn of pool) {
          if (service && !conn.provider?.toLowerCase().includes(service.toLowerCase())) continue;
          const kId = (conn.b2KeyId || conn.keyId || conn.accessKeyId || conn.googleEmail || '').trim();
          const key = kId ? `key:${kId}:${conn.googleRootFolderId || conn.b2BucketName || ''}` : `id:${conn.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            accounts.push({
              id: String(conn.id),
              name: String(conn.label || conn.id),
              provider: String(conn.provider || ''),
              serviceId: String(conn.provider || ''),
              category: 'storage',
              status: conn.testStatus === 'ok' ? 'CONNECTED' : (conn.enabled === false ? 'DISABLED' : 'ACTIVE'),
              emailOrSlug: conn.googleEmail || conn.label || conn.id,
            });
          }
        }
      }
    } catch {}
  }

  // 2. Fetch from SRKL deployment HTTP endpoint
  try {
    const res = await fetch(`${srklUrl}/api/ecosystem/services`, {
      headers: { 'x-user-id': userId, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const list = Array.isArray(data.services) ? data.services : [];
      for (const item of list) {
        const sId = String(item.serviceId || item.id || '').toLowerCase();
        if (service && !sId.includes(service.toLowerCase())) continue;
        // The downstream SRKL account endpoint can include credential
        // material for authorized internal consumers. Federation discovery
        // deliberately retains metadata only; secret resolution is server-only.
        const id = String(item.id || `srkl-${sId}`);
        const key = `id:${id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          accounts.push({
            id,
            name: String(item.name || item.label || sId),
            serviceId: sId,
            provider: String(item.provider || item.serviceId || ''),
            category: String(item.category || 'storage'),
            status: String(item.status || 'ACTIVE'),
            ...(typeof item.emailOrSlug === 'string' ? { emailOrSlug: item.emailOrSlug } : {}),
          });
        }
      }
    }
  } catch {}

  return { success: true, deploymentUrl: srklUrl, count: accounts.length, accounts };
}

export async function srklListBackblazeBuckets(
  keyId?: string,
  applicationKey?: string,
  _bucketId?: string,
  _bucketName?: string,
  userId?: string,
  queryDb?: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>,
  accountId?: string
): Promise<{ success: boolean; buckets: any[]; error?: string }> {
  let resolvedKeyId = (keyId || '').trim();
  let resolvedAppKey = (applicationKey || '').trim();

  if ((!resolvedKeyId || !resolvedAppKey) && userId) {
    const matched = await resolveUserStorageConnectionSecret(
      userId,
      accountId,
      queryDb,
      'backblaze_b2',
    );
    if (matched) {
      resolvedKeyId = String(matched.b2KeyId || matched.keyId || matched.accessKeyId || '').trim();
      resolvedAppKey = String(
        matched.b2ApplicationKey || matched.applicationKey || matched.appKey || matched.secretAccessKey || '',
      ).trim();
    }
  }

  if (!resolvedKeyId || !resolvedAppKey) {
    return { success: false, buckets: [], error: 'Backblaze B2 Key ID and Application Key are required' };
  }

  try {
    const buckets = await b2ListBuckets(resolvedKeyId, resolvedAppKey);
    return { success: true, buckets };
  } catch (err: any) {
    return { success: false, buckets: [], error: err.message };
  }
}
