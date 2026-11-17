/**
 * @file workspaceBackupController.ts
 * @description Workspace Backup, JSON Export/Import Cloning, and Deletion Controller.
 * Adheres strictly to Skipo governance (< 200 lines).
 */

import { query } from '../db';
import { addAuditLog } from '../audit';
import { clearVaultCache, getWorkspaceVault, flushWorkspaceVault } from './workspaceVaultCoordinator';
import { SrklWorkspace } from '@/libraries/types/auth';
import { deleteCloudWorkspacePrefix } from './cloudStorageService';
import { extractCanonicalFolderPrefix } from './workspaceCanonical';
import { getStorageConnections } from './workspaceStorageController';

export interface WorkspaceExportBundle {
  version: 1;
  app: 'srkl';
  exportedAt: string;
  workspace: SrklWorkspace;
  serviceAccounts: any[];
  customDefinitions: any[];
}

export async function exportWorkspaceData(userId: string, workspaceId: string): Promise<WorkspaceExportBundle | null> {
  const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return null;
  const user = userRes.rows[0];
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  const srkl = appProfiles.srkl || {};
  const workspaces: SrklWorkspace[] = srkl.workspaces || [];
  const ws = workspaces.find((w) => w.id === workspaceId);
  if (!ws) return null;

  const { manager } = await getWorkspaceVault(userId, workspaceId);
  const serviceAccounts = manager.getServiceAccounts();
  const customDefinitions = manager.getCustomDefinitions();

  await addAuditLog('WORKSPACE_EXPORTED', userId, `Exported workspace ${ws.name} (${ws.id})`, 'workspace');

  return {
    version: 1,
    app: 'srkl',
    exportedAt: new Date().toISOString(),
    workspace: ws,
    serviceAccounts,
    customDefinitions,
  };
}

export async function applyImportedWorkspaceData(
  userId: string,
  workspaceId: string,
  importData: { serviceAccounts?: any[]; customDefinitions?: any[] }
): Promise<{ importedAccounts: number; importedDefinitions: number }> {
  const { manager } = await getWorkspaceVault(userId, workspaceId);
  let importedAccounts = 0;
  let importedDefinitions = 0;

  if (Array.isArray(importData.serviceAccounts)) {
    for (const acc of importData.serviceAccounts) {
      if (acc && (acc.serviceId || acc.id)) {
        manager.upsertServiceAccount(acc);
        importedAccounts++;
      }
    }
  }

  if (Array.isArray(importData.customDefinitions)) {
    for (const def of importData.customDefinitions) {
      if (def && (def.identifier || def.id)) {
        manager.upsertCustomDefinition(def);
        importedDefinitions++;
      }
    }
  }

  await flushWorkspaceVault(userId, workspaceId, true);
  await addAuditLog(
    'WORKSPACE_IMPORTED',
    userId,
    `Imported ${importedAccounts} accounts & ${importedDefinitions} definitions into ${workspaceId}`,
    'workspace'
  );

  return { importedAccounts, importedDefinitions };
}

export async function deleteWorkspaceRecord(
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; workspaces: SrklWorkspace[]; activeWorkspaceId: string } | null> {
  const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return null;
  const user = userRes.rows[0];
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  if (!appProfiles.srkl) appProfiles.srkl = {};

  const workspaces: SrklWorkspace[] = appProfiles.srkl.workspaces || [];
  const targetIndex = workspaces.findIndex((w) => w.id === workspaceId);
  if (targetIndex === -1) return null;

  const targetWs = workspaces[targetIndex];
  const remainingWorkspaces = workspaces.filter((w) => w.id !== workspaceId);
  appProfiles.srkl.workspaces = remainingWorkspaces;

  if (appProfiles.srkl.activeWorkspaceId === workspaceId) {
    appProfiles.srkl.activeWorkspaceId = remainingWorkspaces[0]?.id || '';
  }

  // Workspace metadata and its remote vault must be deleted together. Leaving
  // the prefix behind causes orphaned Backblaze workspace data to accumulate.
  if (targetWs.storageProvider !== 'local_fs' && targetWs.storageConnectionId) {
    const connections = await getStorageConnections(userId);
    const connection = connections.find((item) => item.id === targetWs.storageConnectionId);
    if (connection) {
      const userName = user.username || user.name || 'user';
      await deleteCloudWorkspacePrefix(connection, extractCanonicalFolderPrefix(targetWs.workspacePath, userName, targetWs.name));
    }
  }
  await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [
    JSON.stringify(appProfiles),
    userId,
  ]);
  await clearVaultCache(userId, workspaceId);
  await addAuditLog('WORKSPACE_DELETED', userId, `Deleted workspace ${targetWs.name} (${workspaceId})`, 'workspace');

  return {
    success: true,
    workspaces: remainingWorkspaces,
    activeWorkspaceId: appProfiles.srkl.activeWorkspaceId,
  };
}

export async function updateWorkspaceRecord(
  userId: string,
  workspaceId: string,
  updates: { name?: string; storageConnectionId?: string | null; storageProvider?: string }
): Promise<{ success: boolean; workspace: SrklWorkspace } | null> {
  const userRes = await query('SELECT * FROM "srkl_application_profiles" WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return null;
  const user = userRes.rows[0];
  const appProfiles = typeof user.app_profiles === 'string' ? JSON.parse(user.app_profiles) : (user.app_profiles || {});
  if (!appProfiles.srkl) appProfiles.srkl = {};
  const workspaces: SrklWorkspace[] = appProfiles.srkl.workspaces || [];
  const targetIndex = workspaces.findIndex((w) => w.id === workspaceId);
  if (targetIndex === -1) return null;

  const current = workspaces[targetIndex];
  const updated: SrklWorkspace = {
    ...current,
    name: updates.name ? updates.name.trim() : current.name,
    storageConnectionId: updates.storageConnectionId !== undefined ? updates.storageConnectionId : current.storageConnectionId,
    storageProvider: (updates.storageProvider as any) || current.storageProvider,
    updatedAt: new Date().toISOString(),
  };
  workspaces[targetIndex] = updated;
  appProfiles.srkl.workspaces = workspaces;

  await query('UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(appProfiles), userId]);
  await addAuditLog('WORKSPACE_UPDATED', userId, `Updated workspace ${updated.name} (${workspaceId})`, 'workspace');
  return { success: true, workspace: updated };
}
