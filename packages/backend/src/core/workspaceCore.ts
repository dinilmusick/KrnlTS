/**
 * @file workspaceCore.ts
 * @description Universal Workspace Core Service for DEPM.
 * Governs workspaces CRUD and Workspace Cloud Storage (Backblaze B2 via SRKL).
 * Runs identically in Node.js, Vercel Serverless, and Cloudflare Workers (< 200 lines).
 */

import { queryUnifiedDb } from './unifiedDb';
import { listUserStorageConnections, resolveUserStorageConnectionSecret, testBackblazeCredentials, createGoogleDriveWorkspaceClient } from './storageConnectionCore.js';
import { syncWorkspaceCreateToBucket, syncWorkspaceDeleteToBucket } from './workspaceBucketSyncCore';

function workspaceAppId(env?: Record<string, unknown>): string {
  const value = String(env?.WORKSPACE_APP_ID ?? 'depm').trim().toLowerCase();
  return value || 'depm';
}

function appProfile(profiles: Record<string, any>, appId: string): Record<string, any> {
  if (!profiles[appId] || typeof profiles[appId] !== 'object') profiles[appId] = {};
  return profiles[appId];
}
async function resolveWorkspaceConnectionForUser(
  userId: string,
  _profiles: Record<string, any>,
  workspace: any,
  env?: Record<string, unknown>,
): Promise<Record<string, any> | null> {
  // Cloud workspaces must retain their own opaque connection association.
  // Never substitute a user's primary/first connection for a missing ID.
  const provider = String(workspace?.storageProvider || '').trim().toLowerCase();
  const connectionId = String(workspace?.storageConnectionId || '').trim();
  if (!connectionId || !['backblaze_b2', 'google_drive'].includes(provider)) return null;

  const connection = await resolveUserStorageConnectionSecret(
    userId,
    connectionId,
    (sql, params) => queryUnifiedDb(sql, params, env),
    provider,
  );
  if (!connection || connection.enabled === false || connection.provider !== provider) return null;
  return { ...connection, __ownerUserId: userId };
}

export { loadWorkspaceData, saveWorkspaceData, renameAppInWorkspaceData } from './workspaceDataCore';
export { getWorkspaceStorageDetails } from './workspaceStorageDetailsCore';

/**
 * Resolve a workspace only within the supplied authenticated owner context.
 * The owner ID must come from the server's verified Luth principal, never from
 * request-body data. Workspace IDs are not authorization credentials.
 */
function isMissingProfileRelation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown; message?: unknown };
  if (value.code === '42P01' || value.code === 'PGRST205') return true;
  return typeof value.message === 'string'
    && /(?:relation|table).*(?:does not exist|not found)|schema cache.*(?:relation|table)/i.test(value.message);
}

/**
 * Resolve a workspace only within the supplied authenticated owner context.
 * The owner ID must come from the server's verified Luth principal, never from
 * request-body data. Workspace IDs are not authorization credentials.
 */
export async function findUserWorkspace(
  workspaceId: string,
  env?: Record<string, unknown>,
  verifiedUserId?: string,
) {
  const ownerId = String(verifiedUserId || '').trim();
  if (!ownerId) return { user: null, workspace: null, connection: null };

  let user: Record<string, any> | undefined;
  try {
    const result = await queryUnifiedDb(
      `SELECT id, email, username, app_profiles FROM "ultrst-users" WHERE id = $1 OR email = $1 LIMIT 1`,
      [ownerId],
      env,
    );
    user = result.rows[0];
  } catch (error) {
    if (!isMissingProfileRelation(error)) throw error;
  }

  if (user) {
    // This shared read migrates legacy-only app profile fields and workspace
    // associations into the canonical user profile without replacing them.
    await listUserStorageConnections(
      String(user.id),
      (sql, params) => queryUnifiedDb(sql, params, env),
    );
    const refreshed = await queryUnifiedDb(
      `SELECT id, email, username, app_profiles FROM "ultrst-users" WHERE id = $1 LIMIT 1`,
      [user.id],
      env,
    );
    if (refreshed.rows[0]) user = refreshed.rows[0];
  } else {
    try {
      const legacy = await queryUnifiedDb(
        `SELECT id, email, username, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1`,
        [ownerId],
        env,
      );
      user = legacy.rows[0];
    } catch (error) {
      if (!isMissingProfileRelation(error)) throw error;
    }
  }

  if (!user) return { user: null, workspace: null, connection: null };
  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const app = appProfile(profiles, workspaceAppId(env));
  const workspaces = Array.isArray(app.workspaces) ? app.workspaces : [];
  const workspace = workspaces.find((candidate: any) => candidate.id === workspaceId) || null;
  if (!workspace) return { user: null, workspace: null, connection: null };

  const connection = await resolveWorkspaceConnectionForUser(String(user.id), profiles, workspace, env);
  return { user, workspace, connection };
}

export async function getWorkspaces(userId?: string, env?: Record<string, unknown>) {
  if (!userId) {
    return { success: true, workspaces: [], activeWorkspaceId: null, storage_connections: [] };
  }

  let userRow: Record<string, any> | undefined;
  try {
    const canonical = await queryUnifiedDb(
      `SELECT * FROM "ultrst-users" WHERE id = $1 OR email = $1 LIMIT 1`,
      [userId],
      env,
    );
    userRow = canonical.rows[0];
  } catch (error) {
    if (!isMissingProfileRelation(error)) throw error;
  }

  const publicConnections = await listUserStorageConnections(
    String(userRow?.id || userId),
    (sql, params) => queryUnifiedDb(sql, params, env),
  );

  if (userRow) {
    const refreshed = await queryUnifiedDb(
      `SELECT * FROM "ultrst-users" WHERE id = $1 LIMIT 1`,
      [userRow.id],
      env,
    );
    if (refreshed.rows[0]) userRow = refreshed.rows[0];
  } else {
    try {
      const legacy = await queryUnifiedDb(
        `SELECT * FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1`,
        [userId],
        env,
      );
      userRow = legacy.rows[0];
    } catch (error) {
      if (!isMissingProfileRelation(error)) throw error;
    }
  }

  if (!userRow) {
    return { success: true, workspaces: [], activeWorkspaceId: null, storage_connections: publicConnections };
  }

  const profiles = typeof userRow.app_profiles === 'string' ? JSON.parse(userRow.app_profiles) : (userRow.app_profiles || {});
  const app = appProfile(profiles, workspaceAppId(env));
  const workspaces = Array.isArray(app.workspaces) ? app.workspaces : [];
  const activeWorkspaceId = app.activeWorkspaceId || null;

  return { success: true, workspaces, activeWorkspaceId, storage_connections: publicConnections };
}

export async function createWorkspace(userId: string, wsData: any, env?: Record<string, unknown>) {
  // Merge legacy SRKL app_profiles before any workspace mutation so a stale
  // canonical snapshot cannot replace legacy-only workspace references.
  await listUserStorageConnections(
    userId,
    (sql, params) => queryUnifiedDb(sql, params, env),
  );
  const uRes = await queryUnifiedDb(`SELECT * FROM "ultrst-users" WHERE id = $1`, [userId], env);
  const user = uRes.rows[0];
  if (!user) throw new Error('User account not found.');

  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const appId = workspaceAppId(env);
  const app = appProfile(profiles, appId);
  const workspaces = Array.isArray(app.workspaces) ? app.workspaces : [];

  const wsName = String(wsData?.name || 'New Workspace').trim();
  if (!wsName) throw new Error('Workspace name is required.');
  const wsId = String(wsData?.id || `ws-${appId}-${crypto.randomUUID()}`);
  const userName = String(user.username || user.name || 'user');
  const folderKey = `ultrst_${appId}_${userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${wsName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const requestedStorage = wsData?.storage && typeof wsData.storage === 'object' ? wsData.storage : {};
  const storageProvider = String(wsData?.storageProvider || requestedStorage.provider || 'local_fs').toLowerCase();
  if (!['local_fs', 'backblaze_b2', 'google_drive'].includes(storageProvider)) {
    throw new Error(`Unsupported workspace storage provider: ${storageProvider}`);
  }

  const storageConnectionId = String(
    wsData?.storageConnectionId || requestedStorage.connectionId || '',
  ).trim();
  let connection: Record<string, any> | null = null;
  let bucketName = '';
  let googleRootFolder: { id: string; name: string } | undefined;

  if (storageProvider !== 'local_fs') {
    if (!storageConnectionId) {
      throw new Error(`Select an existing ${storageProvider === 'backblaze_b2' ? 'Backblaze B2' : 'Google Drive'} connection before creating this workspace.`);
    }
    connection = await resolveUserStorageConnectionSecret(
      userId,
      storageConnectionId,
      (sql, params) => queryUnifiedDb(sql, params, env),
    );
    if (!connection || connection.enabled === false || connection.provider !== storageProvider) {
      throw new Error('The selected storage connection is unavailable or does not match the selected provider.');
    }
    connection = { ...connection, __ownerUserId: userId };

    if (storageProvider === 'backblaze_b2') {
      const keyId = String(connection.b2KeyId || connection.keyId || connection.accessKeyId || '').trim();
      const applicationKey = String(
        connection.b2ApplicationKey || connection.applicationKey || connection.appKey || connection.secretAccessKey || '',
      ).trim();
      bucketName = String(
        wsData?.b2BucketName || requestedStorage.b2BucketName || requestedStorage.bucketName
        || connection.b2BucketName || connection.bucketName || '',
      ).trim();
      if (!keyId || !applicationKey) {
        throw new Error('The selected Backblaze connection is missing its server-side credentials.');
      }
      if (!bucketName) throw new Error('Select a Backblaze B2 bucket for this workspace.');
      const validated = await testBackblazeCredentials(keyId, applicationKey);
      if (!validated.success) {
        throw new Error(validated.error || 'The selected Backblaze connection could not be validated.');
      }
      if (!validated.buckets.some((bucket) => bucket.name === bucketName)) {
        throw new Error('The selected Backblaze B2 bucket is not accessible to this connection.');
      }
    }

    if (storageProvider === 'google_drive') {
      const requestedRootFolderId = String(
        wsData?.googleRootFolderId || requestedStorage.googleRootFolderId
        || connection.googleRootFolderId || '',
      ).trim();
      if (!requestedRootFolderId) {
        throw new Error('Select a Google Drive folder before creating this workspace.');
      }
      const drive = await createGoogleDriveWorkspaceClient(
        userId,
        storageConnectionId,
        (sql, params) => queryUnifiedDb(sql, params, env),
        requestedRootFolderId,
      );
      await drive.getAccountIdentity();
      const folder = await drive.selectRootFolder(requestedRootFolderId);
      googleRootFolder = { id: folder.id, name: folder.name };
    }
  }

  const now = new Date().toISOString();
  const newWs = {
    id: wsId,
    name: wsName,
    ...(typeof wsData?.description === 'string' && wsData.description.trim()
      ? { description: wsData.description.trim() }
      : {}),
    localFolderName: folderKey,
    localFolderKey: folderKey,
    workspacePath: `./${folderKey}`,
    storageProvider,
    ...(storageConnectionId ? { storageConnectionId } : {}),
    ...(storageProvider === 'backblaze_b2' ? { b2BucketName: bucketName } : {}),
    ...(googleRootFolder ? {
      googleRootFolderId: googleRootFolder.id,
      googleRootFolderName: googleRootFolder.name,
    } : {}),
    createdAt: now,
    updatedAt: now,
  };

  workspaces.push(newWs);
  app.workspaces = workspaces;
  app.activeWorkspaceId = wsId;
  await queryUnifiedDb(`UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(profiles), user.id], env);

  try {
    if (storageProvider !== 'local_fs' && !connection) {
      throw new Error('A verified storage connection is required to initialize this workspace.');
    }
    await syncWorkspaceCreateToBucket(newWs, connection, env);
  } catch (error) {
    // Roll back the workspace association when its selected persistent storage
    // cannot be initialized. Never leave a successful-looking ghost workspace.
    app.workspaces = workspaces.filter((workspace: any) => workspace.id !== wsId);
    app.activeWorkspaceId = app.activeWorkspaceId === wsId
      ? (app.workspaces[0]?.id || null)
      : app.activeWorkspaceId;
    await queryUnifiedDb(
      `UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(profiles), user.id],
      env,
    );
    throw error;
  }

  return { success: true, workspace: newWs, workspaces: app.workspaces };
}
export async function updateWorkspace(userId: string, params: any, env?: Record<string, unknown>) {
  // Merge legacy SRKL app_profiles before any workspace mutation so a stale
  // canonical snapshot cannot replace legacy-only workspace references.
  await listUserStorageConnections(
    userId,
    (sql, params) => queryUnifiedDb(sql, params, env),
  );
  const uRes = await queryUnifiedDb(`SELECT * FROM "ultrst-users" WHERE id = $1`, [userId], env);
  const user = uRes.rows[0];
  if (!user) throw new Error('User not found.');

  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const app = appProfile(profiles, workspaceAppId(env));
  const workspaces = Array.isArray(app.workspaces) ? app.workspaces : [];

  const { action, workspaceId, updates } = params;
  const targetId = workspaceId || updates?.id;
  const match = workspaces.find((w: any) => w.id === targetId);
  if (!match) throw new Error('Workspace not found.');

  if (action === 'switch') {
    app.activeWorkspaceId = targetId;
  } else {
    // ENFORCE IMMUTABILITY: storage fields cannot be altered post-creation
    const safeUpdates = { ...(updates || params) };
    delete safeUpdates.storageProvider;
    delete safeUpdates.storageConnectionId;
    delete safeUpdates.b2BucketName;
    delete safeUpdates.b2Endpoint;
    delete safeUpdates.b2Region;
    delete safeUpdates.googleRootFolderId;
    delete safeUpdates.googleRootFolderName;
    delete safeUpdates.localFolderName;
    delete safeUpdates.localFolderKey;
    delete safeUpdates.workspacePath;
    delete safeUpdates.primaryStorage;
    delete safeUpdates.id;
    delete safeUpdates.action;
    delete safeUpdates.workspaceId;
    Object.assign(match, safeUpdates, { updatedAt: new Date().toISOString() });
  }

  await queryUnifiedDb(`UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(profiles), user.id], env);
  return { success: true, workspace: match, workspaces };
}

export async function deleteWorkspace(userId: string, wsId: string, env?: Record<string, unknown>) {
  // Merge legacy SRKL app_profiles before any workspace mutation so a stale
  // canonical snapshot cannot replace legacy-only workspace references.
  await listUserStorageConnections(
    userId,
    (sql, params) => queryUnifiedDb(sql, params, env),
  );
  const uRes = await queryUnifiedDb(`SELECT * FROM "ultrst-users" WHERE id = $1`, [userId], env);
  const user = uRes.rows[0];
  if (!user) throw new Error('User not found.');

  const profiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const app = appProfile(profiles, workspaceAppId(env));
  if (!app.workspaces) return { success: true, workspaces: [] };

  const targetWs = app.workspaces.find((w: any) => w.id === wsId);
  const provider = String(targetWs?.storageProvider || '').toLowerCase();
  const requiresOwnedCloudConnection = ['backblaze_b2', 'google_drive'].includes(provider);
  const conn = targetWs
    ? await resolveWorkspaceConnectionForUser(String(user.id), profiles, targetWs, env)
    : null;
  if (targetWs && requiresOwnedCloudConnection && !conn) {
    throw new Error('The workspace storage connection could not be resolved for its verified owner; deletion was not performed.');
  }
  // Complete the owner-bound cloud deletion before removing the durable
  // workspace reference. Provider failures leave the workspace recoverable.
  if (targetWs && conn) {
    await syncWorkspaceDeleteToBucket(targetWs, conn, env);
  }

  app.workspaces = app.workspaces.filter((w: any) => w.id !== wsId);
  if (app.activeWorkspaceId === wsId) {
    app.activeWorkspaceId = app.workspaces[0]?.id || null;
  }
  if (app.workspace_data?.[wsId]) {
    delete app.workspace_data[wsId];
  }

  await queryUnifiedDb(`UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(profiles), user.id], env);
  return { success: true, workspaces: app.workspaces };
}
