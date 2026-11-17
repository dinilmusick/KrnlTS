/**
 * @file workspaceStorageController.ts
 * @description Controller for Workspace Cloud Storage Connections & Clone Replication.
 * Manages Primary vs Redundant Clone roles, prevents duplicates, and initializes buckets.
 * File size strictly < 200 lines.
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import { query } from '../db';
import { mergeLegacyStorageConnections } from './legacyLocalStorageProfile';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { UserStorageConnection, SrklWorkspace } from '@/libraries/types/auth';
import {
  initializeCloudWorkspaceBucket,
  writeCloudWorkspaceFile,
  testStorageConnection,
} from './cloudStorageService';
import { getDefaultWorkspaceSecret, encryptVaultBuffer } from './cryptoVault';
import { getWorkspaceVault, flushWorkspaceVault, getUserWorkspaceContext } from './workspaceVaultCoordinator';
import { addAuditLog } from '../audit';
import { upsertLegacyLocalStorageConnection } from './legacyLocalStorageProfile';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS: DEDUPLICATION & PRIMARY ROLE
// ═══════════════════════════════════════════════════════════════════════════
/** Return the non-secret connection projection used by browser-facing workspace APIs. */
const PUBLIC_STORAGE_CONNECTION_FIELDS = [
  'id', 'provider', 'label', 'role', 'enabled', 'createdAt', 'updatedAt',
  'testedAt', 'testStatus', 'latencyMs',
  'b2BucketName', 'b2Region', 'b2Endpoint', 'bucketName', 'region', 'endpoint',
  'googleEmail', 'googleRootFolderId', 'googleRootFolderName',
  'r2AccountId', 'r2BucketName', 's3BucketName', 's3Region', 's3Endpoint',
  'localFolderKey', 'localFolderName', 'localFolderPathHint',
] as const;

/** Return a strict allow-list projection for browser-facing storage APIs. */
export function sanitizeStorageConnection(connection: UserStorageConnection): UserStorageConnection {
  const safe: Record<string, unknown> = {};
  for (const key of PUBLIC_STORAGE_CONNECTION_FIELDS) {
    const value = (connection as unknown as Record<string, unknown>)[key];
    if (value !== undefined) safe[key] = value;
  }
  return safe as unknown as UserStorageConnection;
}

export function sanitizeStorageConnections(connections: UserStorageConnection[]): UserStorageConnection[] {
  return connections.map(sanitizeStorageConnection);
}

export function deduplicateConnections(conns: UserStorageConnection[]): UserStorageConnection[] {
  const seen = new Map<string, UserStorageConnection>();
  for (const c of conns) {
    const key = c.provider === 'local_fs'
      ? `local_fs:${c.label.trim()}`
      : c.provider === 'google_drive'
        ? `google_drive:${(c.googleEmail || '').trim()}:${(c.googleRootFolderId || '').trim()}`
        : `${c.provider}:${(c.b2BucketName || c.bucketName || '').trim()}:${(c.b2Endpoint || c.endpoint || '').trim()}`;
    if (!seen.has(key)) {
      seen.set(key, c);
    } else {
      const existing = seen.get(key)!;
      seen.set(key, { ...existing, ...c, id: existing.id, role: existing.role || c.role });
    }
  }
  return Array.from(seen.values());
}

export function ensurePrimaryRole(conns: UserStorageConnection[], targetId?: string): UserStorageConnection[] {
  if (conns.length === 0) return [];
  let primaryId = targetId;
  if (!primaryId) {
    const explicit = conns.find((c) => c.role === 'primary');
    if (explicit) primaryId = explicit.id;
    else {
      const firstCloud = conns.find((c) => c.provider !== 'local_fs');
      primaryId = (firstCloud || conns[0]).id;
    }
  }
  return conns.map((c) => ({
    ...c,
    role: c.id === primaryId ? 'primary' : 'redundant_clone',
    enabled: c.id === primaryId ? true : (c.enabled ?? true),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTROLLER: GET / SAVE / DELETE / SET_PRIMARY / SYNC
// ═══════════════════════════════════════════════════════════════════════════
export async function getStorageConnections(userId: string): Promise<UserStorageConnection[]> {
  const [profileResult, canonicalResult] = await Promise.all([
    query('SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1', [userId]),
    StorageServiceFacade.execute('getConnectionsWithSecrets', {
      userId,
      env: process.env as Record<string, unknown>,
    }) as Promise<UserStorageConnection[]>,
  ]);
  const profiles = profileResult.rows[0]
    ? (typeof profileResult.rows[0].app_profiles === 'string'
      ? JSON.parse(profileResult.rows[0].app_profiles)
      : (profileResult.rows[0].app_profiles || {}))
    : {};
  const legacyConnections = Array.isArray(profiles.srkl?.storage_connections)
    ? profiles.srkl.storage_connections as UserStorageConnection[]
    : [];
  const canonicalConnections = ensurePrimaryRole(deduplicateConnections(canonicalResult || []));
  const legacyRecords = mergeLegacyStorageConnections(canonicalConnections, legacyConnections);
  const preferredLegacyLocal = legacyRecords.find((connection) =>
    connection.provider === 'local_fs' && connection.role === 'primary',
  ) || legacyRecords.find((connection) => connection.provider === 'local_fs');
  const legacyOnly = legacyRecords.map((connection) => ({
    ...connection,
    ...(connection.provider === 'local_fs'
      ? {
          role: canonicalConnections.length === 0 && connection.id === preferredLegacyLocal?.id
            ? 'primary'
            : 'redundant_clone',
        }
      : { role: 'redundant_clone', enabled: false, __legacyMetadataOnly: true }),
  } as UserStorageConnection));
  return [...canonicalConnections, ...legacyOnly]
    .map((connection) => ({ ...connection, __ownerUserId: userId } as UserStorageConnection));
}

export async function saveStorageConnection(
  userId: string,
  payload: any
): Promise<{ success: boolean; connection?: UserStorageConnection; connections: UserStorageConnection[]; message?: string; isDuplicate?: boolean }> {
  const before = await getStorageConnections(userId);

  if (payload?.action === 'set_primary' && payload.id) {
    await StorageServiceFacade.execute('setPrimaryConnection', {
      userId,
      connectionId: String(payload.id),
      env: process.env as Record<string, unknown>,
    });
    const connections = await getStorageConnections(userId);
    const connection = connections.find((item) => item.id === payload.id);
    if (!connection) throw new Error('Storage connection not found after primary update.');
    await addAuditLog('STORAGE_CONNECTION_PRIMARY', userId, `Set ${connection.label} as primary storage`, 'storage');
    return { success: true, connection, connections, message: `Storage set as Primary: ${connection.label}` };
  }

  const rawConn: UserStorageConnection & {
    keyId?: unknown;
    applicationKey?: unknown;
    appKey?: unknown;
  } = payload?.connection || payload;
  if (!rawConn || typeof rawConn.provider !== 'string') {
    throw new Error('A valid storage connection payload is required.');
  }

  if (rawConn.provider === 'backblaze_b2') {
    const keyId = String(rawConn.b2KeyId || rawConn.accessKeyId || rawConn.keyId || '').trim();
    const applicationKey = String(rawConn.b2ApplicationKey || rawConn.secretAccessKey || rawConn.applicationKey || rawConn.appKey || '').trim();
    const bucketName = String(rawConn.b2BucketName || rawConn.bucketName || '').trim();
    if (!keyId || !applicationKey || !bucketName) {
      throw new Error('Backblaze Key ID, Application Key, and bucket name are required.');
    }

    const safe = await StorageServiceFacade.execute('createBackblazeConnection', {
      userId,
      label: rawConn.label,
      keyId,
      applicationKey,
      bucketName,
      region: rawConn.b2Region || rawConn.region,
      endpoint: rawConn.b2Endpoint || rawConn.endpoint,
      env: process.env as Record<string, unknown>,
    }) as UserStorageConnection;

    const connections = await getStorageConnections(userId);
    const connection = connections.find((item) => item.id === safe.id);
    if (!connection) throw new Error('Kloks saved the Backblaze connection but it could not be reloaded.');
    const isDuplicate = before.some((item) => item.id === connection.id);
    await addAuditLog(
      'STORAGE_CONNECTION_SAVED',
      userId,
      `Saved Backblaze connection ${connection.label} (${connection.role})`,
      'storage',
    );
    return {
      success: true,
      connection,
      connections,
      isDuplicate,
      message: isDuplicate ? 'Existing Backblaze connection retained.' : 'Backblaze connection tested and saved.',
    };
  }

  if (rawConn.provider === 'google_drive') {
    throw new Error('Google Drive connections must be created through the system-configured Google OAuth flow.');
  }

  if (rawConn.provider === 'local_fs') {
    // "before" is a hydrated server-only projection and may contain decrypted
    // cloud credentials. Reload the raw stored profile and persist only the
    // lossless legacy local-folder metadata update.
    const profileResult = await query(
      'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 LIMIT 1',
      [userId],
    );
    if (!profileResult.rows[0]) throw new Error('The legacy SRKL profile was not found.');
    const profiles = typeof profileResult.rows[0].app_profiles === 'string'
      ? JSON.parse(profileResult.rows[0].app_profiles)
      : (profileResult.rows[0].app_profiles || {});
    const update = upsertLegacyLocalStorageConnection(
      profiles,
      rawConn,
      before.length === 0,
    );
    await query(
      'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(update.profiles), userId],
    );

    const safeConnections = sanitizeStorageConnections([
      ...before.filter((item) => item.provider !== 'local_fs'),
      update.connection as UserStorageConnection,
    ]);
    return {
      success: true,
      connection: sanitizeStorageConnection(update.connection as UserStorageConnection),
      connections: safeConnections,
      message: 'Local storage metadata saved.',
    };
  }

  throw new Error(`Storage provider "${rawConn.provider}" is not managed by the canonical Kloks storage registry.`);
}

export async function deleteStorageConnection(userId: string, connId: string): Promise<UserStorageConnection[]> {
  const result = await StorageServiceFacade.execute('deleteConnection', {
    userId,
    connectionId: connId,
    env: process.env as Record<string, unknown>,
  }) as UserStorageConnection[];
  await addAuditLog('STORAGE_CONNECTION_DELETED', userId, `Deleted storage connection ${connId}`, 'storage');
  return getStorageConnections(userId);
}

export async function syncStorageClones(
  userId: string,
  targetCloneIds?: string[]
): Promise<{ success: boolean; syncedClones: Array<{ id: string; label: string; filesSynced: number }>; totalFiles: number }> {
  const ctx = await getUserWorkspaceContext(userId);
  if (!ctx) throw new Error('User workspace not found');
  const conns = await getStorageConnections(userId);
  const clones = conns.filter((c) => c.role !== 'primary' && c.provider !== 'local_fs' && c.enabled !== false && !(c as any).__legacyMetadataOnly && (!targetCloneIds || targetCloneIds.includes(c.id)));

  const { manager, folderPrefix } = await getWorkspaceVault(userId, ctx.workspace.id);
  const secret = getDefaultWorkspaceSecret(userId, ctx.workspace.id);
  const encDb = encryptVaultBuffer(manager.exportBinary(), secret);

  const results: Array<{ id: string; label: string; filesSynced: number }> = [];
  let totalFiles = 0;

  for (const clone of clones) {
    try {
      await initializeCloudWorkspaceBucket(clone, folderPrefix, ctx.workspace.name, encDb);
      await writeCloudWorkspaceFile(clone, folderPrefix, '.srkl/workspace.db.enc', encDb);
      results.push({ id: clone.id, label: clone.label, filesSynced: 3 });
      totalFiles += 3;
    } catch (e: any) {
      console.warn(`[SyncClones] Failed to sync ${clone.label}:`, e.message);
      results.push({ id: clone.id, label: clone.label, filesSynced: 0 });
    }
  }

  return { success: true, syncedClones: results, totalFiles };
}

async function initializeActiveWorkspaceInCloud(userId: string, ws: SrklWorkspace, conn: UserStorageConnection) {
  try {
    const { manager, folderPrefix } = await getWorkspaceVault(userId, ws.id);
    const secret = getDefaultWorkspaceSecret(userId, ws.id);
    const encDb = encryptVaultBuffer(manager.exportBinary(), secret);
    await initializeCloudWorkspaceBucket(conn, folderPrefix, ws.name, encDb);
    await flushWorkspaceVault(userId, ws.id);
  } catch (e: any) {
    console.warn('[WorkspaceStorage] Cloud init warning:', e.message);
  }
}
