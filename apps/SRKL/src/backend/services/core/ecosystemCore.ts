/**
 * @file ecosystemCore.ts
 * @description Isomorphic Ecosystem & Service Registry Core for SRKL.
 * Operates uniformly across Express, Vercel, and Cloudflare Workers.
 * Conforms to Skipo Governance (< 200 lines).
 */

import { queryUnifiedDb } from './unifiedDb';

export function getEcosystemHealth(): { status: string; app: string; engine: string; timestamp: string } {
  return {
    status: 'ONLINE',
    app: 'srkl',
    engine: 'srkl-service-broker',
    timestamp: new Date().toISOString(),
  };
}

export async function getEcosystemApps(env?: Record<string, unknown>): Promise<{ success: boolean; apps: any[] }> {
  try {
    const res = await queryUnifiedDb(
      'SELECT app_id, name, description, supported_services, status FROM "ultrst-apps" WHERE status = \'active\';',
      [],
      env
    );
    return { success: true, apps: res.rows };
  } catch (err: any) {
    return { success: false, apps: [] };
  }
}

export async function getEcosystemServices(
  userId: string,
  env?: Record<string, unknown>
): Promise<{ success: boolean; services: any[] }> {
  if (!userId) return { success: false, services: [] };
  try {
    const res = await queryUnifiedDb('SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1;', [userId], env);
    if (res.rows.length === 0) return { success: true, services: [] };
    const appProfiles = typeof res.rows[0].app_profiles === 'string' ? JSON.parse(res.rows[0].app_profiles) : (res.rows[0].app_profiles || {});
    const services = appProfiles.srkl?.services || [];
    return { success: true, services };
  } catch {
    return { success: false, services: [] };
  }
}

export async function getEcosystemAccounts(
  userId: string,
  manifest?: any,
  env?: Record<string, unknown>
): Promise<{ success: boolean; accounts: any[]; count: number }> {
  if (!userId) return { success: false, accounts: [], count: 0 };
  try {
    const res = await queryUnifiedDb('SELECT id, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1;', [userId], env);
    if (res.rows.length === 0) return { success: true, accounts: [], count: 0 };
    const p = typeof res.rows[0].app_profiles === 'string' ? JSON.parse(res.rows[0].app_profiles) : (res.rows[0].app_profiles || {});
    const conns: any[] = p.srkl?.storage_connections || [];
    const accounts: any[] = [];
    for (const c of conns) {
      accounts.push({
        id: c.id,
        serviceId: c.provider === 'backblaze_b2' ? 'backblaze' : (c.provider || 'storage'),
        provider: (c.provider || 'BACKBLAZE_B2').toUpperCase(),
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
    for (const s of p.srkl?.services || []) {
      accounts.push(s);
    }
    return { success: true, accounts, count: accounts.length };
  } catch {
    return { success: false, accounts: [], count: 0 };
  }
}
