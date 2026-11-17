/**
 * @file workspaceBucketSyncCore.ts
 * @description Initialize and synchronize workspace metadata to the exact
 * user-owned storage connection associated with a workspace.
 */

import { resolveUserWorkspaceStorageAssociation } from './storageConnectionCore.js';
import { queryUnifiedDb } from './unifiedDb.js';
import { writeWorkspaceFile, deleteWorkspaceFolder } from './workspaceFileCore.js';

export function resolveWorkspaceConnection(profiles: any, workspace: any, appId = 'depm') {
  const collections: any[][] = [];
  const preferred = profiles?.[String(appId || 'depm').toLowerCase()]?.storage_connections;
  if (Array.isArray(preferred)) collections.push(preferred);

  for (const value of Object.values(profiles || {})) {
    if (value && typeof value === 'object' && Array.isArray((value as any).storage_connections)) {
      collections.push((value as any).storage_connections);
    }
  }

  const byId = new Map<string, any>();
  for (const connection of collections.flat()) {
    if (connection && typeof connection.id === 'string' && !byId.has(connection.id)) {
      byId.set(connection.id, connection);
    }
  }
  const connections = [...byId.values()];

  const connectionId = String(workspace?.storageConnectionId || '').trim();
  if (!connectionId) return null;
  const connection = connections.find((item) => item.id === connectionId) || null;
  if (!connection) return null;
  const provider = String(workspace?.storageProvider || '').toLowerCase();
  if (provider && String(connection.provider || '').toLowerCase() !== provider) return null;
  return connection;
}

function isPersistentCloudConnection(connection: any): boolean {
  return connection?.provider === 'backblaze_b2' || connection?.provider === 'google_drive';
}

function requireVerifiedWorkspaceOwner(workspace: any, connection: any): string {
  const connectionOwner = String(connection?.__ownerUserId || '').trim();
  const workspaceOwner = String(workspace?.__ownerUserId || '').trim();
  if (!connectionOwner) {
    throw new Error('Cloud workspace synchronization requires a connection resolved for a verified owner.');
  }
  if (workspaceOwner && connectionOwner !== workspaceOwner) {
    throw new Error('Cloud workspace synchronization owner does not match the persisted workspace owner.');
  }
  return connectionOwner;
}

async function assertPersistedWorkspaceAssociation(
  workspace: any,
  connection: any,
  env?: Record<string, unknown>,
): Promise<void> {
  const ownerId = requireVerifiedWorkspaceOwner(workspace, connection);
  const folderPrefix = String(
    workspace?.localFolderKey
    || workspace?.localFolderName
    || workspace?.workspacePath
    || '',
  ).replace(/^\.\//, '');
  const persisted = await resolveUserWorkspaceStorageAssociation(
    ownerId,
    String(connection.id),
    folderPrefix,
    (sql, params) => queryUnifiedDb(sql, params, env),
  );
  if (!persisted || String(persisted.id) !== String(workspace?.id)) {
    throw new Error('Cloud workspace synchronization requires the persisted workspace-to-connection association.');
  }
  if (String(persisted.storageProvider || '').toLowerCase() !== String(connection.provider || '').toLowerCase()) {
    throw new Error('Persisted workspace provider does not match the resolved storage connection.');
  }
  if (connection.provider === 'backblaze_b2') {
    const persistedBucket = String(persisted.b2BucketName || persisted.bucketName || '').trim();
    const selectedBucket = String(workspace.b2BucketName || connection.b2BucketName || connection.bucketName || '').trim();
    if (persistedBucket && selectedBucket && persistedBucket !== selectedBucket) {
      throw new Error('Persisted workspace B2 bucket does not match the synchronization target.');
    }
  }
  if (connection.provider === 'google_drive') {
    const persistedRoot = String(persisted.googleRootFolderId || connection.googleRootFolderId || '').trim();
    const selectedRoot = String(workspace.googleRootFolderId || connection.googleRootFolderId || '').trim();
    if (persistedRoot && selectedRoot && persistedRoot !== selectedRoot) {
      throw new Error('Persisted workspace Google Drive root does not match the synchronization target.');
    }
  }
}

export async function syncWorkspaceCreateToBucket(
  workspace: any,
  connection: any,
  env?: Record<string, unknown>,
): Promise<void> {
  const provider = String(connection?.provider || workspace?.storageProvider || '').toLowerCase();
  if (provider === 'local_fs') return;
  if (!isPersistentCloudConnection(connection) || workspace?.storageConnectionId !== connection?.id) {
    throw new Error('Workspace initialization requires its exact, verified persistent storage connection.');
  }
  await assertPersistedWorkspaceAssociation(workspace, connection, env);
  if (String(workspace?.storageProvider || '').toLowerCase() !== provider) {
    throw new Error('Workspace initialization storage provider does not match its saved connection.');
  }

  const metadata: Record<string, unknown> = {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    storageProvider: provider,
    storageConnectionId: connection.id,
    ...(provider === 'backblaze_b2' ? {
      bucket: connection.b2BucketName || connection.bucketName || workspace.b2BucketName,
    } : {
      rootFolderId: workspace.googleRootFolderId || connection.googleRootFolderId,
    }),
  };

  if (provider === 'backblaze_b2' && !metadata.bucket) {
    throw new Error('Backblaze B2 workspace initialization requires a selected bucket.');
  }
  if (provider === 'google_drive' && !metadata.rootFolderId) {
    throw new Error('Google Drive workspace initialization requires a selected root folder.');
  }

  await writeWorkspaceFile(workspace, connection, '.bzEmpty', new Uint8Array(0), 'application/x-empty', env);
  await writeWorkspaceFile(workspace, connection, 'workspace.json', JSON.stringify(metadata, null, 2), 'application/json', env);
  await writeWorkspaceFile(
    workspace,
    connection,
    'ecosystem.json',
    JSON.stringify({ apps: [], nodes: [], edges: [], ecosystems: [] }, null, 2),
    'application/json',
    env,
  );
}

export async function syncWorkspaceDeleteToBucket(
  workspace: any,
  connection: any,
  env?: Record<string, unknown>,
): Promise<void> {
  if (!isPersistentCloudConnection(connection)) return;
  if (!workspace?.storageConnectionId || workspace.storageConnectionId !== connection.id) {
    throw new Error('Workspace deletion requires its exact, owner-resolved storage connection.');
  }
  await assertPersistedWorkspaceAssociation(workspace, connection, env);
  if (String(workspace?.storageProvider || '').toLowerCase() !== String(connection.provider || '').toLowerCase()) {
    throw new Error('Workspace deletion storage provider does not match its saved connection.');
  }
  await deleteWorkspaceFolder(workspace, connection, env);
}

export async function syncWorkspaceDataToBucket(
  workspace: any,
  connection: any,
  data: any,
  env?: Record<string, unknown>,
): Promise<void> {
  if (!isPersistentCloudConnection(connection)) return;
  if (!workspace?.storageConnectionId || workspace.storageConnectionId !== connection.id) {
    throw new Error('Workspace data synchronization requires its exact, owner-resolved storage connection.');
  }
  await assertPersistedWorkspaceAssociation(workspace, connection, env);
  if (String(workspace?.storageProvider || '').toLowerCase() !== String(connection.provider || '').toLowerCase()) {
    throw new Error('Workspace data synchronization storage provider does not match its saved connection.');
  }
  await writeWorkspaceFile(
    workspace,
    connection,
    'ecosystem.json',
    JSON.stringify(data, null, 2),
    'application/json',
    env,
  );
}
