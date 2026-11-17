/**
 * @file workspaceCloneSyncCore.ts
 * @description Primary Storage Vault -> Secondary Storage Clones Replication Engine for Qwnsr.
 * Replicates active workspace data from Primary Vault to Redundant Clones (B2 or Local).
 * Conforms to Skipo Governance (< 200 lines).
 */

import fs from 'fs';
import path from 'path';
import { findWorkspaceRecord, getWorkspaceFolderKey, getWorkingWorkspaceDir } from './workspaceSyncEngine';
import { b2ListFileNames, b2DownloadFile, b2UploadFile } from './b2DirectCore';
import { queryUnifiedDb } from './unifiedDb';

const ACCOUNTS_FILE = path.resolve('.skipo/accounts.json');

export interface WorkspaceSecondaryClone {
  id: string;
  label: string;
  provider: 'backblaze_b2' | 'local_fs' | string;
  b2BucketName?: string;
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2Region?: string;
  b2Endpoint?: string;
  localFolderName?: string;
  localFolderKey?: string;
  createdAt: string;
  lastSyncedAt?: string;
  filesSynced?: number;
  status?: 'CONNECTED' | 'SYNCED' | 'ERROR';
}

export async function saveWorkspaceClonesState(userId: string, workspaceId: string, clones: WorkspaceSecondaryClone[], autoSync?: boolean) {
  try {
    const uRes = await queryUnifiedDb(`SELECT app_profiles FROM "ultrst-users" WHERE id = $1 LIMIT 1`, [userId]);
    if (uRes.rows.length > 0) {
      const p = typeof uRes.rows[0].app_profiles === 'string' ? JSON.parse(uRes.rows[0].app_profiles) : (uRes.rows[0].app_profiles || {});
      if (p.qwnsr?.workspaces) {
        const ws = p.qwnsr.workspaces.find((w: any) => w.id === workspaceId);
        if (ws) {
          ws.secondaryClones = clones;
          if (autoSync !== undefined) ws.autoSyncClones = autoSync;
          ws.updatedAt = Date.now();
          await queryUnifiedDb(`UPDATE "ultrst-users" SET app_profiles = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(p), userId]);
        }
      }
    }
  } catch (err: any) {
    console.warn('[workspaceCloneSyncCore] DB save warning:', err.message);
  }

  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const accounts = JSON.parse(await fs.promises.readFile(ACCOUNTS_FILE, 'utf-8'));
      for (const u of Object.values<any>(accounts)) {
        const ws = u.workspaces?.find((w: any) => w.id === workspaceId);
        if (ws) {
          ws.secondaryClones = clones;
          if (autoSync !== undefined) ws.autoSyncClones = autoSync;
          await fs.promises.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
          break;
        }
      }
    }
  } catch {}
}

export async function syncPrimaryToClones(
  workspaceId: string,
  targetCloneIds?: string[]
): Promise<{ success: boolean; workspaceId: string; syncedClones: any[]; totalFilesSynced: number; error?: string }> {
  const match = await findWorkspaceRecord(workspaceId);
  if (!match) return { success: false, workspaceId, syncedClones: [], totalFilesSynced: 0, error: 'Workspace not found' };

  const { workspace, user, connection } = match;
  const folderKey = getWorkspaceFolderKey(workspace, user);
  const clones: WorkspaceSecondaryClone[] = workspace.secondaryClones || [];

  const targetClones = clones.filter((c) => (!targetCloneIds || targetCloneIds.length === 0 || targetCloneIds.includes(c.id)));
  if (targetClones.length === 0) {
    return { success: true, workspaceId, syncedClones: [], totalFilesSynced: 0 };
  }

  // 1. Collect all Primary Files (from Local Working Dir / Local Vault or Primary B2)
  const filesToSync: Array<{ relPath: string; content: Uint8Array; contentType: string }> = [];
  const isPrimaryB2 = workspace.storageProvider === 'backblaze_b2' || workspace.storageConfig?.type === 'b2';

  if (isPrimaryB2) {
    const creds = workspace.storageConfig || connection?.credentials || connection || {};
    const keyId = creds.keyId || creds.b2KeyId;
    const appKey = creds.applicationKey || creds.b2ApplicationKey || creds.appKey;
    const bucket = creds.bucketName || creds.b2BucketName || workspace.b2BucketName || 'ultrst-apps';
    if (keyId && appKey) {
      const b2Prefix = `${folderKey}/`;
      const remoteList = await b2ListFileNames(keyId, appKey, bucket, b2Prefix);
      for (const rf of remoteList) {
        const rel = rf.fileName.slice(b2Prefix.length);
        if (!rel) continue;
        const data = await b2DownloadFile(keyId, appKey, bucket, rf.fileName);
        if (data) filesToSync.push({ relPath: rel, content: data, contentType: (rf as any).contentType || 'application/json' });
      }
    }
  }

  // Fallback to local working workspace files if primary B2 was empty or primary was local_fs
  if (filesToSync.length === 0) {
    const workingDir = getWorkingWorkspaceDir();
    if (fs.existsSync(workingDir)) {
      async function walk(d: string, base: string) {
        for (const entry of await fs.promises.readdir(d, { withFileTypes: true })) {
          if (entry.name.startsWith('.') && entry.name !== '.bzEmpty') continue;
          const full = path.join(d, entry.name);
          if (entry.isDirectory()) await walk(full, base);
          else if (entry.isFile()) {
            const rel = path.relative(base, full).replace(/\\/g, '/');
            const buf = await fs.promises.readFile(full);
            filesToSync.push({ relPath: rel, content: new Uint8Array(buf), contentType: 'application/json' });
          }
        }
      }
      await walk(workingDir, workingDir);
    }
  }

  // 2. Replicate filesToSync to each target Clone
  const results: any[] = [];
  let totalFiles = 0;
  const nowIso = new Date().toISOString();

  for (const clone of targetClones) {
    try {
      let count = 0;
      if (clone.provider === 'backblaze_b2' || clone.b2BucketName) {
        const keyId = clone.b2KeyId || (connection?.b2KeyId);
        const appKey = clone.b2ApplicationKey || (connection?.b2ApplicationKey);
        const bucket = clone.b2BucketName || 'ultrst-apps';
        if (!keyId || !appKey) throw new Error('Missing B2 credentials for clone');

        for (const f of filesToSync) {
          const fullKey = `${folderKey}/${f.relPath}`;
          await b2UploadFile(keyId, appKey, bucket, fullKey, f.content, f.contentType);
          count++;
        }
      } else {
        // Local directory clone
        const cloneBase = path.resolve(process.cwd(), clone.localFolderKey || clone.localFolderName || `${folderKey}_clone`);
        for (const f of filesToSync) {
          const dest = path.join(cloneBase, f.relPath);
          await fs.promises.mkdir(path.dirname(dest), { recursive: true });
          await fs.promises.writeFile(dest, f.content);
          count++;
        }
      }

      clone.lastSyncedAt = nowIso;
      clone.filesSynced = count;
      clone.status = 'SYNCED';
      results.push({ id: clone.id, label: clone.label, provider: clone.provider, filesSynced: count, status: 'SYNCED' });
      totalFiles += count;
    } catch (err: any) {
      console.warn(`[workspaceCloneSyncCore] Clone ${clone.label} sync error:`, err.message);
      clone.status = 'ERROR';
      results.push({ id: clone.id, label: clone.label, provider: clone.provider, filesSynced: 0, status: 'ERROR', error: err.message });
    }
  }

  await saveWorkspaceClonesState(user.id, workspaceId, clones);
  return { success: true, workspaceId, syncedClones: results, totalFilesSynced: totalFiles };
}

export async function addWorkspaceSecondaryClone(workspaceId: string, clone: Omit<WorkspaceSecondaryClone, 'id' | 'createdAt'>) {
  const match = await findWorkspaceRecord(workspaceId);
  if (!match) throw new Error('Workspace not found');
  const clones: WorkspaceSecondaryClone[] = match.workspace.secondaryClones || [];

  const newClone: WorkspaceSecondaryClone = {
    ...clone,
    id: `clone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: 'CONNECTED',
  };

  clones.push(newClone);
  await saveWorkspaceClonesState(match.user.id, workspaceId, clones);
  return { success: true, clone: newClone, clones };
}

export async function removeWorkspaceSecondaryClone(workspaceId: string, cloneId: string) {
  const match = await findWorkspaceRecord(workspaceId);
  if (!match) throw new Error('Workspace not found');
  const clones: WorkspaceSecondaryClone[] = (match.workspace.secondaryClones || []).filter((c) => c.id !== cloneId);
  await saveWorkspaceClonesState(match.user.id, workspaceId, clones);
  return { success: true, deletedId: cloneId, clones };
}
