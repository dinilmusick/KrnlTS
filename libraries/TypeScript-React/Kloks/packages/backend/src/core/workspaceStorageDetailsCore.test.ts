import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUserWorkspace: vi.fn(),
  toPublicStorageConnection: vi.fn(),
  b2ListBuckets: vi.fn(),
  b2ListFileNames: vi.fn(),
}));

vi.mock('./workspaceCore.js', () => ({
  findUserWorkspace: mocks.findUserWorkspace,
}));
vi.mock('./storageConnectionCore.js', () => ({
  toPublicStorageConnection: mocks.toPublicStorageConnection,
}));
vi.mock('./b2DirectCore.js', () => ({
  b2ListBuckets: mocks.b2ListBuckets,
  b2ListFileNames: mocks.b2ListFileNames,
}));

import { getWorkspaceStorageDetails } from './workspaceStorageDetailsCore.js';

describe('workspace storage details projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.toPublicStorageConnection.mockImplementation((connection: any) => ({
      id: connection.id,
      label: connection.label,
      provider: connection.provider,
    }));
    mocks.findUserWorkspace.mockResolvedValue({
      workspace: {
        id: 'workspace-1',
        storageProvider: 'google_drive',
        storageConnectionId: 'connection-1',
        localFolderKey: 'workspaces/production',
      },
      connection: {
        id: 'connection-1',
        label: 'Google Drive',
        provider: 'google_drive',
        __ownerUserId: 'owner-1',
        accessToken: 'must-not-leak',
        refreshToken: 'must-not-leak',
        clientSecret: 'must-not-leak',
      },
    });
  });

  it('requires a verified owner before workspace lookup', async () => {
    await expect(getWorkspaceStorageDetails('workspace-1')).resolves.toMatchObject({
      success: false,
      error: expect.stringMatching(/verified workspace owner/i),
    });
    expect(mocks.findUserWorkspace).not.toHaveBeenCalled();
  });

  it('returns only the public connection projection for Google Drive workspaces', async () => {
    await expect(getWorkspaceStorageDetails('workspace-1', undefined, 'owner-1'))
      .resolves.toMatchObject({
        success: true,
        connection: {
          id: 'connection-1',
          label: 'Google Drive',
          provider: 'google_drive',
        },
      });
    const result = await getWorkspaceStorageDetails('workspace-1', undefined, 'owner-1');
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(mocks.findUserWorkspace).toHaveBeenCalledWith('workspace-1', undefined, 'owner-1');
    expect(mocks.b2ListBuckets).not.toHaveBeenCalled();
  });

  it('redacts provider diagnostics from storage inspection errors', async () => {
    mocks.findUserWorkspace.mockResolvedValue({
      workspace: {
        id: 'workspace-1',
        storageProvider: 'backblaze_b2',
        storageConnectionId: 'connection-1',
        localFolderKey: 'workspaces/production',
      },
      connection: {
        id: 'connection-1',
        label: 'B2',
        provider: 'backblaze_b2',
        b2KeyId: 'key-id',
        b2ApplicationKey: 'application-secret',
        __ownerUserId: 'owner-1',
      },
    });
    mocks.b2ListBuckets.mockRejectedValue(new Error('provider echoed application-secret'));
    const result = await getWorkspaceStorageDetails('workspace-1', undefined, 'owner-1');
    expect(result).toMatchObject({
      success: false,
      error: expect.stringMatching(/unable to inspect workspace storage/i),
    });
    expect(JSON.stringify(result)).not.toContain('application-secret');
  });
});
