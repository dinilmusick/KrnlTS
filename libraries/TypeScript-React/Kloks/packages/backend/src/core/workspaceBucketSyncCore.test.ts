import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  writeWorkspaceFile: vi.fn(),
  deleteWorkspaceFolder: vi.fn(),
  resolveUserWorkspaceStorageAssociation: vi.fn(),
  queryUnifiedDb: vi.fn(),
}));

vi.mock('./workspaceFileCore.js', () => ({
  writeWorkspaceFile: mocks.writeWorkspaceFile,
  deleteWorkspaceFolder: mocks.deleteWorkspaceFolder,
}));
vi.mock('./storageConnectionCore.js', () => ({
  resolveUserWorkspaceStorageAssociation: mocks.resolveUserWorkspaceStorageAssociation,
}));
vi.mock('./unifiedDb.js', () => ({
  queryUnifiedDb: mocks.queryUnifiedDb,
}));

import {
  syncWorkspaceCreateToBucket,
  syncWorkspaceDeleteToBucket,
  syncWorkspaceDataToBucket,
} from './workspaceBucketSyncCore.js';

describe('owner-bound workspace bucket synchronization', () => {
  const workspace = {
    id: 'workspace-1',
    name: 'Production',
    storageProvider: 'backblaze_b2',
    storageConnectionId: 'connection-1',
    localFolderKey: 'workspaces/production',
    b2BucketName: 'production-bucket',
  };
  const connection = {
    id: 'connection-1',
    provider: 'backblaze_b2',
    enabled: true,
    b2BucketName: 'production-bucket',
    __ownerUserId: 'owner-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.writeWorkspaceFile.mockResolvedValue(undefined);
    mocks.deleteWorkspaceFolder.mockResolvedValue(undefined);
    mocks.resolveUserWorkspaceStorageAssociation.mockResolvedValue(workspace);
    mocks.queryUnifiedDb.mockResolvedValue({ rows: [] });
  });

  it('requires an owner-resolved connection before workspace initialization', async () => {
    await expect(syncWorkspaceCreateToBucket(workspace, {
      ...connection,
      __ownerUserId: undefined,
    })).rejects.toThrow(/verified owner/i);
    expect(mocks.writeWorkspaceFile).not.toHaveBeenCalled();
  });

  it('initializes metadata only through the exact owner and provider connection', async () => {
    await expect(syncWorkspaceCreateToBucket(workspace, connection)).resolves.toBeUndefined();
    expect(mocks.writeWorkspaceFile).toHaveBeenCalledTimes(3);
    expect(mocks.writeWorkspaceFile).toHaveBeenCalledWith(
      workspace,
      connection,
      'workspace.json',
      expect.stringContaining('"storageConnectionId": "connection-1"'),
      'application/json',
      undefined,
    );
  });

  it('rejects a workspace object that differs from the persisted workspace record', async () => {
    mocks.resolveUserWorkspaceStorageAssociation.mockResolvedValue({
      ...workspace,
      id: 'another-workspace',
    });

    await expect(syncWorkspaceCreateToBucket(workspace, connection))
      .rejects.toThrow(/persisted workspace-to-connection association/i);
    expect(mocks.writeWorkspaceFile).not.toHaveBeenCalled();
  });

  it('rejects a provider mismatch before workspace initialization', async () => {
    await expect(syncWorkspaceCreateToBucket({
      ...workspace,
      storageProvider: 'google_drive',
    }, connection)).rejects.toThrow(/provider does not match/i);
    expect(mocks.writeWorkspaceFile).not.toHaveBeenCalled();
  });

  it('requires an owner-resolved connection before workspace deletion', async () => {
    await expect(syncWorkspaceDeleteToBucket(workspace, {
      ...connection,
      __ownerUserId: undefined,
    })).rejects.toThrow(/verified owner/i);
    expect(mocks.deleteWorkspaceFolder).not.toHaveBeenCalled();
  });

  it('rejects cross-owner workspace data synchronization', async () => {
    await expect(syncWorkspaceDataToBucket({
      ...workspace,
      __ownerUserId: 'owner-2',
    }, connection, { apps: [] })).rejects.toThrow(/owner does not match/i);
    expect(mocks.writeWorkspaceFile).not.toHaveBeenCalled();
  });
});
