/**
 * @file ecosystemAccountResolver.ts
 * @description Standardized Skipo Ecosystem Account Resolver for SRKL Service Broker.
 * Aggregates workspace vault accounts and cloud storage connections into uniform
 * Skipo EcosystemAccount entities based on the consumer app's manifest (< 200 lines).
 */

import { query } from '../db';
import { getWorkspaceVault } from '../storage/workspaceVaultCoordinator';
import {
  AppAccountManifest,
  EcosystemAccount,
  EcosystemServiceCategory,
} from '@/libraries/types/ecosystem';

export function inferCategory(serviceId?: string, provider?: string): EcosystemServiceCategory {
  const s = `${serviceId || ''} ${provider || ''}`.toLowerCase();
  if (s.includes('vercel') || s.includes('cloudflare') || s.includes('workers') || s.includes('deploy') || s.includes('netlify')) {
    return 'deployment';
  }
  if (s.includes('b2') || s.includes('backblaze') || s.includes('s3') || s.includes('storage') || s.includes('r2')) {
    return 'storage';
  }
  if (s.includes('github') || s.includes('gitlab') || s.includes('bitbucket') || s.includes('git')) {
    return 'vcs';
  }
  if (s.includes('aiko') || s.includes('gemini') || s.includes('openai') || s.includes('anthropic') || s.includes('studio') || s.includes('ai')) {
    return 'ai';
  }
  if (s.includes('postgres') || s.includes('neon') || s.includes('supabase') || s.includes('sql') || s.includes('db')) {
    return 'database';
  }
  return 'general';
}

export function normalizeProvider(serviceId?: string, provider?: string): string {
  const s = `${serviceId || ''} ${provider || ''}`.toUpperCase();
  if (s.includes('AIKO')) return 'AIKO';
  if (s.includes('VERCEL')) return 'VERCEL';
  if (s.includes('CLOUDFLARE_R2') || s.includes('R2')) return 'CLOUDFLARE_R2';
  if (s.includes('CLOUDFLARE')) return 'CLOUDFLARE';
  if (s.includes('BACKBLAZE') || s.includes('B2')) return 'BACKBLAZE_B2';
  if (s.includes('AWS') || s.includes('S3')) return 'AWS';
  if (s.includes('GITHUB')) return 'GITHUB';
  if (s.includes('NEON')) return 'NEON';
  if (s.includes('SUPABASE')) return 'SUPABASE';
  return (provider || serviceId || 'UNKNOWN').toUpperCase();
}

function deduplicateEcosystemAccounts(items: EcosystemAccount[]): EcosystemAccount[] {
  const seen = new Set<string>();
  const out: EcosystemAccount[] = [];
  for (const a of items) {
    if (!a) continue;
    const creds = a.credentials || {};
    const keyId = (creds.keyId || creds.b2KeyId || creds.accessKeyId || '').trim();
    const token = (creds.token || creds.apiToken || creds.accessToken || '').trim();
    const sig = keyId
      ? `key:${keyId}`
      : token
      ? `tok:${token.slice(0, 16)}`
      : a.id
      ? `id:${a.id}`
      : `name:${a.name || a.serviceId}`;
    if (!seen.has(sig)) {
      seen.add(sig);
      if (a.id) seen.add(`id:${a.id}`);
      out.push(a);
    }
  }
  return out;
}

export function sanitizeCredentials(creds: Record<string, any> = {}): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(creds)) {
    if (typeof v !== 'string') continue;
    safe[k] = /^(bucket|endpoint|region|account|username|role|provider)/i.test(k)
      ? v : /^(keyid|b2keyid|accesskeyid)/i.test(k) ? (v.length > 8 ? `${v.slice(0, 4)}...${v.slice(-4)}` : '••••') : '••••••••';
  }
  return safe;
}

export async function resolveEcosystemAccounts(
  userId: string,
  manifest?: AppAccountManifest,
  targetWsParam?: string,
  options?: { includeCredentials?: boolean }
): Promise<{ count: number; accounts: EcosystemAccount[]; workspaceId: string }> {
  const rawAccounts: EcosystemAccount[] = [];
  let effectiveWsId = '';
  const includeCreds = options?.includeCredentials ?? manifest?.includeCredentials ?? false;

  // 1. Resolve user record and storage connections
  const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1 OR email = $1', [userId]);
  if (userRes.rows.length === 0) return { count: 0, accounts: [], workspaceId: '' };
  const user = userRes.rows[0];
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const srkl = appProfiles.srkl || {};
  const workspaces = srkl.workspaces || [];
  effectiveWsId = (targetWsParam && targetWsParam !== 'active') ? targetWsParam : (srkl.activeWorkspaceId || workspaces[0]?.id || '');

  // 2. Ingest profile storage connections
  const conns: any[] = srkl.storage_connections || [];
  for (const c of conns) {
    const prov = normalizeProvider(c.provider, c.provider);
    rawAccounts.push({
      id: c.id,
      serviceId: c.provider === 'backblaze_b2' ? 'backblaze' : (c.provider || 'storage'),
      provider: prov,
      category: 'storage',
      name: c.label || 'Storage Connection',
      emailOrSlug: c.b2KeyId || c.accessKeyId || c.label,
      status: c.testStatus === 'ok' ? 'CONNECTED' : (c.enabled !== false ? 'ACTIVE' : 'ERROR'),
      credentials: {
        keyId: c.b2KeyId || c.keyId || c.accessKeyId || '',
        applicationKey: c.b2ApplicationKey || c.applicationKey || c.secretAccessKey || '',
        bucketName: c.b2BucketName || c.bucketName || '',
        bucketId: c.b2BucketId || c.bucketId || '',
        endpoint: c.b2Endpoint || c.endpoint || '',
        region: c.b2Region || c.region || '',
      },
      groupIds: c.groupIds || (c.groupId ? [c.groupId] : []),
      metadata: { role: c.role, provider: c.provider },
      createdAt: c.createdAt,
    });
  }

  // 3. Ingest workspace vault service accounts
  if (effectiveWsId) {
    try {
      const { manager } = await getWorkspaceVault(user.id, effectiveWsId);
      const vaultAccounts = manager.getServiceAccounts();
      for (const s of vaultAccounts) {
        const cat = inferCategory(s.serviceId, s.provider);
        const prov = normalizeProvider(s.serviceId, s.provider);
        rawAccounts.push({
          id: s.id,
          serviceId: s.serviceId,
          provider: prov,
          category: cat,
          name: s.name || s.serviceId,
          emailOrSlug: s.emailOrSlug || s.credentials?.account || s.credentials?.username || s.name,
          status: s.status || 'CONNECTED',
          credentials: s.credentials || {},
          groupIds: s.groupIds || (s.groupId ? [s.groupId] : []),
          metadata: s.metadata || {},
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        });
      }
    } catch (err: any) {
      console.warn('[EcosystemResolver] Vault accounts resolution failed:', err.message);
    }
  }

  // 3b. Ingest canonical SRKL user accounts. These are authoritative credentials
  // registered by any ecosystem application and synchronized explicitly by consumers.
  for (const a of (srkl.accounts || [])) {
    rawAccounts.push({
      id: a.id,
      serviceId: a.serviceId,
      provider: normalizeProvider(a.serviceId, a.provider),
      category: a.category || inferCategory(a.serviceId, a.provider),
      name: a.name || a.serviceId,
      emailOrSlug: a.emailOrSlug,
      status: a.status || 'CONNECTED',
      credentials: a.credentials || {},
      groupIds: a.groupIds || [],
      metadata: a.metadata || {},
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    });
  }

  // 4. Filter according to AppAccountManifest requirements
  let filtered = rawAccounts;
  if (manifest) {
    if (Array.isArray(manifest.categories) && manifest.categories.length > 0) {
      filtered = filtered.filter((a) => manifest.categories!.includes(a.category));
    }
    if (Array.isArray(manifest.requiredServices) && manifest.requiredServices.length > 0) {
      const allowed = manifest.requiredServices.map((s) => s.toLowerCase());
      filtered = filtered.filter((a) =>
        allowed.some((req) => a.serviceId.toLowerCase().includes(req) || a.provider.toLowerCase().includes(req))
      );
    }
  }

  const deduped = deduplicateEcosystemAccounts(filtered);
  const finalAccounts = includeCreds ? deduped : deduped.map((a) => ({ ...a, credentials: sanitizeCredentials(a.credentials) }));
  return { count: finalAccounts.length, accounts: finalAccounts, workspaceId: effectiveWsId };
}

