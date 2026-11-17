import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryUnifiedDb: vi.fn(),
  resolveUserStorageConnectionSecret: vi.fn(),
  listUserStorageConnections: vi.fn(),
  syncWorkspaceDataToBucket: vi.fn(),
  readWorkspaceFile: vi.fn(),
}));

vi.mock('./unifiedDb.js', () => ({
  queryUnifiedDb: mocks.queryUnifiedDb,
}));
vi.mock('./storageConnectionCore.js', () => ({
  resolveUserStorageConnectionSecret: mocks.resolveUserStorageConnectionSecret,
  listUserStorageConnections: mocks.listUserStorageConnections,
}));
vi.mock('./workspaceBucketSyncCore.js', () => ({
  syncWorkspaceDataToBucket: mocks.syncWorkspaceDataToBucket,
}));
vi.mock('./workspaceFileCore.js', () => ({
  readWorkspaceFile: mocks.readWorkspaceFile,
}));

import { saveWorkspaceData } from './workspaceDataCore.js';

describe('workspace data cloud synchronization ownership', () => {
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
    mocks.queryUnifiedDb.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT * FROM "ultrst-users"')) {
        return {
          rows: [{
            id: 'owner-1',
            app_profiles: { depm: { workspaces: [workspace], workspace_data: {} } },
          }],
        };
      }
      return { rows: [] };
    });
    mocks.listUserStorageConnections.mockResolvedValue([]);
    mocks.resolveUserStorageConnectionSecret.mockResolvedValue(connection);
    mocks.syncWorkspaceDataToBucket.mockResolvedValue(undefined);
  });

  it('resolves the saved cloud connection for the profile owner before syncing data', async () => {
    const data = { apps: [{ id: 'app-1' }], nodes: [], edges: [] };

    await expect(saveWorkspaceData('owner-1', 'workspace-1', data))
      .resolves.toMatchObject({ success: true, workspaceId: 'workspace-1' });

    expect(mocks.resolveUserStorageConnectionSecret).toHaveBeenCalledWith(
      'owner-1',
      'connection-1',
      expect.any(Function),
      'backblaze_b2',
    );
    expect(mocks.syncWorkspaceDataToBucket).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'workspace-1', __ownerUserId: 'owner-1' }),
      connection,
      data,
      undefined,
    );
  });

  it('fails closed when a cloud workspace has no owner-owned connection', async () => {
    mocks.resolveUserStorageConnectionSecret.mockResolvedValue(null);

    await expect(saveWorkspaceData('owner-1', 'workspace-1', { apps: [], nodes: [] }))
      .rejects.toThrow(/exact owner-owned storage connection/i);
    expect(mocks.syncWorkspaceDataToBucket).not.toHaveBeenCalled();
  });
});
