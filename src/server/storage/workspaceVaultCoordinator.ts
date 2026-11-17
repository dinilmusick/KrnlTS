/**
 * @file workspaceVaultCoordinator.ts
 * @description Coordinates Encrypted SQLite Workspace Vaults across memory, disk, and Backblaze B2 / S3.
 * File size strictly < 200 lines.
 */

import fs from 'fs';
import path from 'path';
import { SqliteWorkspaceManager } from './sqliteWorkspaceManager';
import { encryptVaultBuffer, decryptVaultBuffer, getDefaultWorkspaceSecret, decryptExistingVaultOrThrow } from './cryptoVault';
import { readCloudWorkspaceFile, writeCloudWorkspaceFile, ensureCloudDirectoryMarker } from './cloudStorageService';
import { extractCanonicalFolderPrefix, sanitizeFolderSegment } from './workspaceCanonical';
import { query } from '../db';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { UserStorageConnection } from '@/libraries/types/auth';

interface CachedVault {
  manager: SqliteWorkspaceManager;
  folderPrefix: string;
  conn: UserStorageConnection | null;
  vaultUpdatedAt?: string;
  cachedAt: number;
}

const activeVaults = new Map<string, CachedVault>();
const flushQueues = new Map<string, Promise<boolean>>();

export async function getUserWorkspaceContext(userId: string, targetWsId?: string): Promise<{
  workspace: any;
  conn: UserStorageConnection | null;
  folderPrefix: string;
  userName: string;
} | null> {
  const res = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const srkl = appProfiles.srkl || {};
  const workspaces = srkl.workspaces || [];
  const userName = user.username || user.name || 'user';
  const ws = (targetWsId ? workspaces.find((w: any) => w.id === targetWsId) : null) ||
    workspaces.find((w: any) => w.id === srkl.activeWorkspaceId) || workspaces[0] ||
    { id: 'ws-srkl-default', name: 'SRKL Vault', workspacePath: `./ultrst_srkl_${sanitizeFolderSegment(userName)}_vault`, storageProvider: 'local_fs' };

  const connections = await StorageServiceFacade.execute('getConnectionsWithSecrets', {
    userId,
    env: process.env as Record<string, unknown>,
  }) as UserStorageConnection[];
  const savedConnection = ws.storageConnectionId
    ? connections.find((connection) => connection.id === ws.storageConnectionId) || null
    : ws.storageProvider
      ? connections.find((connection) => connection.provider === ws.storageProvider && connection.role === 'primary')
        || connections.find((connection) => connection.provider === ws.storageProvider)
        || null
      : connections.find((connection) => connection.role === 'primary') || null;
  if (savedConnection && (savedConnection as any).__legacyMetadataOnly) {
    throw new Error('This legacy cloud connection is preserved as encrypted profile metadata but must be reconnected through Kloks before the workspace vault can use it.');
  }

  const conn = savedConnection
    ? {
        ...savedConnection,
        __ownerUserId: userId,
        ...(savedConnection.provider === 'google_drive' && ws.googleRootFolderId
          ? { googleRootFolderId: ws.googleRootFolderId }
          : {}),
        ...(savedConnection.provider === 'backblaze_b2' && ws.b2BucketName
          ? { b2BucketName: ws.b2BucketName, bucketName: ws.b2BucketName }
          : {}),
      }
    : null;
  if (ws.storageProvider !== 'local_fs' && !conn) throw new Error(`Cloud storage connection for workspace "${ws.name}" is unavailable`);
  const folderPrefix = extractCanonicalFolderPrefix(ws.workspacePath, userName, ws.name);
  return { workspace: ws, conn, folderPrefix, userName };
}

export async function getWorkspaceVault(userId: string, targetWsId?: string): Promise<{
  manager: SqliteWorkspaceManager; folderPrefix: string; conn: UserStorageConnection | null;
}> {
  const ctx = await getUserWorkspaceContext(userId, targetWsId);
  if (!ctx) throw new Error('User workspace context could not be resolved');
  const cacheKey = `${userId}:${ctx.workspace.id}`;
  const currentToken = (ctx.workspace.vaultUpdatedAt || ctx.workspace.updatedAt || '').trim();

  if (activeVaults.has(cacheKey)) {
    const cached = activeVaults.get(cacheKey)!;
    if (cached.vaultUpdatedAt === currentToken && Date.now() - cached.cachedAt < 10000) return cached;
    try { cached.manager.close(); } catch {}
    activeVaults.delete(cacheKey);
  }

  const { workspace, conn, folderPrefix } = ctx;
  const secret = getDefaultWorkspaceSecret(userId, workspace.id);
  let decryptedBytes: Buffer | undefined;

  if (conn && conn.provider !== 'local_fs') {
    const encBuf = await readCloudWorkspaceFile(conn, folderPrefix, '.srkl/workspace.db.enc');
    if (encBuf !== null && encBuf !== undefined) {
      decryptedBytes = decryptExistingVaultOrThrow(encBuf, secret, 'cloud');
    }
  } else {
    const localDbPath = path.resolve(process.cwd(), folderPrefix, '.srkl', 'workspace.db.enc');
    if (fs.existsSync(localDbPath)) {
      decryptedBytes = decryptExistingVaultOrThrow(fs.readFileSync(localDbPath), secret, 'local');
    }
  }

  const manager = await SqliteWorkspaceManager.init(decryptedBytes);
  const entry: CachedVault = { manager, folderPrefix, conn, vaultUpdatedAt: currentToken, cachedAt: Date.now() };
  activeVaults.set(cacheKey, entry);
  return entry;
}

async function executeVaultFlush(
  userId: string, targetWsId: string | undefined, ctx: any, cacheKey: string, force: boolean
): Promise<boolean> {
  let vault = activeVaults.get(cacheKey);
  if (!vault) vault = (await getWorkspaceVault(userId, targetWsId)) as CachedVault;
  if (!vault || (!vault.manager.isDirty && !force)) return false;

  const { manager, folderPrefix, conn } = vault;
  const secret = getDefaultWorkspaceSecret(userId, ctx.workspace.id);
  const rawBytes = manager.exportBinary();
  const encrypted = encryptVaultBuffer(rawBytes, secret);

  if (conn && conn.provider !== 'local_fs') {
    await ensureCloudDirectoryMarker(conn, folderPrefix);
    await writeCloudWorkspaceFile(conn, folderPrefix, '.srkl/workspace.db.enc', encrypted);
    const verified = await readCloudWorkspaceFile(conn, folderPrefix, '.srkl/workspace.db.enc');
    if (!verified || !decryptVaultBuffer(verified, secret).equals(rawBytes)) throw new Error('Cloud vault write verification failed');
    const manifest = { version: 1, appName: 'srkl', workspaceName: ctx.workspace.name, folderPrefix, encryptedDatabase: '.srkl/workspace.db.enc', cipher: 'aes-256-gcm', updatedAt: new Date().toISOString() };
    await writeCloudWorkspaceFile(conn, folderPrefix, 'manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
    await writeCloudWorkspaceFile(conn, folderPrefix, 'logs/_srkl_system/.keep', '', 'text/plain');
  } else {
    const dir = path.resolve(process.cwd(), folderPrefix, '.srkl');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'workspace.db.enc'), encrypted);
  }

  manager.isDirty = false;
  const nowIso = new Date().toISOString();
  ctx.workspace.vaultUpdatedAt = nowIso;
  ctx.workspace.updatedAt = nowIso;
  vault.vaultUpdatedAt = nowIso;
  vault.cachedAt = Date.now();

  try {
    await query(`
      UPDATE "srkl_application_profiles"
      SET app_profiles = jsonb_set(
        COALESCE(app_profiles, '{}'::jsonb), '{srkl,workspaces}',
        (SELECT COALESCE(jsonb_agg(
          CASE WHEN elem->>'id' = $2
          THEN jsonb_set(jsonb_set(elem, '{updatedAt}', to_jsonb($3::text)), '{vaultUpdatedAt}', to_jsonb($3::text))
          ELSE elem END
        ), '[]'::jsonb) FROM jsonb_array_elements(COALESCE(app_profiles->'srkl'->'workspaces', '[]'::jsonb)) AS elem)
      ), updated_at = NOW() WHERE id = $1
    `, [userId, ctx.workspace.id, nowIso]);
  } catch (err: any) { console.warn('[VaultFlush] DB timestamp sync warning:', err.message); }
  return true;
}

export async function flushWorkspaceVault(userId: string, targetWsId?: string, force = false): Promise<boolean> {
  const ctx = await getUserWorkspaceContext(userId, targetWsId);
  if (!ctx) return false;
  const cacheKey = `${userId}:${ctx.workspace.id}`;
  const currentFlush = flushQueues.get(cacheKey) || Promise.resolve(true);
  const nextFlush = currentFlush.catch(() => true).then(() => executeVaultFlush(userId, targetWsId, ctx, cacheKey, force));

  flushQueues.set(cacheKey, nextFlush);
  try { return await nextFlush; }
  finally { if (flushQueues.get(cacheKey) === nextFlush) flushQueues.delete(cacheKey); }
}

export async function clearVaultCache(userId: string, workspaceId?: string): Promise<void> {
  for (const key of Array.from(activeVaults.keys())) {
    if (key.startsWith(`${userId}:`) && (!workspaceId || key === `${userId}:${workspaceId}`)) {
      const v = activeVaults.get(key);
      try { v?.manager.close(); } catch {}
      activeVaults.delete(key);
      flushQueues.delete(key);
    }
  }
}
