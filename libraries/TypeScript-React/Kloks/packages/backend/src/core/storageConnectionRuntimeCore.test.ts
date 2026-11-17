import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveUserStorageConnectionSecret: vi.fn(),
  resolveUserWorkspaceStorageAssociation: vi.fn(),
  writeWorkspaceFile: vi.fn(),
}));

vi.mock('./storageConnectionCore.js', () => ({
  resolveUserStorageConnectionSecret: mocks.resolveUserStorageConnectionSecret,
  resolveUserWorkspaceStorageAssociation: mocks.resolveUserWorkspaceStorageAssociation,
}));
vi.mock('./workspaceFileCore.js', () => ({
  writeWorkspaceFile: mocks.writeWorkspaceFile,
  readWorkspaceFile: vi.fn(),
  deleteWorkspaceFile: vi.fn(),
  listWorkspaceFiles: vi.fn(),
}));

const {
  resolveUserStorageConnectionSecret,
  resolveUserWorkspaceStorageAssociation,
  writeWorkspaceFile,
} = mocks;

import { writeUserWorkspaceStorageFile } from './storageConnectionRuntimeCore.js';

describe('owner-bound workspace storage runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveUserStorageConnectionSecret.mockResolvedValue({
      id: 'connection-1',
      provider: 'backblaze_b2',
      enabled: true,
      b2BucketName: 'production-bucket',
      b2KeyId: 'key-id',
      b2ApplicationKey: 'application-key',
    });
    resolveUserWorkspaceStorageAssociation.mockResolvedValue({
      id: 'workspace-1',
      name: 'Production workspace',
      storageProvider: 'backblaze_b2',
      storageConnectionId: 'connection-1',
      localFolderKey: 'workspaces/production',
      b2BucketName: 'production-bucket',
    });
    writeWorkspaceFile.mockResolvedValue(undefined);
  });

  it('uses the persisted workspace association and saved provider root', async () => {
    await expect(writeUserWorkspaceStorageFile({
      userId: 'verified-owner',
      connectionId: 'connection-1',
      folderPrefix: 'workspaces/production',
      relativePath: 'documents/readme.txt',
      content: 'workspace data',
    })).resolves.toEqual({ success: true });

    expect(resolveUserStorageConnectionSecret).toHaveBeenCalledWith(
      'verified-owner',
      'connection-1',
      expect.any(Function),
    );
    expect(resolveUserWorkspaceStorageAssociation).toHaveBeenCalledWith(
      'verified-owner',
      'connection-1',
      'workspaces/production',
      expect.any(Function),
    );
    expect(writeWorkspaceFile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace-1',
        storageConnectionId: 'connection-1',
        localFolderKey: 'workspaces/production',
        b2BucketName: 'production-bucket',
      }),
      expect.objectContaining({
        id: 'connection-1',
        provider: 'backblaze_b2',
        __ownerUserId: 'verified-owner',
      }),
      'documents/readme.txt',
      'workspace data',
      'application/octet-stream',
      undefined,
    );
  });

  it('rejects an unassociated workspace before any provider write', async () => {
    resolveUserWorkspaceStorageAssociation.mockResolvedValue(null);

    await expect(writeUserWorkspaceStorageFile({
      userId: 'verified-owner',
      connectionId: 'connection-1',
      folderPrefix: 'workspaces/not-owned',
      relativePath: 'documents/readme.txt',
      content: 'must not write',
    })).rejects.toThrow(/not associated/i);

    expect(writeWorkspaceFile).not.toHaveBeenCalled();
  });

  it('rejects a caller-selected B2 bucket that differs from the persisted workspace', async () => {
    await expect(writeUserWorkspaceStorageFile({
      userId: 'verified-owner',
      connectionId: 'connection-1',
      folderPrefix: 'workspaces/production',
      relativePath: 'documents/readme.txt',
      content: 'must not write',
      bucketName: 'another-users-bucket',
    })).rejects.toThrow(/does not match the persisted workspace/i);

    expect(writeWorkspaceFile).not.toHaveBeenCalled();
  });

  it('rejects unsafe relative paths before invoking the provider adapter', async () => {
    await expect(writeUserWorkspaceStorageFile({
      userId: 'verified-owner',
      connectionId: 'connection-1',
      folderPrefix: 'workspaces/production',
      relativePath: '../outside.txt',
      content: 'must not write',
    })).rejects.toThrow(/safe workspace-relative path/i);

    expect(writeWorkspaceFile).not.toHaveBeenCalled();
  });
});
