/**
 * @file workspaceFileCore.ts
 * @description Fetch-compatible workspace file IO for B2, Google Drive, and local storage.
 * This portable module has no Node imports. Local filesystem behavior is
 * supplied only by the explicitly Node-specific entrypoint adapter.
 */

import { b2UploadFile, b2DownloadFile, b2ListFileNames, b2DeleteFileVersion, b2DeleteFolder } from './b2DirectCore.js';
import { createGoogleDriveWorkspaceClient } from './storageConnectionCore.js';
import { queryUnifiedDb } from './unifiedDb.js';

/**
 * Local filesystem adapter injection. The portable module has no Node imports;
 * the explicit /backend/node entrypoint installs the Node implementation.
 */
export interface LocalWorkspaceFileAdapter {
  write(path: string, content: Uint8Array): Promise<void>;
  read(path: string): Promise<Uint8Array | null>;
  delete(path: string): Promise<boolean>;
  list(path: string): Promise<Array<{ fileName: string; sizeBytes: number }>>;
  deleteFolder(path: string): Promise<void>;
}

let localWorkspaceFileAdapter: LocalWorkspaceFileAdapter | null = null;

export function configureLocalWorkspaceFileAdapter(
  adapter: LocalWorkspaceFileAdapter | null,
): void {
  localWorkspaceFileAdapter = adapter;
}

export function normalizeWorkspaceStoragePath(value: string, allowEmpty = false): string {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized && allowEmpty) return '';
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:(?:$|\/)/.test(normalized) || normalized.includes('\0')) {
    throw new Error('Storage path must be a safe workspace-relative path.');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Storage path must not contain empty, current-directory, or parent-directory segments.');
  }
  return segments.join('/');
}

export function getWorkspaceFolderPrefix(workspace: any): string {
  const raw = workspace?.localFolderKey
    || workspace?.localFolderName
    || (workspace?.workspacePath ? workspace.workspacePath.replace(/^\.\//, '') : workspace?.id);
  return normalizeWorkspaceStoragePath(String(raw || ''));
}

function getWorkspaceFilePath(workspace: any, relativePath: string): string {
  return `${getWorkspaceFolderPrefix(workspace)}/${normalizeWorkspaceStoragePath(relativePath)}`;
}
export function isB2Workspace(workspace: any, connection: any): boolean {
  return connection?.provider === 'backblaze_b2'
    || connection?.provider === 'BACKBLAZE_B2'
    || workspace?.storageProvider === 'backblaze_b2';
}

export function isGoogleDriveWorkspace(workspace: any, connection: any): boolean {
  return connection?.provider === 'google_drive'
    || workspace?.storageProvider === 'google_drive';
}

async function getGoogleDriveClient(
  workspace: any,
  connection: any,
  env?: Record<string, unknown>,
) {
  const userId = String(connection?.__ownerUserId || workspace?.__ownerUserId || '').trim();
  const connectionId = String(connection?.id || workspace?.storageConnectionId || '').trim();
  if (!userId || !connectionId) {
    throw new Error('Google Drive workspace operations require an owned storage connection reference.');
  }
  return createGoogleDriveWorkspaceClient(
    userId,
    connectionId,
    (sql, params) => queryUnifiedDb(sql, params, env),
    workspace?.googleRootFolderId || connection?.googleRootFolderId || 'root',
  );
}

function getB2Settings(workspace: any, connection: any): {
  keyId: string;
  applicationKey: string;
  bucketName: string;
} {
  const keyId = String(connection?.b2KeyId || connection?.keyId || connection?.accessKeyId || '').trim();
  const applicationKey = String(
    connection?.b2ApplicationKey
    || connection?.applicationKey
    || connection?.appKey
    || connection?.secretAccessKey
    || '',
  ).trim();
  const bucketName = String(connection?.b2BucketName || connection?.bucketName || workspace?.b2BucketName || '').trim();
  if (!keyId || !applicationKey || !bucketName) {
    throw new Error('The Backblaze workspace connection is missing its server-side credentials or bucket.');
  }
  return { keyId, applicationKey, bucketName };
}

export async function writeWorkspaceFile(
  workspace: any,
  connection: any,
  relativePath: string,
  content: string | Uint8Array,
  contentType = 'application/json',
  env?: Record<string, unknown>,
): Promise<void> {
  const targetPath = getWorkspaceFilePath(workspace, relativePath);
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;

  if (isGoogleDriveWorkspace(workspace, connection)) {
    const drive = await getGoogleDriveClient(workspace, connection, env);
    await drive.write(targetPath, bytes, contentType);
    return;
  }

  if (isB2Workspace(workspace, connection)) {
    const config = getB2Settings(workspace, connection);
    await b2UploadFile(
      config.keyId,
      config.applicationKey,
      config.bucketName,
      targetPath,
      bytes,
      contentType,
    );
    return;
  }

  if (!localWorkspaceFileAdapter) throw new Error('Local filesystem operations require the explicit Kloks Node backend adapter.');
  await localWorkspaceFileAdapter.write(targetPath, bytes);
}

export async function readWorkspaceFile(
  workspace: any,
  connection: any,
  relativePath: string,
  env?: Record<string, unknown>,
): Promise<Uint8Array | null> {
  const targetPath = getWorkspaceFilePath(workspace, relativePath);

  if (isGoogleDriveWorkspace(workspace, connection)) {
    const drive = await getGoogleDriveClient(workspace, connection, env);
    try {
      return await drive.read(targetPath);
    } catch (error) {
      if (error instanceof Error && /not found|HTTP 404/i.test(error.message)) return null;
      throw error;
    }
  }

  if (isB2Workspace(workspace, connection)) {
    const config = getB2Settings(workspace, connection);
    return b2DownloadFile(config.keyId, config.applicationKey, config.bucketName, targetPath);
  }

  if (!localWorkspaceFileAdapter) return null;
  return localWorkspaceFileAdapter.read(targetPath);
}

export async function deleteWorkspaceFile(
  workspace: any,
  connection: any,
  relativePath: string,
  env?: Record<string, unknown>,
): Promise<boolean> {
  const targetPath = getWorkspaceFilePath(workspace, relativePath);

  if (isGoogleDriveWorkspace(workspace, connection)) {
    const drive = await getGoogleDriveClient(workspace, connection, env);
    await drive.delete(targetPath);
    return true;
  }

  if (isB2Workspace(workspace, connection)) {
    const config = getB2Settings(workspace, connection);
    const fullKey = targetPath;
    const files = await b2ListFileNames(config.keyId, config.applicationKey, config.bucketName, fullKey);
    const match = files.find((file: any) => file.fileName === fullKey);
    if (!match) return false;
    await b2DeleteFileVersion(config.keyId, config.applicationKey, match.fileName, match.fileId);
    return true;
  }

  if (!localWorkspaceFileAdapter) return false;
  return localWorkspaceFileAdapter.delete(targetPath);
}

export async function listWorkspaceFiles(
  workspace: any,
  connection: any,
  subPrefix = '',
  env?: Record<string, unknown>,
): Promise<Array<{ fileName: string; sizeBytes: number; uploadTimestamp?: number }>> {
  const folderPrefix = getWorkspaceFolderPrefix(workspace);
  const cleanSubPrefix = normalizeWorkspaceStoragePath(subPrefix, true);
  const targetPrefix = cleanSubPrefix ? `${folderPrefix}/${cleanSubPrefix}` : folderPrefix;

  if (isGoogleDriveWorkspace(workspace, connection)) {
    const drive = await getGoogleDriveClient(workspace, connection, env);
    const files = await drive.list(targetPrefix);
    return files.map((file) => ({
      fileName: file.path.startsWith(folderPrefix + '/')
        ? file.path.slice(folderPrefix.length + 1)
        : file.path,
      sizeBytes: file.size,
      uploadTimestamp: file.modifiedAt,
    }));
  }

  if (isB2Workspace(workspace, connection)) {
    const config = getB2Settings(workspace, connection);
    const b2TargetPrefix = cleanSubPrefix ? `${targetPrefix}/` : `${folderPrefix}/`;
    const files = await b2ListFileNames(config.keyId, config.applicationKey, config.bucketName, b2TargetPrefix);
    return files.map((file: any) => ({
      fileName: String(file.fileName || '').slice(folderPrefix.length + 1),
      sizeBytes: Number(file.contentLength || 0),
      uploadTimestamp: file.uploadTimestamp,
    }));
  }

  if (!localWorkspaceFileAdapter) return [];
  const files = await localWorkspaceFileAdapter.list(targetPrefix);
  return files.map((file) => ({
    ...file,
    fileName: file.fileName.startsWith(`${folderPrefix}/`)
      ? file.fileName.slice(folderPrefix.length + 1)
      : file.fileName,
  }));
}

export async function deleteWorkspaceFolder(
  workspace: any,
  connection: any,
  env?: Record<string, unknown>,
): Promise<void> {
  const folderPrefix = getWorkspaceFolderPrefix(workspace);

  if (isGoogleDriveWorkspace(workspace, connection)) {
    // Delete only the application-created child directory. The user-selected
    // Drive root folder and its unrelated contents are never removed.
    const drive = await getGoogleDriveClient(workspace, connection, env);
    const removeTree = async (relativePath: string): Promise<void> => {
      let entries: Array<{ path: string; isFolder?: boolean }> = [];
      try {
        entries = await drive.list(relativePath);
      } catch (error) {
        if (error instanceof Error && /not found|HTTP 404/i.test(error.message)) return;
        throw error;
      }
      for (const entry of entries) {
        if (entry.isFolder) await removeTree(entry.path);
        else await drive.delete(entry.path);
      }
      if (relativePath) await drive.delete(relativePath);
    };
    await removeTree(folderPrefix);
    return;
  }

  if (isB2Workspace(workspace, connection)) {
    const config = getB2Settings(workspace, connection);
    await b2DeleteFolder(config.keyId, config.applicationKey, config.bucketName, folderPrefix);
    return;
  }

  if (localWorkspaceFileAdapter) await localWorkspaceFileAdapter.deleteFolder(folderPrefix);
}
