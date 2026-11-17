/**
 * @file googleDriveStorageService.ts
 * @description Thin SRKL server adapter over the canonical Kloks Google Drive service.
 * System OAuth configuration and user token persistence are exclusively owned
 * by Kloks; this module only forwards operations with the verified owner ID.
 */

import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import type { UserStorageConnection } from '@/libraries/types/auth';

export interface GoogleDriveOAuthSettings {
  /** Retained as a compatibility input type; settings are resolved only by Kloks. */
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export interface GoogleDriveTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

export interface CanonicalGoogleDriveFolder {
  id: string;
  name: string;
  mimeType?: string;
  parentIds?: string[];
  modifiedAt?: number;
}

export interface CanonicalGoogleDriveFile {
  path: string;
  size: number;
  modifiedAt: number;
  isFolder?: boolean;
}

export interface CanonicalGoogleDriveStorageAdapter {
  getAccountIdentity(): Promise<{ accountId: string; email?: string }>;
  listFolders(parentFolderId?: string): Promise<CanonicalGoogleDriveFolder[]>;
  selectRootFolder(folderId: string): Promise<CanonicalGoogleDriveFolder>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; details?: Record<string, any>; error?: string }>;
  write(path: string, data: Uint8Array | string, contentType?: string): Promise<void>;
  read(path: string): Promise<Uint8Array>;
  delete(path: string): Promise<void>;
  list(path?: string): Promise<CanonicalGoogleDriveFile[]>;
  stat(path: string): Promise<CanonicalGoogleDriveFile>;
  mkdir(path: string): Promise<void>;
}

function ownerContext(connection: UserStorageConnection): { userId: string; connectionId: string } {
  const userId = String((connection as any).__ownerUserId || '').trim();
  const connectionId = String(connection.id || '').trim();
  if (!userId || !connectionId) {
    throw new Error('Google Drive storage operations require the verified owner and connection ID.');
  }
  if (connection.provider !== 'google_drive') throw new Error('A Google Drive storage connection is required.');
  return { userId, connectionId };
}

function serviceInput(connection: UserStorageConnection, extra: Record<string, unknown> = {}) {
  return { ...ownerContext(connection), ...extra, env: process.env as Record<string, unknown> };
}

/**
 * Compatibility adapter: every operation delegates to Kloks, so SRKL does not
 * instantiate a second provider, read system credentials, or store user tokens.
 */
export async function createGoogleDriveStorageAdapter(
  connection: UserStorageConnection,
  suppliedSettings?: GoogleDriveOAuthSettings,
  persistCredentials?: (tokens: GoogleDriveTokenSet) => Promise<void> | void,
): Promise<CanonicalGoogleDriveStorageAdapter> {
  // These legacy arguments are deliberately ignored. Google OAuth client
  // settings and token persistence are not application-configurable.
  void suppliedSettings;
  void persistCredentials;
  ownerContext(connection);

  return {
    getAccountIdentity: async () => StorageServiceFacade.execute(
      'getGoogleDriveAccountIdentity',
      serviceInput(connection),
    ) as Promise<{ accountId: string; email?: string }>,

    listFolders: async (parentFolderId) => StorageServiceFacade.execute(
      'listGoogleDriveFolders',
      serviceInput(connection, { parentFolderId }),
    ) as Promise<CanonicalGoogleDriveFolder[]>,

    selectRootFolder: async (folderId) => StorageServiceFacade.execute(
      'selectGoogleDriveRootFolder',
      serviceInput(connection, { folderId }),
    ) as Promise<CanonicalGoogleDriveFolder>,

    testConnection: async () => {
      const result = await StorageServiceFacade.execute(
        'testGoogleDriveConnection',
        serviceInput(connection),
      ) as { success: boolean; latencyMs: number; error?: string; email?: string };
      return {
        ok: result.success,
        latencyMs: result.latencyMs,
        ...(result.email ? { details: { email: result.email } } : {}),
        ...(result.error ? { error: result.error } : {}),
      };
    },

    write: async (path, data, contentType) => {
      await StorageServiceFacade.execute(
        'writeGoogleDriveFile',
        serviceInput(connection, { path, data, contentType }),
      );
    },

    read: async (path) => {
      const data = await StorageServiceFacade.execute(
        'readGoogleDriveFile',
        serviceInput(connection, { path }),
      ) as Uint8Array | null;
      if (!data) throw new Error(`Google Drive file not found: ${path}`);
      return data;
    },

    delete: async (path) => {
      await StorageServiceFacade.execute(
        'deleteGoogleDriveFile',
        serviceInput(connection, { path }),
      );
    },

    list: async (path = '') => StorageServiceFacade.execute(
      'listGoogleDriveFiles',
      serviceInput(connection, { path }),
    ) as Promise<CanonicalGoogleDriveFile[]>,

    stat: async (path) => {
      const files = await StorageServiceFacade.execute(
        'listGoogleDriveFiles',
        serviceInput(connection, { path }),
      ) as CanonicalGoogleDriveFile[];
      const match = files.find((file) => file.path === path);
      if (!match) throw new Error(`Google Drive file not found: ${path}`);
      return match;
    },

    mkdir: async (path) => {
      // Google Drive folders are provider objects; create through a zero-byte
      // marker file to preserve the existing storage abstraction contract.
      await StorageServiceFacade.execute(
        'writeGoogleDriveFile',
        serviceInput(connection, { path: `${path.replace(/\/+$/, '')}/.keep`, data: '', contentType: 'text/plain' }),
      );
    },
  };
}

export async function testGoogleDriveConnection(connection: UserStorageConnection) {
  const started = Date.now();
  try {
    const result = await StorageServiceFacade.execute(
      'testGoogleDriveConnection',
      serviceInput(connection),
    ) as { success: boolean; latencyMs?: number; error?: string; email?: string };
    return {
      success: result.success,
      latencyMs: result.latencyMs ?? Date.now() - started,
      email: result.email,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Google Drive connection failed.',
    };
  }
}

export async function writeGoogleDriveFile(
  connection: UserStorageConnection,
  path: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream',
): Promise<void> {
  const bytes = typeof data === 'string' ? data : new Uint8Array(data);
  await StorageServiceFacade.execute(
    'writeGoogleDriveFile',
    serviceInput(connection, { path, data: bytes, contentType }),
  );
}

export async function readGoogleDriveFile(
  connection: UserStorageConnection,
  path: string,
): Promise<Buffer | null> {
  const bytes = await StorageServiceFacade.execute(
    'readGoogleDriveFile',
    serviceInput(connection, { path }),
  ) as Uint8Array | null;
  return bytes ? Buffer.from(bytes) : null;
}

export async function deleteGoogleDriveFile(
  connection: UserStorageConnection,
  path: string,
): Promise<void> {
  await StorageServiceFacade.execute('deleteGoogleDriveFile', serviceInput(connection, { path }));
}

export async function listGoogleDriveFiles(
  connection: UserStorageConnection,
): Promise<Array<{ path: string }>> {
  const files = await StorageServiceFacade.execute(
    'listGoogleDriveFiles',
    serviceInput(connection),
  ) as CanonicalGoogleDriveFile[];
  return files.map((file) => ({ path: file.path }));
}
