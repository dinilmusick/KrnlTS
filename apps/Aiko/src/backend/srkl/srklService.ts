/**
 * @file srklService.ts
 * @description Universal SRKL Ecosystem Service for Aiko.
 * Governs primary SRKL hub discovery, account federation, and Backblaze B2 access (< 200 lines).
 */

import { neon } from '@neondatabase/serverless';

let cachedSrklUrls: { urls: string[]; expiresAt: number } | null = null;

export async function getPrimarySrklDeploymentUrl(env?: Record<string, unknown>): Promise<string> {
  if (cachedSrklUrls && Date.now() < cachedSrklUrls.expiresAt && cachedSrklUrls.urls.length > 0) {
    return cachedSrklUrls.urls[0];
  }
  const dbUrl = (
    (env?.SYSTEM_DATABASE_URL as string) ||
    (env?.SYSTEM_DATABASE_URL_2 as string) ||
    (env?.SYSTEM_DATABASE_URL_3 as string) ||
    (typeof process !== 'undefined' ? (process.env.SYSTEM_DATABASE_URL || process.env.SYSTEM_DATABASE_URL_2 || process.env.SYSTEM_DATABASE_URL_3) : '')
  )?.trim();

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT url FROM public."ultrst-srkl-deployments"
        WHERE is_active = true
        ORDER BY is_primary DESC, priority DESC, created_at ASC
        LIMIT 5
      `;
      if (rows && rows.length > 0) {
        const urls = rows.map((r: any) => String(r.url).replace(/\/+$/, '')).filter(Boolean);
        if (urls.length > 0) {
          cachedSrklUrls = { urls, expiresAt: Date.now() + 5 * 60 * 1000 };
          return urls[0];
        }
      }
    } catch {}
  }
  return cachedSrklUrls?.urls[0] || '';
}

async function fetchB2Buckets(keyId: string, applicationKey: string): Promise<any[]> {
  const basic = btoa(`${keyId.trim()}:${applicationKey.trim()}`);
  const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!authRes.ok) throw new Error(`B2 Authorization failed: ${authRes.status}`);
  const authData: any = await authRes.json();
  const res = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { Authorization: authData.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: authData.accountId }),
  });
  if (!res.ok) throw new Error(`B2 list buckets failed: ${res.status}`);
  const data: any = await res.json();
  return data.buckets || [];
}

function deduplicateAccounts(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const a of items) {
    if (!a) continue;
    const creds = a.credentials || a.metadata?.credentials || a;
    const keyId = (creds.keyId || creds.b2KeyId || creds.accessKeyId || '').trim();
    const token = (creds.token || creds.apiToken || creds.applicationKey || '').trim();
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
  userId: string,
  service?: string,
  authorization = '',
  env?: Record<string, unknown>
): Promise<{ success: boolean; deploymentUrl: string; userId: string; count: number; accounts: any[]; error?: string }> {
  const rawAccounts: any[] = [];
  const srklUrl = await getPrimarySrklDeploymentUrl(env);
  if (!srklUrl) {
    return { success: false, deploymentUrl: '', userId, count: 0, accounts: [], error: 'No active SRKL deployment found in system database.' };
  }

  let fetchError: string | undefined;
  try {
    if (!authorization) throw new Error('A verified Luth session is required for SRKL federation.');
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-user-id': userId,
      'x-app-id': 'aiko',
      authorization: authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`,
    };
    const resp = await fetch(`${srklUrl}/api/ecosystem/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        categories: ['storage', 'ai'],
        requiredServices: ['backblaze_b2', 'cloudflare_r2', 'aws_s3', 'aiko'],
        appId: 'aiko',
        includeCredentials: false,
      }),
    });
    if (resp.ok) {
      const data: any = await resp.json();
      const accountsList = Array.isArray(data.accounts) ? data.accounts : [];
      for (const ea of accountsList) {
        if (!service || (ea.serviceId || ea.provider || '').toLowerCase().includes(service.toLowerCase())) {
          rawAccounts.push(ea);
        }
      }
    }
  } catch (err: any) {
    fetchError = err.message;
  }

  const accounts = deduplicateAccounts(rawAccounts);
  return { success: true, deploymentUrl: srklUrl, userId, count: accounts.length, accounts, error: fetchError };
}

export async function getSrklStatus(env?: Record<string, unknown>) {
  const srklUrl = await getPrimarySrklDeploymentUrl(env);
  if (!srklUrl) return { success: false, deploymentUrl: '', online: false, error: 'No active SRKL deployment found.' };
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

export async function listBackblazeBuckets(
  payload: any,
  rawUserId?: string,
  authorization = '',
  env?: Record<string, unknown>
): Promise<{ success: boolean; buckets?: any[]; error?: string }> {
  try {
    const userId = rawUserId || payload?.userId || payload?.credentials?.userId || '';
    const creds = payload?.credentials || {};
    let keyId = (payload?.keyId || payload?.b2KeyId || payload?.accessKeyId || creds.keyId || creds.b2KeyId || creds.accessKeyId || '').trim();
    let appKey = (payload?.applicationKey || payload?.b2ApplicationKey || payload?.appKey || payload?.secretAccessKey || creds.applicationKey || creds.b2ApplicationKey || creds.appKey || creds.secretAccessKey || '').trim();
    const bucketId = (payload?.bucketId || creds.bucketId || '').trim();
    const bucketName = (payload?.bucketName || payload?.b2BucketName || creds.bucketName || creds.b2BucketName || '').trim();

    if ((!keyId || !appKey) && (payload?.accountId || payload?.id) && userId) {
      const srkl = await getSrklAccounts(userId, 'backblaze', authorization, env);
      const matched = srkl.accounts?.find((a: any) => a.id === (payload.accountId || payload.id));
      if (matched?.credentials) {
        keyId = (matched.credentials.keyId || matched.credentials.b2KeyId || matched.credentials.accessKeyId || keyId).trim();
        appKey = (matched.credentials.applicationKey || matched.credentials.b2ApplicationKey || matched.credentials.appKey || matched.credentials.secretAccessKey || appKey).trim();
      }
    }

    if (!keyId || !appKey) return { success: false, error: 'Backblaze credentials (Key ID and Application Key) required.' };

    const buckets = await fetchB2Buckets(keyId, appKey);
    return { success: true, buckets: buckets || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed listing Backblaze buckets' };
  }
}
