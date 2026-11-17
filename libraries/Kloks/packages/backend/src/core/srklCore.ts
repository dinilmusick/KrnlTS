/**
 * @file srklCore.ts
 * @description Universal SRKL Ecosystem Service for Qwnsr.
 * Governs primary SRKL node lookup, account discovery via Unified DB & SRKL API, and B2 bucket access.
 */

import { queryUnifiedDb } from './unifiedDb';
import { b2ListBuckets } from './b2DirectCore';

let cachedSrklUrl: { url: string; expiresAt: number } | null = null;

export async function getPrimarySrklDeploymentUrl(env?: Record<string, unknown>): Promise<string> {
  if (cachedSrklUrl && Date.now() < cachedSrklUrl.expiresAt) return cachedSrklUrl.url;
  try {
    const res = await queryUnifiedDb(
      `SELECT url FROM "ultrst-srkl-deployments" WHERE is_active = true ORDER BY is_primary DESC, priority DESC, created_at ASC LIMIT 1`,
      [],
      env
    );
    if (res.rows.length > 0 && res.rows[0].url) {
      const url = res.rows[0].url.trim().replace(/\/+$/, '');
      cachedSrklUrl = { url, expiresAt: Date.now() + 10 * 60 * 1000 };
      return url;
    }
  } catch (err: any) {
    console.warn('[SrklCore] Deployment DB lookup fallback:', err.message);
  }
  return cachedSrklUrl?.url || '';
}

function deduplicateAccounts(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const a of items) {
    if (!a) continue;
    const creds = a.credentials || a.metadata?.credentials || a;
    const keyId = (creds.keyId || creds.b2KeyId || creds.accessKeyId || '').trim();
    const token = (creds.token || creds.apiToken || creds.applicationKey || creds.b2ApplicationKey || '').trim();
    const sId = (a.serviceId || a.provider || '').toLowerCase().trim();
    const sig = keyId ? `key:${keyId}` : token ? `tok:${sId}:${token.slice(-12)}` : a.id ? `id:${a.id}` : `nam:${sId}:${a.name || a.label}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      if (a.id) seen.add(`id:${a.id}`);
      out.push(a);
    }
  }
  return out;
}

export async function getSrklAccounts(
  userId?: string,
  service?: string,
  env?: Record<string, unknown>
): Promise<{ success: boolean; deploymentUrl: string; userId?: string; count: number; accounts: any[]; error?: string }> {
  const rawAccounts: any[] = [];
  const srklUrl = await getPrimarySrklDeploymentUrl(env);

  // 1. Query Unified Database for user's storage connections across app profiles
  if (userId) {
    try {
      const uRes = await queryUnifiedDb(
        `SELECT app_profiles FROM "ultrst-users" WHERE id = $1 OR email = $1 LIMIT 1`,
        [userId],
        env
      );
      if (uRes.rows.length > 0) {
        const p = typeof uRes.rows[0].app_profiles === 'string'
          ? JSON.parse(uRes.rows[0].app_profiles)
          : (uRes.rows[0].app_profiles || {});
        
        const conns: any[] = [];
        for (const app of Object.values(p)) {
          if (app && typeof app === 'object' && Array.isArray((app as any).storage_connections)) {
            conns.push(...(app as any).storage_connections);
          }
        }

        for (const c of conns) {
          if (!service || (c.provider || '').toLowerCase().includes(service.toLowerCase())) {
            rawAccounts.push({
              id: c.id,
              name: c.label || c.name || 'Backblaze B2 Account',
              provider: c.provider === 'backblaze_b2' ? 'backblaze' : c.provider,
              serviceId: 'backblaze',
              category: 'storage',
              groupIds: c.groupIds || (c.groupId ? [c.groupId] : []),
              credentials: {
                keyId: c.b2KeyId || c.keyId || c.accessKeyId || '',
                applicationKey: c.b2ApplicationKey || c.applicationKey || c.secretAccessKey || '',
                bucketName: c.b2BucketName || c.bucketName || '',
                bucketId: c.b2BucketId || c.bucketId || '',
                endpoint: c.b2Endpoint || c.endpoint || 's3.eu-central-003.backblazeb2.com',
                region: c.b2Region || c.region || 'eu-central-003',
              },
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[SrklCore] Storage connection DB lookup fallback:', err.message);
    }
  }

  // 2. Also check any stored connections in .skipo/accounts.json
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const accPath = path.resolve('.skipo/accounts.json');
    const raw = await fs.readFile(accPath, 'utf-8');
    const localUsers = JSON.parse(raw);
    for (const u of Object.values<any>(localUsers)) {
      const conns = Array.isArray(u.storage_connections) ? u.storage_connections : [];
      for (const c of conns) {
        if (!service || (c.provider || '').toLowerCase().includes(service.toLowerCase())) {
          rawAccounts.push({
            id: c.id,
            name: c.label || c.name || 'Local B2 Account',
            provider: 'backblaze',
            serviceId: 'backblaze',
            credentials: {
              keyId: c.b2KeyId || c.keyId || '',
              applicationKey: c.b2ApplicationKey || c.applicationKey || '',
              bucketName: c.b2BucketName || c.bucketName || '',
              bucketId: c.b2BucketId || '',
              endpoint: c.b2Endpoint || 's3.eu-central-003.backblazeb2.com',
              region: c.b2Region || 'eu-central-003',
            },
          });
        }
      }
    }
  } catch {}

  // 3. Query remote SRKL deployment endpoint for ecosystem accounts
  let fetchError: string | undefined;
  try {
    const srklRes = await fetch(`${srklUrl}/api/srkl/accounts?service=${service || 'backblaze'}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (srklRes.ok) {
      const sData: any = await srklRes.json();
      if (Array.isArray(sData.accounts)) {
        for (const sa of sData.accounts) {
          rawAccounts.push(sa);
        }
      }
    }
  } catch (err: any) {
    fetchError = err.message;
  }

  const accounts = deduplicateAccounts(rawAccounts);
  return {
    success: true,
    deploymentUrl: srklUrl,
    userId,
    count: accounts.length,
    accounts,
    error: accounts.length > 0 ? undefined : fetchError,
  };
}

export async function listBackblazeBuckets(
  payload: any,
  rawUserId?: string,
  env?: Record<string, unknown>
): Promise<{ success: boolean; buckets?: any[]; error?: string }> {
  try {
    const userId = rawUserId || payload?.userId || payload?.credentials?.userId || '';
    const creds = payload?.credentials || {};
    let keyId = (payload?.keyId || payload?.b2KeyId || payload?.accessKeyId || creds.keyId || creds.b2KeyId || creds.accessKeyId || '').trim();
    let appKey = (payload?.applicationKey || payload?.b2ApplicationKey || payload?.appKey || payload?.secretAccessKey || creds.applicationKey || creds.b2ApplicationKey || creds.appKey || creds.secretAccessKey || '').trim();
    const bucketId = (payload?.bucketId || creds.bucketId || '').trim();
    const bucketName = (payload?.bucketName || payload?.b2BucketName || creds.bucketName || creds.b2BucketName || '').trim();

    if ((!keyId || !appKey) && (payload?.accountId || payload?.id)) {
      const srkl = await getSrklAccounts(userId, 'backblaze', env);
      const matched = srkl.accounts?.find((a: any) => a.id === (payload.accountId || payload.id));
      if (matched?.credentials) {
        keyId = (matched.credentials.keyId || matched.credentials.b2KeyId || matched.credentials.accessKeyId || keyId).trim();
        appKey = (matched.credentials.applicationKey || matched.credentials.b2ApplicationKey || matched.credentials.appKey || matched.credentials.secretAccessKey || appKey).trim();
      }
    }

    if (!keyId || !appKey) return { success: false, error: 'Backblaze credentials (Key ID and Application Key) required.' };

    try {
      const buckets = await b2ListBuckets(keyId, appKey, bucketId || undefined, bucketName || undefined);
      if (Array.isArray(buckets) && buckets.length > 0) return { success: true, buckets };
    } catch (err: any) {
      console.warn('[SrklCore] Direct B2 bucket query failed, trying SRKL fallback:', err.message);
    }

    const srklUrl = await getPrimarySrklDeploymentUrl(env);
    const srklRes = await fetch(`${srklUrl}/api/backblaze/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
      body: JSON.stringify({ keyId, applicationKey: appKey, bucketId: bucketId || undefined }),
      signal: AbortSignal.timeout(6000),
    });
    if (srklRes.ok) {
      const data: any = await srklRes.json();
      if (data.success && Array.isArray(data.buckets)) return { success: true, buckets: data.buckets };
    }
    return { success: true, buckets: [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list Backblaze buckets' };
  }
}

export const srklListBackblazeBuckets = (
  keyId?: string,
  applicationKey?: string,
  bucketId?: string,
  bucketName?: string,
  userId?: string,
  accountId?: string
) => listBackblazeBuckets({ keyId, applicationKey, bucketId, bucketName, accountId }, userId);

export async function getSrklStatus(env?: Record<string, unknown>) {
  const srklUrl = await getPrimarySrklDeploymentUrl(env);
  const start = Date.now();
  try {
    const resp = await fetch(`${srklUrl}/api/ecosystem/health`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json().catch(() => ({}));
      return { success: true, deploymentUrl: srklUrl, online: true, latencyMs, details: data };
    }
    return { success: false, deploymentUrl: srklUrl, online: false, status: resp.status, latencyMs };
  } catch (err: any) {
    return { success: false, deploymentUrl: srklUrl, online: false, error: err.message, latencyMs: Date.now() - start };
  }
}
