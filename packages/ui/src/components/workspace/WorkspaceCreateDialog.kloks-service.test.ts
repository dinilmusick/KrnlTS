import { describe, expect, it, vi } from 'vitest';
import { createKloksWorkspaceStorageService } from './WorkspaceCreateDialog.js';

describe('canonical Kloks workspace storage adapter', () => {
  it('uses the declared Kloks StorageService operations for B2 and Google Drive', async () => {
    const invoke = vi.fn(async (_serviceId: string, operation: string, _input: Record<string, unknown>) => {
      switch (operation) {
        case 'getProviderCapabilities':
          return [{ id: 'backblaze_b2', displayName: 'Backblaze B2', enabled: true }];
        case 'getConnections':
          return [{
            id: 'b2-connection',
            provider: 'backblaze_b2',
            label: 'Production B2',
            b2KeyId: 'must-not-leak',
            b2ApplicationKey: 'must-not-leak',
            secretCiphertext: { ciphertext: 'opaque' },
          }];
        case 'testBackblazeCredentials':
          return { success: true, buckets: [{ bucketId: 'bucket-1', bucketName: 'workspace-data' }] };
        case 'createBackblazeConnection':
          return {
            id: 'b2-created',
            provider: 'backblaze_b2',
            label: 'New B2',
            keyId: 'must-not-leak',
            applicationKey: 'must-not-leak',
          };
        case 'listGoogleDriveFolders':
          return [{ id: 'folder-1', name: 'Projects', mimeType: 'application/vnd.google-apps.folder' }];
        case 'getGoogleDriveAccountIdentity':
          return { accountId: 'google-account-1', email: 'artist@example.test' };
        case 'selectGoogleDriveRootFolder':
          return { id: 'folder-1', name: 'Projects' };
        default:
          throw new Error('Unexpected Kloks operation: ' + operation);
      }
    });
    const service = createKloksWorkspaceStorageService({ invoke });

    const capabilities = await service.listStorageProviderCapabilities?.('user-1');
    expect(capabilities?.[0]?.id).toBe('backblaze_b2');

    const connections = await service.listStorageConnections?.('user-1');
    expect(connections).toEqual([{
      id: 'b2-connection',
      provider: 'backblaze_b2',
      label: 'Production B2',
      role: undefined,
      enabled: undefined,
      localFolderName: undefined,
      b2BucketName: undefined,
      googleEmail: undefined,
      googleAccountId: undefined,
      googleRootFolderId: undefined,
      googleRootFolderName: undefined,
    }]);
    expect(JSON.stringify(connections)).not.toMatch(/must-not-leak|secretCiphertext/);

    const tested = await service.testBackblazeCredentials?.({
      keyId: 'transient-key',
      applicationKey: 'transient-secret',
    });
    expect(tested?.success).toBe(true);

    const saved = await service.createBackblazeConnection?.('user-1', {
      keyId: 'transient-key',
      applicationKey: 'transient-secret',
      bucketName: 'workspace-data',
    });
    expect(saved).toEqual({ id: 'b2-created', name: 'New B2', provider: 'backblaze_b2' });
    expect(JSON.stringify(saved)).not.toMatch(/must-not-leak|applicationKey|keyId/);

    const folders = await service.listGoogleDriveFolders?.('drive-1', 'parent-1', 'user-1');
    expect(folders?.[0]?.id).toBe('folder-1');
    const identity = await service.getGoogleDriveAccountIdentity?.('user-1', 'drive-1');
    expect(identity).toEqual({ accountId: 'google-account-1', email: 'artist@example.test' });
    const root = await service.selectGoogleDriveRootFolder?.('user-1', 'drive-1', 'folder-1');
    expect(root).toEqual({ id: 'folder-1', name: 'Projects' });

    expect(invoke.mock.calls.map((call) => call[1])).toEqual([
      'getProviderCapabilities',
      'getConnections',
      'testBackblazeCredentials',
      'createBackblazeConnection',
      'listGoogleDriveFolders',
      'getGoogleDriveAccountIdentity',
      'selectGoogleDriveRootFolder',
    ]);
    expect(invoke.mock.calls.every((call) => call[0] === 'kloks.backend.storage')).toBe(true);
    expect(invoke.mock.calls[4]?.[2]).toEqual({
      userId: 'user-1',
      connectionId: 'drive-1',
      parentFolderId: 'parent-1',
    });
  });

  it('rejects unsafe or malformed Google authorization destinations', async () => {
    const location = {
      href: 'https://app.example.test/workspaces',
      origin: 'https://app.example.test',
      assign: vi.fn(),
    };
    vi.stubGlobal('window', { location });
    try {
      const invoke = vi.fn().mockResolvedValue({ authorizationUrl: 'https://evil.example/steal' });
      const service = createKloksWorkspaceStorageService({ invoke });
      await expect(service.connectGoogleDrive?.('user-1')).rejects.toThrow(/untrusted/i);
      expect(location.assign).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
