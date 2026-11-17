/**
 * @file workspaceSyncEngine.ts
 * @description Bidirectional Timestamp-Aware Workspace Synchronization Engine for Qwnsr.
 * Synchronizes the active Local-Working Workspace (default: ./workspace)
 * with the primary Persistence Target (Remote Backblaze B2 Bucket or Local Non-Working Workspace).
 * Enforces ULTRST canonical naming: ultrst_qwnsr_<username>_<workspacename>
 */

import fs from 'fs';
import path from 'path';
import { formatCanonicalWorkspaceFolderName } from './workspaceCanonical';
import { b2ListFileNames, b2DownloadFile, b2UploadFile, b2ListBuckets } from './b2DirectCore';
import { queryUnifiedDb } from './unifiedDb';
import { GoogleDriveStorageService } from '../storage/GoogleDriveStorageService.js';

const ACCOUNTS_FILE = path.resolve('.skipo/accounts.json');
const CONFIG_FILE = path.resolve('.skipo/workspace_config.json');

export interface WorkingWorkspaceConfig {
  workingDirectory: string;
  autoSyncIntervalMinutes: number;
}

export function getDefaultWorkingWorkspaceDir(): string {
  // Ephemeral /tmp fallback in serverless environments
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'workspace');
  }
  return path.join(process.cwd(), 'workspace');
}

export function getWorkingWorkspaceConfig(): WorkingWorkspaceConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.workingDirectory) {
        return {
          workingDirectory: parsed.workingDirectory,
          autoSyncIntervalMinutes: parsed.autoSyncIntervalMinutes || 5,
        };
      }
    }
  } catch {}
  return {
    workingDirectory: getDefaultWorkingWorkspaceDir(),
    autoSyncIntervalMinutes: 5,
  };
}

export function setWorkingWorkspaceConfig(cfg: Partial<WorkingWorkspaceConfig>): WorkingWorkspaceConfig {
  const current = getWorkingWorkspaceConfig();
  const updated: WorkingWorkspaceConfig = {
    workingDirectory: (cfg.workingDirectory || current.workingDirectory).trim(),
    autoSyncIntervalMinutes: cfg.autoSyncIntervalMinutes || current.autoSyncIntervalMinutes,
  };
  try {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WorkspaceSync] Failed to persist working config:', err);
  }
  return updated;
}

export function getWorkingWorkspaceDir(workspaceId = 'default'): string {
  const root = getWorkingWorkspaceConfig().workingDirectory;
  const safeId = workspaceId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const dir = path.join(root, safeId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function findWorkspaceRecord(workspaceId: string): Promise<{ user: any; workspace: any; connection: any } | null> {
  // 1. Try local .skipo/accounts.json
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      const accounts = JSON.parse(raw);
      for (const u of Object.values<any>(accounts)) {
        if (Array.isArray(u.workspaces)) {
          const ws = u.workspaces.find((w: any) => w.id === workspaceId);
          if (ws) {
            const conns = Array.isArray(u.storage_connections) ? u.storage_connections : [];
            const conn = conns.find((c: any) => c.id === ws.storageConnectionId) || conns[0] || null;
            return { user: u, workspace: ws, connection: conn };
          }
        }
      }
    }
  } catch {}

  // 2. Try Unified Database "ultrst-users"
  try {
    const res = await queryUnifiedDb(`SELECT id, email, username, app_profiles FROM "ultrst-users"`);
    for (const u of res.rows) {
      const profiles = typeof u.app_profiles === 'string' ? JSON.parse(u.app_profiles) : (u.app_profiles || {});
      const qwnsr = profiles.qwnsr || {};
      const workspaces = Array.isArray(qwnsr.workspaces) ? qwnsr.workspaces : [];
      const ws = workspaces.find((w: any) => w.id === workspaceId);
      if (ws) {
        const conns = qwnsr.storage_connections || profiles.srkl?.storage_connections || [];
        const conn = conns.find((c: any) => c.id === ws.storageConnectionId) || conns[0] || null;
        return { user: u, workspace: ws, connection: conn };
      }
    }
  } catch {}

  return null;
}

export function getWorkspaceFolderKey(workspace: any, user?: any): string {
  if (workspace.localFolderKey) return workspace.localFolderKey;
  if (workspace.localFolderName && workspace.localFolderName.startsWith('ultrst_')) return workspace.localFolderName;
  const userName = user?.username || user?.name || (user?.email ? user.email.split('@')[0] : 'user');
  return formatCanonicalWorkspaceFolderName('qwnsr', userName, workspace.name);
}

export interface SyncFileResult {
  fileName: string;
  action: 'DOWNLOADED' | 'UPLOADED' | 'UP_TO_DATE' | 'SKIPPED';
  sizeBytes?: number;
}

export interface WorkspaceSyncSummary {
  success: boolean;
  workspaceId: string;
  folderKey: string;
  workingDir: string;
  persistenceType: 'backblaze_b2' | 'local_fs' | 'google_drive';
  targetLocation: string;
  syncedFiles: SyncFileResult[];
  uploadedCount: number;
  downloadedCount: number;
  syncedAt: string;
  error?: string;
}

async function collectLocalFiles(dir: string, baseDir: string = dir): Promise<Array<{ relPath: string; fullPath: string; mtimeMs: number; sizeBytes: number }>> {
  if (!fs.existsSync(dir)) return [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const results: Array<{ relPath: string; fullPath: string; mtimeMs: number; sizeBytes: number }> = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.bzEmpty') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectLocalFiles(full, baseDir);
      results.push(...nested);
    } else if (entry.isFile()) {
      const st = await fs.promises.stat(full);
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      results.push({ relPath: rel, fullPath: full, mtimeMs: st.mtimeMs, sizeBytes: st.size });
    }
  }
  return results;
}

export async function syncWorkspace(workspaceId: string): Promise<WorkspaceSyncSummary> {
  const match = await findWorkspaceRecord(workspaceId);
  const nowIso = new Date().toISOString();

  if (!match) {
    return {
      success: false,
      workspaceId,
      folderKey: workspaceId,
      workingDir: getWorkingWorkspaceDir(),
      persistenceType: 'local_fs',
      targetLocation: 'Unknown',
      syncedFiles: [],
      uploadedCount: 0,
      downloadedCount: 0,
      syncedAt: nowIso,
      error: `Workspace '${workspaceId}' not found.`,
    };
  }

  const { workspace, user, connection } = match;
  const folderKey = getWorkspaceFolderKey(workspace, user);
  const workingDir = getWorkingWorkspaceDir(workspaceId);
  const isB2 = workspace.storageProvider === 'backblaze_b2' || workspace.storageConfig?.type === 'b2';

  const syncedFiles: SyncFileResult[] = [];
  let uploadedCount = 0;
  let downloadedCount = 0;

  if (isB2) {
    const creds = workspace.storageConfig || connection?.credentials || connection || {};
    const keyId = creds.keyId || creds.b2KeyId;
    const appKey = creds.applicationKey || creds.b2ApplicationKey || creds.appKey;
    const bucketName = creds.bucketName || creds.b2BucketName || workspace.b2BucketName || 'ultrst-apps';

    if (!keyId || !appKey) {
      return {
        success: false,
        workspaceId,
        folderKey,
        workingDir,
        persistenceType: 'backblaze_b2',
        targetLocation: bucketName,
        syncedFiles: [],
        uploadedCount: 0,
        downloadedCount: 0,
        syncedAt: nowIso,
        error: 'Missing Backblaze B2 credentials for sync.',
      };
    }

    try {
      const b2Prefix = `${folderKey}/`;
      const remoteFiles = await b2ListFileNames(keyId, appKey, bucketName, b2Prefix);
      const remoteMap = new Map<string, { fileId: string; size: number; timestamp: number }>();
      for (const rf of remoteFiles) {
        const cleanName = rf.fileName.slice(b2Prefix.length);
        if (cleanName) remoteMap.set(cleanName, { fileId: rf.fileId, size: rf.contentLength, timestamp: rf.uploadTimestamp });
      }

      const localFiles = await collectLocalFiles(workingDir);
      const localMap = new Map<string, { fullPath: string; mtimeMs: number; sizeBytes: number }>();
      for (const lf of localFiles) {
        localMap.set(lf.relPath, lf);
      }

      // 1. Download missing or newer remote files to working directory
      for (const [relPath, rInfo] of remoteMap.entries()) {
        const lFile = localMap.get(relPath);
        const shouldDownload = !lFile || rInfo.timestamp > lFile.mtimeMs + 2000;

        if (shouldDownload) {
          const buf = await b2DownloadFile(keyId, appKey, bucketName, `${b2Prefix}${relPath}`);
          if (buf) {
            const destPath = path.join(workingDir, relPath);
            await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
            await fs.promises.writeFile(destPath, buf);
            // Sync modification time
            try {
              const fileTime = new Date(rInfo.timestamp);
              await fs.promises.utimes(destPath, fileTime, fileTime);
            } catch {}
            syncedFiles.push({ fileName: relPath, action: 'DOWNLOADED', sizeBytes: buf.byteLength });
            downloadedCount++;
          }
        }
      }

      // 2. Upload missing or newer local files to B2 bucket
      for (const [relPath, lFile] of localMap.entries()) {
        const rInfo = remoteMap.get(relPath);
        const shouldUpload = !rInfo || lFile.mtimeMs > rInfo.timestamp + 2000;

        if (shouldUpload) {
          const content = await fs.promises.readFile(lFile.fullPath);
          await b2UploadFile(keyId, appKey, bucketName, `${b2Prefix}${relPath}`, new Uint8Array(content));
          syncedFiles.push({ fileName: relPath, action: 'UPLOADED', sizeBytes: lFile.sizeBytes });
          uploadedCount++;
        } else if (!syncedFiles.some((f) => f.fileName === relPath)) {
          syncedFiles.push({ fileName: relPath, action: 'UP_TO_DATE', sizeBytes: lFile.sizeBytes });
        }
      }

      return {
        success: true,
        workspaceId,
        folderKey,
        workingDir,
        persistenceType: 'backblaze_b2',
        targetLocation: `B2://${bucketName}/${folderKey}/`,
        syncedFiles,
        uploadedCount,
        downloadedCount,
        syncedAt: nowIso,
      };
    } catch (err: any) {
      return {
        success: false,
        workspaceId,
        folderKey,
        workingDir,
        persistenceType: 'backblaze_b2',
        targetLocation: bucketName,
        syncedFiles,
        uploadedCount,
        downloadedCount,
        syncedAt: nowIso,
        error: err.message || 'Backblaze sync failed.',
      };
    }
  }

  const isGoogleDrive = workspace.storageProvider === 'google_drive' || workspace.storageConfig?.type === 'google_drive';
  if (isGoogleDrive) {
    const creds = workspace.storageConfig || connection?.credentials || connection || {};
    const rootFolderId = creds.googleRootFolderId || creds.rootFolderId || workspace.googleRootFolderId;
    const adapter = new GoogleDriveStorageService({
      provider: 'google_drive',
      googleAccessToken: creds.googleAccessToken || creds.accessToken,
      googleAccessTokenExpiresAt: creds.googleAccessTokenExpiresAt,
      googleRefreshToken: creds.googleRefreshToken || creds.refreshToken,
      googleClientId: creds.googleClientId || process.env.GOOGLE_CLIENT_ID,
      googleRedirectUri: creds.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI,
      googleAccountId: creds.googleAccountId,
      googleRootFolderId: rootFolderId,
    }, {
      // OAuth secrets remain in server environment, never in workspace connection records.
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });

    try {
      const remoteFiles = await adapter.list('');
      const remoteMap = new Map<string, { size: number; timestamp: number }>();
      for (const rf of remoteFiles) {
        if (rf.path) remoteMap.set(rf.path, { size: rf.size, timestamp: rf.modifiedAt });
      }

      const localFiles = await collectLocalFiles(workingDir);
      const localMap = new Map<string, { fullPath: string; mtimeMs: number; sizeBytes: number }>();
      for (const lf of localFiles) {
        localMap.set(lf.relPath, lf);
      }

      // 1. Download missing or newer remote files
      for (const [relPath, rInfo] of remoteMap.entries()) {
        const lFile = localMap.get(relPath);
        const shouldDownload = !lFile || rInfo.timestamp > lFile.mtimeMs + 2000;
        if (shouldDownload) {
          const buf = await adapter.read(relPath);
          const destPath = path.join(workingDir, relPath);
          await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
          await fs.promises.writeFile(destPath, buf);
          try {
            const fileTime = new Date(rInfo.timestamp);
            await fs.promises.utimes(destPath, fileTime, fileTime);
          } catch {}
          syncedFiles.push({ fileName: relPath, action: 'DOWNLOADED', sizeBytes: buf.byteLength });
          downloadedCount++;
        }
      }

      // 2. Upload missing or newer local files
      for (const [relPath, lFile] of localMap.entries()) {
        const rInfo = remoteMap.get(relPath);
        const shouldUpload = !rInfo || lFile.mtimeMs > rInfo.timestamp + 2000;
        if (shouldUpload) {
          const content = await fs.promises.readFile(lFile.fullPath);
          await adapter.write(relPath, new Uint8Array(content));
          syncedFiles.push({ fileName: relPath, action: 'UPLOADED', sizeBytes: lFile.sizeBytes });
          uploadedCount++;
        } else if (!syncedFiles.some((f) => f.fileName === relPath)) {
          syncedFiles.push({ fileName: relPath, action: 'UP_TO_DATE', sizeBytes: lFile.sizeBytes });
        }
      }

      return {
        success: true,
        workspaceId,
        folderKey,
        workingDir,
        persistenceType: 'google_drive',
        targetLocation: `GoogleDrive://${rootFolderId || 'root'}`,
        syncedFiles,
        uploadedCount,
        downloadedCount,
        syncedAt: nowIso,
      };
    } catch (err: any) {
      return {
        success: false,
        workspaceId,
        folderKey,
        workingDir,
        persistenceType: 'google_drive',
        targetLocation: `GoogleDrive://${rootFolderId || 'root'}`,
        syncedFiles,
        uploadedCount,
        downloadedCount,
        syncedAt: nowIso,
        error: err.message || 'Google Drive sync failed.',
      };
    }
  }

  // Local Non-Working Workspace Parity Vault
  const vaultDir = path.resolve(process.cwd(), folderKey);
  await fs.promises.mkdir(vaultDir, { recursive: true });

  try {
    const vaultFiles = await collectLocalFiles(vaultDir);
    const vaultMap = new Map(vaultFiles.map((f) => [f.relPath, f]));

    const workingFiles = await collectLocalFiles(workingDir);
    const workingMap = new Map(workingFiles.map((f) => [f.relPath, f]));

    // 1. Copy missing or newer vault files to working directory
    for (const [relPath, vFile] of vaultMap.entries()) {
      const wFile = workingMap.get(relPath);
      const shouldDownload = !wFile || vFile.mtimeMs > wFile.mtimeMs + 1000;

      if (shouldDownload) {
        const dest = path.join(workingDir, relPath);
        await fs.promises.mkdir(path.dirname(dest), { recursive: true });
        await fs.promises.copyFile(vFile.fullPath, dest);
        try {
          const vTime = new Date(vFile.mtimeMs);
          await fs.promises.utimes(dest, vTime, vTime);
        } catch {}
        syncedFiles.push({ fileName: relPath, action: 'DOWNLOADED', sizeBytes: vFile.sizeBytes });
        downloadedCount++;
      }
    }

    // 2. Copy missing or newer working files to vault directory
    for (const [relPath, wFile] of workingMap.entries()) {
      const vFile = vaultMap.get(relPath);
      const shouldUpload = !vFile || wFile.mtimeMs > vFile.mtimeMs + 1000;

      if (shouldUpload) {
        const dest = path.join(vaultDir, relPath);
        await fs.promises.mkdir(path.dirname(dest), { recursive: true });
        await fs.promises.copyFile(wFile.fullPath, dest);
        try {
          const wTime = new Date(wFile.mtimeMs);
          await fs.promises.utimes(dest, wTime, wTime);
        } catch {}
        syncedFiles.push({ fileName: relPath, action: 'UPLOADED', sizeBytes: wFile.sizeBytes });
        uploadedCount++;
      } else if (!syncedFiles.some((f) => f.fileName === relPath)) {
        syncedFiles.push({ fileName: relPath, action: 'UP_TO_DATE', sizeBytes: wFile.sizeBytes });
      }
    }

    return {
      success: true,
      workspaceId,
      folderKey,
      workingDir,
      persistenceType: 'local_fs',
      targetLocation: vaultDir,
      syncedFiles,
      uploadedCount,
      downloadedCount,
      syncedAt: nowIso,
    };
  } catch (err: any) {
    return {
      success: false,
      workspaceId,
      folderKey,
      workingDir,
      persistenceType: 'local_fs',
      targetLocation: vaultDir,
      syncedFiles,
      uploadedCount,
      downloadedCount,
      syncedAt: nowIso,
      error: err.message,
    };
  }
}
