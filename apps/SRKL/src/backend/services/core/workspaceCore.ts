/**
 * @file workspaceCore.ts
 * @description Isomorphic Workspace & Storage Connection Core for SRKL.
 * Operates across Node.js, Vercel, and Cloudflare Workers.
 * Conforms to Skipo Governance (< 200 lines).
 */

import { queryUnifiedDb } from './unifiedDb';

export function sanitizeWorkspaceName(name: string): string {
  return (name || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'default';
}

export function formatCanonicalFolder(appName = 'srkl', userName = 'user', wsName = 'default'): string {
  const cleanWs = sanitizeWorkspaceName(wsName);
  const cleanUser = sanitizeWorkspaceName(userName);
  return `ultrst_${appName}_${cleanUser}_${cleanWs}`;
}

export async function getUserProfile(userId: string, env?: Record<string, unknown>): Promise<any | null> {
  if (!userId) return null;
  const res = await queryUnifiedDb('SELECT * FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1;', [userId], env);
  return res.rows[0] || null;
}

export async function getWorkspaces(
  userId: string,
  env?: Record<string, unknown>
): Promise<{ workspaces: any[]; activeWorkspaceId: string; storage_connections: any[] }> {
  const user = await getUserProfile(userId, env);
  if (!user) return { workspaces: [], activeWorkspaceId: '', storage_connections: [] };

  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const srkl = appProfiles.srkl || {};
  const workspaces = Array.isArray(srkl.workspaces) ? srkl.workspaces : [];
  const canonical = workspaces[0] || {
    id: `ws-srkl-${userId}`,
    name: 'Default',
    workspacePath: `./${formatCanonicalFolder('srkl', user.username || user.name || 'user', 'default')}`,
    storageProvider: srkl.storage_connections?.[0]?.provider || 'local_fs',
    storageConnectionId: srkl.storage_connections?.[0]?.id || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (workspaces.length !== 1 || srkl.activeWorkspaceId !== canonical.id) {
    if (!appProfiles.srkl) appProfiles.srkl = {};
    appProfiles.srkl.workspaces = [canonical];
    appProfiles.srkl.activeWorkspaceId = canonical.id;
    await queryUnifiedDb(
      'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
      [JSON.stringify(appProfiles), userId],
      env
    );
  }

  return {
    workspaces: [canonical],
    activeWorkspaceId: canonical.id,
    storage_connections: srkl.storage_connections || [],
  };
}

export async function createWorkspace(
  userId: string,
  wsData: { name: string; storageConnectionId?: string; storageProvider?: string },
  env?: Record<string, unknown>
): Promise<{ success: boolean; workspace?: any; error?: string }> {
  if (!userId) return { success: false, error: 'User ID is required' };
  const user = await getUserProfile(userId, env);
  if (!user) return { success: false, error: 'User not found' };

  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  if (!appProfiles.srkl) appProfiles.srkl = {};
  const existing = Array.isArray(appProfiles.srkl.workspaces) ? appProfiles.srkl.workspaces[0] : null;
  if (existing) {
    appProfiles.srkl.workspaces = [existing];
    appProfiles.srkl.activeWorkspaceId = existing.id;
    await queryUnifiedDb(
      'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
      [JSON.stringify(appProfiles), userId],
      env
    );
    return { success: false, workspace: existing, error: 'SRKL allows exactly one default workspace per user' };
  }

  const conns = appProfiles.srkl.storage_connections || [];
  const conn = conns.find((c: any) => c.id === wsData.storageConnectionId) || conns[0];
  const wsId = `ws-srkl-${userId}`;
  const userName = user.username || user.name || 'user';
  const workspaceName = (wsData.name || 'Default').trim() || 'Default';
  const newWs = {
    id: wsId,
    name: workspaceName,
    workspacePath: `./${formatCanonicalFolder('srkl', userName, 'default')}`,
    storageProvider: conn?.provider || wsData.storageProvider || 'local_fs',
    storageConnectionId: conn?.id || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appProfiles.srkl.workspaces = [newWs];
  appProfiles.srkl.activeWorkspaceId = wsId;
  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );
  return { success: true, workspace: newWs };
}

export async function saveStorageConnection(
  userId: string,
  conn: any,
  env?: Record<string, unknown>
): Promise<{ success: boolean; connections: any[]; connection: any }> {
  const user = await getUserProfile(userId, env);
  if (!user) throw new Error('User not found');

  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  if (!appProfiles.srkl) appProfiles.srkl = {};

  const conns = appProfiles.srkl.storage_connections || [];
  const connId = conn.id || `conn_b2_${Date.now()}`;
  const isPrimary = conns.length === 0 || conn.role === 'primary';

  const entry = {
    ...conn,
    id: connId,
    role: isPrimary ? 'primary' : conn.role || 'redundant_clone',
    enabled: true,
    updatedAt: new Date().toISOString(),
    createdAt: conn.createdAt || new Date().toISOString(),
  };

  const idx = conns.findIndex((c: any) => c.id === connId);
  if (idx >= 0) conns[idx] = entry;
  else conns.push(entry);

  appProfiles.srkl.storage_connections = conns;
  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );

  return { success: true, connections: conns, connection: entry };
}

export async function deleteStorageConnection(
  userId: string,
  connId: string,
  env?: Record<string, unknown>
): Promise<{ success: boolean; connections: any[] }> {
  const user = await getUserProfile(userId, env);
  if (!user) throw new Error('User not found');

  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const conns = (appProfiles.srkl?.storage_connections || []).filter((c: any) => c.id !== connId);

  if (appProfiles.srkl) appProfiles.srkl.storage_connections = conns;

  await queryUnifiedDb(
    'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2;',
    [JSON.stringify(appProfiles), userId],
    env
  );

  return { success: true, connections: conns };
}
