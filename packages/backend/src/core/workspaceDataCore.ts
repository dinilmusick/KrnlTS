/**
 * @file workspaceDataCore.ts
 * @description User-Scoped Workspace Data Persistence for DEPM.
 * Persists apps, graphs, ecosystems to "ultrst-users".app_profiles.depm.workspace_data[workspaceId].
 * Runs identically in Node.js, Vercel Serverless, and Cloudflare Workers (< 200 lines).
 */

import { queryUnifiedDb } from './unifiedDb';
import { syncWorkspaceDataToBucket } from './workspaceBucketSyncCore';
import { listUserStorageConnections, resolveUserStorageConnectionSecret } from './storageConnectionCore.js';
import { readWorkspaceFile } from './workspaceFileCore';

async function resolveWorkspaceConnectionForOwner(
  user: Record<string, any>,
  workspace: Record<string, any>,
  env?: Record<string, unknown>,
) {
  const userId = String(user?.id || '').trim();
  const connectionId = String(workspace?.storageConnectionId || '').trim();
  const provider = String(workspace?.storageProvider || '').toLowerCase();
  if (!userId || !connectionId || !['backblaze_b2', 'google_drive'].includes(provider)) return null;
  const connection = await resolveUserStorageConnectionSecret(
    userId,
    connectionId,
    (sql, params) => queryUnifiedDb(sql, params, env),
    provider,
  );
  if (!connection || connection.enabled === false || String(connection.provider || '').toLowerCase() !== provider) {
    return null;
  }
  return { ...connection, __ownerUserId: userId };
}

async function resolveUserRow(userId?: string, env?: Record<string, unknown>) {
  if (!userId) return null;
  const query = (sql: string, params?: unknown[]) => queryUnifiedDb(sql, params, env);
  await listUserStorageConnections(userId, query);

  try {
    const canonical = await queryUnifiedDb(
      `SELECT * FROM "ultrst-users" WHERE id = $1 OR email = $1 LIMIT 1`,
      [userId],
      env,
    );
    if (canonical.rows.length > 0) return canonical.rows[0];
  } catch (error) {
    const value = error as { code?: unknown; message?: unknown };
    const missing = value?.code === '42P01' || value?.code === 'PGRST205'
      || (typeof value?.message === 'string' && /(?:relation|table).*(?:does not exist|not found)/i.test(value.message));
    if (!missing) throw error;
  }

  const legacy = await queryUnifiedDb(
    `SELECT * FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1`,
    [userId],
    env,
  );
  return legacy.rows[0] || null;
}

export async function loadWorkspaceData(userId?: string, workspaceId?: string, env?: Record<string, unknown>) {
  if (!workspaceId) return { success: false, error: 'workspaceId required', workspace: null };
  const user = await resolveUserRow(userId, env);
  if (!user) return { success: false, error: 'User not found', workspace: null };

  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const depm = profiles.depm || {};
  const workspaceDataMap = depm.workspace_data || {};
  let data = workspaceDataMap[workspaceId];

  // Self-healing recovery: if DB has no data or empty content, attempt to recover from cloud bucket
  const isEmptyData = !data || ((!data.nodes || data.nodes.length === 0) && (!data.apps || data.apps.length === 0));
  if (isEmptyData) {
    const ws = (depm.workspaces || []).find((w: any) => w.id === workspaceId);
    if (ws) {
      const conn = await resolveWorkspaceConnectionForOwner(user, ws, env);
      if (conn) {
        try {
          const fileBuf = await readWorkspaceFile(ws, conn, 'ecosystem.json');
          if (fileBuf && fileBuf.length > 0) {
            const parsed = JSON.parse(new TextDecoder().decode(fileBuf));
            if ((parsed.nodes && parsed.nodes.length > 0) || (parsed.apps && parsed.apps.length > 0)) {
              if (!profiles.depm) profiles.depm = {};
              if (!profiles.depm.workspace_data) profiles.depm.workspace_data = {};
              profiles.depm.workspace_data[workspaceId] = parsed;
              data = parsed;
              await queryUnifiedDb(
                `UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`,
                [JSON.stringify(profiles), user.id],
                env
              );
              return { success: true, workspace: data, workspaceId };
            }
          }
        } catch (err: any) {
          console.warn('[WorkspaceDataCore] Storage recovery check:', err.message);
        }
      }
    }
  }

  if (!data) {
    const ws = (depm.workspaces || []).find((w: any) => w.id === workspaceId);
    const ecoName = ws?.ecosystemName || `${ws?.name || 'Workspace'} Ecosystem`;
    const fallback = {
      apps: [],
      accounts: [],
      deployments: [],
      nodes: [],
      edges: [],
      ecosystems: [
        {
          id: `eco_${workspaceId}`,
          name: ecoName,
          icon: 'Globe',
          health: 'HEALTHY',
          status: 'SYSTEM ONLINE',
          connectedAppsCount: 0,
          meshLinkCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      ecosystemName: ecoName,
      ecosystemNodes: [
        {
          id: `node_eco_root_${workspaceId}`,
          type: 'ECOSYSTEM',
          name: ecoName,
          x: 0,
          y: 0,
          appId: '__ecosystem__',
          icon: 'Globe',
          ecosystemData: { connectedAppsCount: 0, health: 'HEALTHY', status: 'SYSTEM ONLINE' },
        },
      ],
      ecosystemEdges: [],
    };
    return { success: true, workspace: fallback, workspaceId };
  }

  return { success: true, workspace: data, workspaceId };
}

export async function saveWorkspaceData(
  userId: string | undefined,
  workspaceId: string,
  data: any,
  env?: Record<string, unknown>
) {
  if (!workspaceId) return { success: false, error: 'workspaceId required' };
  const user = await resolveUserRow(userId, env);
  if (!user) return { success: false, error: 'User not found' };

  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  if (!profiles.depm) profiles.depm = {};
  if (!profiles.depm.workspace_data) profiles.depm.workspace_data = {};

  // Anti-wipe protection: prevent empty state from overwriting populated workspace data
  const existing = profiles.depm.workspace_data[workspaceId];
  const incomingEmpty = (!data.nodes || data.nodes.length === 0) && (!data.apps || data.apps.length === 0);
  const existingHasData = existing && ((existing.nodes && existing.nodes.length > 0) || (existing.apps && existing.apps.length > 0));
  if (incomingEmpty && existingHasData && !data._forceEmptySave) {
    console.warn(`[WorkspaceDataCore] Blocked empty overwrite for workspace ${workspaceId}.`);
    return { success: true, workspaceId, workspace: existing, protected: true };
  }

  profiles.depm.workspace_data[workspaceId] = data;

  if (Array.isArray(profiles.depm.workspaces)) {
    const ws = profiles.depm.workspaces.find((w: any) => w.id === workspaceId);
    if (ws) {
      ws.appsCount = Array.isArray(data.apps) ? data.apps.length : 0;
      ws.updatedAt = new Date().toISOString();
    }
  }

  await queryUnifiedDb(
    `UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(profiles), user.id],
    env
  );

  const ws = Array.isArray(profiles.depm?.workspaces) ? profiles.depm.workspaces.find((w: any) => w.id === workspaceId) : null;
  if (ws) {
    const provider = String(ws.storageProvider || '').toLowerCase();
    if (provider === 'backblaze_b2' || provider === 'google_drive') {
      const conn = await resolveWorkspaceConnectionForOwner(user, ws, env);
      if (!conn) {
        throw new Error('Workspace data synchronization requires its exact owner-owned storage connection.');
      }
      await syncWorkspaceDataToBucket(
        { ...ws, __ownerUserId: String(user.id) },
        conn,
        data,
        env,
      );
    }
  }

  return { success: true, workspaceId, workspace: data };
}

export async function renameAppInWorkspaceData(
  userId: string | undefined,
  workspaceId: string,
  appId: string,
  newName: string,
  env?: Record<string, unknown>
) {
  if (!workspaceId || !appId || !newName) {
    return { success: false, error: 'workspaceId, appId and newName required' };
  }
  const loadRes = await loadWorkspaceData(userId, workspaceId, env);
  if (!loadRes.success || !loadRes.workspace) return loadRes;

  const wsData = loadRes.workspace;
  const trimmed = newName.trim();
  const folderName = trimmed.replace(/[/\\?%*:|"<>]/g, '_');

  if (Array.isArray(wsData.apps)) {
    const targetApp = wsData.apps.find((a: any) => a.id === appId);
    if (targetApp) {
      targetApp.name = trimmed;
      targetApp.folderName = folderName;
      targetApp.updatedAt = new Date().toISOString();
    }
  }

  if (Array.isArray(wsData.nodes)) {
    wsData.nodes = wsData.nodes.map((n: any) => {
      if (n.appId === appId && (n.type === 'APP' || n.type === 'APP_NODE' || n.type === 'APP_GRAPH_NODE')) {
        return { ...n, name: trimmed, appData: n.appData ? { ...n.appData, name: trimmed, folderName } : undefined };
      }
      return n;
    });
  }

  return await saveWorkspaceData(userId, workspaceId, wsData, env);
}
