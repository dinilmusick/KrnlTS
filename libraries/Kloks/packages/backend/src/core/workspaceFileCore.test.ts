import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createGoogleDriveWorkspaceClient: vi.fn(),
  queryUnifiedDb: vi.fn(),
}));

vi.mock('./storageConnectionCore.js', () => ({
  createGoogleDriveWorkspaceClient: mocks.createGoogleDriveWorkspaceClient,
}));
vi.mock('./unifiedDb.js', () => ({
  queryUnifiedDb: mocks.queryUnifiedDb,
}));

import { deleteWorkspaceFolder } from './workspaceFileCore.js';

describe('canonical workspace folder deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryUnifiedDb.mockResolvedValue({ rows: [] });
  });

  it('propagates Google Drive listing failures instead of reporting a successful deletion', async () => {
    const drive = {
      list: vi.fn().mockRejectedValue(new Error('Google Drive request failed with HTTP 403.')),
      delete: vi.fn(),
    };
    mocks.createGoogleDriveWorkspaceClient.mockResolvedValue(drive);

    await expect(deleteWorkspaceFolder({
      id: 'workspace-1',
      localFolderKey: 'workspaces/production',
      storageProvider: 'google_drive',
      googleRootFolderId: 'selected-root',
    }, {
      id: 'connection-1',
      provider: 'google_drive',
      __ownerUserId: 'owner-1',
    })).rejects.toThrow('Google Drive request failed with HTTP 403.');

    expect(drive.delete).not.toHaveBeenCalled();
  });

  it('deletes only the selected workspace subtree beneath the persisted Drive root', async () => {
    const drive = {
      list: vi.fn(async (path: string) => {
        if (path === 'workspaces/production') {
          return [
            { path: 'workspaces/production/notes.txt', isFolder: false },
            { path: 'workspaces/production/archive', isFolder: true },
          ];
        }
        if (path === 'workspaces/production/archive') {
          return [{ path: 'workspaces/production/archive/old.txt', isFolder: false }];
        }
        throw new Error(`Unexpected path: ${path}`);
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mocks.createGoogleDriveWorkspaceClient.mockResolvedValue(drive);

    await expect(deleteWorkspaceFolder({
      id: 'workspace-1',
      localFolderKey: 'workspaces/production',
      storageProvider: 'google_drive',
      googleRootFolderId: 'selected-root',
    }, {
      id: 'connection-1',
      provider: 'google_drive',
      __ownerUserId: 'owner-1',
    })).resolves.toBeUndefined();

    expect(mocks.createGoogleDriveWorkspaceClient).toHaveBeenCalledWith(
      'owner-1',
      'connection-1',
      expect.any(Function),
      'selected-root',
    );
    expect(drive.delete.mock.calls.map(([path]) => path)).toEqual([
      'workspaces/production/notes.txt',
      'workspaces/production/archive/old.txt',
      'workspaces/production/archive',
      'workspaces/production',
    ]);
    expect(drive.delete).not.toHaveBeenCalledWith('selected-root');
  });
});
