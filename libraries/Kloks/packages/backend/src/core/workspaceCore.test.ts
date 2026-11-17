import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCanonicalWorkspaceFolderName } from '../workspace/WorkspaceCanonical.js';
import { resolveWorkspaceConnection } from './workspaceBucketSyncCore.js';
import { getWorkspaceFolderPrefix, normalizeWorkspaceStoragePath } from './workspaceFileCore.js';

const workspaceMocks = vi.hoisted(() => ({
  queryUnifiedDb: vi.fn(),
  resolveUserStorageConnectionSecret: vi.fn(),
  resolveUserWorkspaceStorageAssociation: vi.fn(),
  listUserStorageConnections: vi.fn(),
  testBackblazeCredentials: vi.fn(),
  createGoogleDriveWorkspaceClient: vi.fn(),
  syncWorkspaceCreateToBucket: vi.fn(),
  syncWorkspaceDeleteToBucket: vi.fn(),
}));

vi.mock('./unifiedDb.js', () => ({
  queryUnifiedDb: workspaceMocks.queryUnifiedDb,
}));
vi.mock('./storageConnectionCore.js', () => ({
  resolveUserStorageConnectionSecret: workspaceMocks.resolveUserStorageConnectionSecret,
  resolveUserWorkspaceStorageAssociation: workspaceMocks.resolveUserWorkspaceStorageAssociation,
  listUserStorageConnections: workspaceMocks.listUserStorageConnections,
  testBackblazeCredentials: workspaceMocks.testBackblazeCredentials,
  createGoogleDriveWorkspaceClient: workspaceMocks.createGoogleDriveWorkspaceClient,
}));
vi.mock('./workspaceBucketSyncCore.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./workspaceBucketSyncCore.js')>();
  return {
    ...actual,
    syncWorkspaceCreateToBucket: workspaceMocks.syncWorkspaceCreateToBucket,
    syncWorkspaceDeleteToBucket: workspaceMocks.syncWorkspaceDeleteToBucket,
  };
});

import { deleteWorkspace, findUserWorkspace, getWorkspaces } from './workspaceCore.js';


describe('workspace application scoping', () => {
  it('uses an application namespace for canonical workspace folders', () => {
    expect(formatCanonicalWorkspaceFolderName('aiko', 'User One', 'Main')).toBe('ultrst_aiko_user_one_main');
    expect(formatCanonicalWorkspaceFolderName('depm', 'User One', 'Main')).toBe('ultrst_depm_user_one_main');
  });
});

describe('owner-bound storage connection resolution', () => {
  const profiles = {
    aiko: {
      storage_connections: [{ id: 'aiko-drive', provider: 'google_drive' }],
    },
    srkl: {
      storage_connections: [{ id: 'srkl-b2', provider: 'backblaze_b2' }],
    },
  };

  it('requires the exact connection ID saved on the workspace', () => {
    expect(resolveWorkspaceConnection(profiles, {
      storageProvider: 'google_drive',
      storageConnectionId: 'aiko-drive',
    })).toEqual({ id: 'aiko-drive', provider: 'google_drive' });
    expect(resolveWorkspaceConnection(profiles, {
      storageProvider: 'google_drive',
      storageConnectionId: 'missing-id',
    })).toBeNull();
    expect(resolveWorkspaceConnection(profiles, {
      storageProvider: 'backblaze_b2',
      storageConnectionId: 'aiko-drive',
    })).toBeNull();
  });

  it('does not fall back to primary or first connection for legacy cloud workspaces without an ID', () => {
    expect(resolveWorkspaceConnection(profiles, {
      storageProvider: 'google_drive',
    })).toBeNull();
  });
});

describe('workspace storage path containment', () => {
  it('normalizes only safe relative paths', () => {
    expect(normalizeWorkspaceStoragePath('projects/archive/file.db')).toBe('projects/archive/file.db');
    expect(getWorkspaceFolderPrefix({ workspacePath: './ultrst_aiko_user_main' })).toBe('ultrst_aiko_user_main');
    for (const unsafe of ['../secret', 'a/../../secret', '/absolute/path', 'C:/private/file', 'a//b', 'a/./b', '']) {
      expect(() => normalizeWorkspaceStoragePath(unsafe)).toThrow(/relative path|directory segments/i);
    }
  });

  it('permits only the empty list prefix, not empty file names', () => {
    expect(normalizeWorkspaceStoragePath('', true)).toBe('');
    expect(() => normalizeWorkspaceStoragePath('')).toThrow(/relative path/i);
  });
});

describe('verified owner workspace lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceMocks.queryUnifiedDb.mockResolvedValue({
      rows: [{
        id: 'owner-1',
        email: 'owner@example.test',
        username: 'owner',
        app_profiles: {
          depm: {
            workspaces: [{
              id: 'workspace-1',
              storageProvider: 'backblaze_b2',
              storageConnectionId: 'connection-1',
            }],
          },
        },
      }],
    });
    workspaceMocks.resolveUserStorageConnectionSecret.mockResolvedValue({
      id: 'connection-1',
      provider: 'backblaze_b2',
      enabled: true,
      b2BucketName: 'production-bucket',
    });
  });

  it('returns migrated legacy workspaces on the first canonical workspace read', async () => {
    let migrated = false;
    workspaceMocks.listUserStorageConnections.mockImplementation(async () => {
      migrated = true;
      return [];
    });
    workspaceMocks.queryUnifiedDb.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM "ultrst-users"')) {
        return {
          rows: [{
            id: 'owner-1',
            app_profiles: {
              depm: {
                workspaces: migrated ? [{ id: 'legacy-workspace', name: 'Migrated' }] : [],
                activeWorkspaceId: 'legacy-workspace',
              },
            },
          }],
        };
      }
      return { rows: [] };
    });

    await expect(getWorkspaces('owner-1')).resolves.toMatchObject({
      workspaces: [{ id: 'legacy-workspace', name: 'Migrated' }],
      activeWorkspaceId: 'legacy-workspace',
    });
  });

  it('keeps the workspace profile when remote cloud deletion fails', async () => {
    workspaceMocks.syncWorkspaceDeleteToBucket.mockRejectedValue(new Error('provider delete failed'));

    await expect(deleteWorkspace('owner-1', 'workspace-1'))
      .rejects.toThrow(/provider delete failed/i);

    expect(workspaceMocks.syncWorkspaceDeleteToBucket).toHaveBeenCalled();
    expect(workspaceMocks.queryUnifiedDb.mock.calls.some(([sql]) => String(sql).startsWith('UPDATE "ultrst-users"')))
      .toBe(false);
  });

  it('does not resolve workspace IDs without a verified owner identity', async () => {
    await expect(findUserWorkspace('workspace-1')).resolves.toEqual({
      user: null,
      workspace: null,
      connection: null,
    });
    expect(workspaceMocks.queryUnifiedDb).not.toHaveBeenCalled();
  });

  it('supports legacy-only workspace profiles without scanning other owners', async () => {
    workspaceMocks.queryUnifiedDb.mockImplementation(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM "ultrst-users"')) return { rows: [] };
      if (sql.includes('FROM "srkl_application_profiles"')) {
        expect(params).toEqual(['owner-1']);
        return {
          rows: [{
            id: 'owner-1',
            email: 'owner@example.test',
            username: 'owner',
            app_profiles: {
              depm: {
                workspaces: [{
                  id: 'legacy-workspace',
                  storageProvider: 'backblaze_b2',
                  storageConnectionId: 'connection-1',
                }],
              },
            },
          }],
        };
      }
      return { rows: [] };
    });

    await expect(findUserWorkspace('legacy-workspace', undefined, 'owner-1')).resolves.toMatchObject({
      user: { id: 'owner-1' },
      workspace: { id: 'legacy-workspace' },
      connection: { id: 'connection-1', __ownerUserId: 'owner-1' },
    });
  });

  it('queries only the authenticated owner and returns an owner-bound connection', async () => {
    await expect(findUserWorkspace('workspace-1', undefined, 'owner-1')).resolves.toMatchObject({
      user: { id: 'owner-1' },
      workspace: { id: 'workspace-1', storageConnectionId: 'connection-1' },
      connection: {
        id: 'connection-1',
        provider: 'backblaze_b2',
        __ownerUserId: 'owner-1',
      },
    });

    expect(workspaceMocks.queryUnifiedDb).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1 OR email = $1'),
      ['owner-1'],
      undefined,
    );
    expect(workspaceMocks.resolveUserStorageConnectionSecret).toHaveBeenCalledWith(
      'owner-1',
      'connection-1',
      expect.any(Function),
      'backblaze_b2',
    );
  });
});
