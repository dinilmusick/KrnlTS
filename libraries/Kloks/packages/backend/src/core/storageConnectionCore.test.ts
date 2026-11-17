import { describe, expect, it } from 'vitest';
import {
  deleteUserStorageConnection,
  listUserStorageConnections,
  resolveUserStorageConnectionSecret,
  resolveUserWorkspaceStorageAssociation,
  toPublicStorageConnection,
} from './storageConnectionCore.js';
import { getGoogleDriveOAuthConfiguration, getOrCreateStorageConnectionEncryptionKey, getStorageConnectionEncryptionKey } from './systemCredentialsCore.js';

describe('canonical user storage connection security contract', () => {
  it('migrates legacy app profiles and workspace references without replacing canonical fields', async () => {
    let canonicalProfiles: Record<string, any> = {
      aiko: {
        preferences: { canonicalSetting: true },
        workspaces: [{
          id: 'workspace-1',
          name: 'Canonical name',
          storageProvider: 'backblaze_b2',
          storageConnectionId: 'connection-1',
          localFolderKey: 'workspaces/canonical',
        }],
      },
    };
    let legacyProfiles: Record<string, any> = {
      aiko: {
        preferences: { legacySetting: true },
        workspaces: [
          { id: 'workspace-1', legacyWorkspaceField: 'preserve-me' },
          {
            id: 'workspace-2',
            name: 'Legacy workspace',
            storageProvider: 'google_drive',
            storageConnectionId: 'connection-2',
            localFolderKey: 'workspaces/legacy',
          },
        ],
      },
      srkl: { unrelatedLegacySetting: { keep: true } },
    };
    const query = async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM "ultrst-users"')) {
        return { rows: [{ id: 'owner-1', email: 'owner@example.test', app_profiles: canonicalProfiles }] };
      }
      if (sql.includes('FROM "srkl_application_profiles"')) {
        expect(params[1]).toBe('owner@example.test');
        return { rows: [{ id: 'owner-1', email: 'owner@example.test', app_profiles: legacyProfiles }] };
      }
      if (sql.startsWith('UPDATE "ultrst-users"')) {
        canonicalProfiles = JSON.parse(String(params[0]));
        return { rows: [] };
      }
      if (sql.startsWith('UPDATE "srkl_application_profiles"')) {
        legacyProfiles = JSON.parse(String(params[0]));
        return { rows: [] };
      }
      return { rows: [] };
    };

    await expect(listUserStorageConnections('owner-1', query as any)).resolves.toEqual([]);

    expect(canonicalProfiles.aiko.preferences).toEqual({
      legacySetting: true,
      canonicalSetting: true,
    });
    expect(canonicalProfiles.aiko.workspaces).toEqual([
      expect.objectContaining({
        id: 'workspace-1',
        name: 'Canonical name',
        legacyWorkspaceField: 'preserve-me',
      }),
      expect.objectContaining({
        id: 'workspace-2',
        storageConnectionId: 'connection-2',
      }),
    ]);
    expect(canonicalProfiles.srkl.unrelatedLegacySetting).toEqual({ keep: true });
    expect(legacyProfiles.srkl.unrelatedLegacySetting).toEqual({ keep: true });
  });

  it('resolves cloud workspace operations only through persisted owner and connection associations', async () => {
    const persistedWorkspace = {
      id: 'workspace-1',
      name: 'Production workspace',
      storageProvider: 'backblaze_b2',
      storageConnectionId: 'connection-1',
      localFolderKey: 'workspaces/production',
      b2BucketName: 'production-bucket',
    };
    const query = async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM "ultrst-users"')) {
        if (params[0] !== 'owner-1') return { rows: [] };
        return {
          rows: [{
            id: 'owner-1',
            app_profiles: { aiko: { workspaces: [persistedWorkspace] } },
          }],
        };
      }
      return { rows: [] };
    };

    await expect(resolveUserWorkspaceStorageAssociation(
      'owner-1',
      'connection-1',
      'workspaces/production',
      query as any,
    )).resolves.toMatchObject({
      id: 'workspace-1',
      storageProvider: 'backblaze_b2',
      storageConnectionId: 'connection-1',
      __ownerUserId: 'owner-1',
    });
    await expect(resolveUserWorkspaceStorageAssociation(
      'owner-1',
      'another-connection',
      'workspaces/production',
      query as any,
    )).resolves.toBeNull();
    await expect(resolveUserWorkspaceStorageAssociation(
      'owner-1',
      'connection-1',
      'workspaces/other',
      query as any,
    )).resolves.toBeNull();
    await expect(resolveUserWorkspaceStorageAssociation(
      'another-owner',
      'connection-1',
      'workspaces/production',
      query as any,
    )).resolves.toBeNull();
  });

  it('does not delete a connection when legacy workspace-reference verification fails', async () => {
    let legacyReads = 0;
    let writes = 0;
    const query = async (sql: string) => {
      if (sql.includes('FROM "ultrst-users"')) {
        return {
          rows: [{
            id: 'user-1',
            app_profiles: {
              srkl: {
                storage_connections: [{
                  id: 'connection-1',
                  provider: 'backblaze_b2',
                  label: 'B2',
                }],
                workspaces: [],
              },
            },
          }],
        };
      }
      if (sql.includes('FROM "srkl_application_profiles"')) {
        legacyReads += 1;
        if (legacyReads === 1) return { rows: [] };
        throw Object.assign(new Error('permission denied for table srkl_application_profiles'), {
          code: '42501',
        });
      }
      if (/^\s*(UPDATE|DELETE)\b/i.test(sql)) writes += 1;
      return { rows: [] };
    };

    await expect(deleteUserStorageConnection('user-1', 'connection-1', query as any))
      .rejects.toThrow(/permission denied/i);
    expect(writes).toBe(0);
  });

  it('does not swallow operational failures while reading the legacy profile store', async () => {
    const query = async (sql: string) => {
      if (sql.includes('FROM "ultrst-users"')) {
        return { rows: [{ id: 'user-1', app_profiles: { aiko: { preferences: { keep: true } } } }] };
      }
      if (sql.includes('FROM "srkl_application_profiles"')) {
        throw Object.assign(new Error('permission denied for table srkl_application_profiles'), {
          code: '42501',
        });
      }
      return { rows: [] };
    };

    await expect(listUserStorageConnections('user-1', query as any))
      .rejects.toThrow(/permission denied/i);
  });


  it('projects only safe connection metadata to browser callers', () => {
    const raw = {
      id: 'conn-b2-1',
      provider: 'backblaze_b2',
      label: 'Production B2',
      role: 'primary',
      enabled: true,
      b2BucketName: 'archive',
      b2Region: 'us-west-004',
      b2KeyId: 'account-key-id',
      b2ApplicationKey: 'super-secret-b2-key',
      googleAccessToken: 'google-access-token',
      googleRefreshToken: 'google-refresh-token',
      clientSecret: 'system-google-client-secret',
      metadata: { token: 'leaked-token' },
    };
    const projected = toPublicStorageConnection(raw);
    expect(projected).toMatchObject({
      id: 'conn-b2-1',
      provider: 'backblaze_b2',
      label: 'Production B2',
      role: 'primary',
      b2BucketName: 'archive',
    });
    const serialized = JSON.stringify(projected);
    for (const secret of [
      'account-key-id',
      'super-secret-b2-key',
      'google-access-token',
      'google-refresh-token',
      'system-google-client-secret',
      'leaked-token',
      'b2ApplicationKey',
      'googleAccessToken',
      'googleRefreshToken',
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('reads the user-owned SRKL compatibility profile while listing only safe projections', async () => {
    const calls: string[] = [];
    const query = async (sql: string) => {
      calls.push(sql);
      if (sql.includes('FROM public."ultrst-credentials"')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              storageConnections: {
                encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                encryptionKeyVersion: 1,
              },
            },
          }],
        };
      }
      if (sql.includes('"ultrst-users"')) {
        return {
          rows: [{
            id: 'user-1',
            app_profiles: {
              aiko: {
                storage_connections: [{
                  id: 'drive-1',
                  provider: 'google_drive',
                  label: 'Owner Drive',
                  googleEmail: 'owner@example.test',
                  googleAccessToken: 'secret-access',
                  googleRefreshToken: 'secret-refresh',
                }],
              },
            },
          }],
        };
      }
      return { rows: [] };
    };
    const connections = await listUserStorageConnections('user-1', query as any);
    expect(connections).toHaveLength(1);
    expect(connections[0]).toMatchObject({
      id: 'drive-1',
      provider: 'google_drive',
      googleEmail: 'owner@example.test',
    });
    expect(JSON.stringify(connections)).not.toContain('secret-access');
    expect(JSON.stringify(connections)).not.toContain('secret-refresh');
    expect(calls.some((sql) => sql.includes('"srkl_application_profiles"'))).toBe(true);
  });

  it('keeps the server-only secret resolver scoped to the supplied user profile', async () => {
    const query = async (sql: string, params?: unknown[]) => {
      if (sql.includes('FROM public."ultrst-credentials"')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              storageConnections: {
                encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                encryptionKeyVersion: 1,
              },
            },
          }],
        };
      }
      if (sql.startsWith('SELECT') && sql.includes('"ultrst-users"')) {
        if (params?.[0] === 'other-user') return { rows: [] };
        expect(params?.[0]).toBe('user-1');
        return {
          rows: [{
            id: 'user-1',
            app_profiles: {
              srkl: {
                storage_connections: [{
                  id: 'b2-1',
                  provider: 'backblaze_b2',
                  b2KeyId: 'key-id',
                  b2ApplicationKey: 'private-b2-key',
                }],
              },
            },
          }],
        };
      }
      return { rows: [] };
    };
    const connection = await resolveUserStorageConnectionSecret('user-1', 'b2-1', query as any);
    expect(connection?.b2ApplicationKey).toBe('private-b2-key');
    expect(await resolveUserStorageConnectionSecret('other-user', 'b2-1', query as any)).toBeNull();
  });
  it('migrates legacy B2 and Google credentials to user-bound AES-GCM ciphertext', async () => {
    let profiles: Record<string, any> = {
      aiko: {
        storage_connections: [
          {
            id: 'b2-legacy',
            provider: 'backblaze_b2',
            label: 'Legacy B2',
            role: 'primary',
            b2KeyId: 'legacy-key-id',
            b2ApplicationKey: 'legacy-b2-secret',
            b2BucketName: 'archive',
          },
          {
            id: 'drive-legacy',
            provider: 'google_drive',
            label: 'Legacy Google',
            googleEmail: 'owner@example.test',
            googleAccountId: 'google-subject',
            googleAccessToken: 'legacy-google-access',
            googleRefreshToken: 'legacy-google-refresh',
            googleAccessTokenExpiresAt: 123456,
          },
        ],
      },
      kone: {
        workspaces: [{ id: 'kone-workspace', storageProvider: 'backblaze_b2', storageConnectionId: 'kone-b2' }],
        unrelatedProfileSetting: { retained: true },
      },
      srkl: {
        workspaces: [{ id: 'srkl-workspace', storageProvider: 'backblaze_b2', storageConnectionId: 'srkl-legacy-b2' }],
        activeWorkspaceId: 'srkl-workspace',
      },
    };
    let legacyProfiles: Record<string, any> = {
      srkl: {
        workspaces: [{ id: 'legacy-vault', storageProvider: 'backblaze_b2', storageConnectionId: 'srkl-legacy-b2' }],
        activeWorkspaceId: 'legacy-vault',
        storage_connections: [{
          id: 'srkl-legacy-b2',
          provider: 'backblaze_b2',
          label: 'Legacy SRKL B2',
          b2KeyId: 'legacy-srkl-key-id',
          b2ApplicationKey: 'legacy-srkl-secret',
          b2BucketName: 'srkl-vault',
        }],
      },
      legacyApp: { preferences: { preserve: true } },
    };
    let systemCredentials: Record<string, any> = {
      storageConnections: {
        encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        encryptionKeyVersion: 1,
      },
    };
    const query = async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM "ultrst-users"')) {
        if (params[0] === 'user-2') return { rows: [{ id: 'user-2', app_profiles: profiles }] };
        if (params[0] !== 'user-1') return { rows: [] };
        return { rows: [{ id: 'user-1', app_profiles: profiles }] };
      }
      if (sql.includes('FROM "srkl_application_profiles"')) {
        if (params[0] !== 'user-1') return { rows: [] };
        return { rows: [{ app_profiles: legacyProfiles }] };
      }
      if (sql.includes('FROM public."ultrst-credentials"')) {
        return {
          rows: [{
            id: 'system',
            credentials: systemCredentials,
            created_at: new Date(0),
            updated_at: new Date(0),
          }],
        };
      }
      if (sql.includes('INSERT INTO public."ultrst-credentials"')) {
        if (!systemCredentials || Object.keys(systemCredentials).length === 0) {
          systemCredentials = {};
        }
        return { rows: [] };
      }
      if (sql.includes('UPDATE public."ultrst-credentials"')) {
        const key = String(params[0]);
        if (!systemCredentials.storageConnections?.encryptionKey) {
          systemCredentials = {
            ...systemCredentials,
            storageConnections: {
              ...(systemCredentials.storageConnections || {}),
              encryptionKey: key,
              encryptionKeyVersion: 1,
            },
          };
        }
        return { rows: [] };
      }
      if (sql.includes('UPDATE "srkl_application_profiles"')) {
        legacyProfiles = JSON.parse(String(params[0]));
        return { rows: [] };
      }
      if (sql.includes('UPDATE "ultrst-users"')) {
        profiles = JSON.parse(String(params[0]));
        return { rows: [] };
      }
      return { rows: [] };
    };

    const publicConnections = await listUserStorageConnections('user-1', query as any);
    expect(publicConnections).toHaveLength(3);
    expect(JSON.stringify(publicConnections)).not.toContain('legacy-key-id');
    expect(JSON.stringify(publicConnections)).not.toContain('legacy-b2-secret');
    expect(JSON.stringify(publicConnections)).not.toContain('legacy-google-access');
    expect(JSON.stringify(publicConnections)).not.toContain('legacy-google-refresh');
    expect(typeof systemCredentials.storageConnections.encryptionKey).toBe('string');
    expect(systemCredentials.storageConnections.encryptionKey.length).toBeGreaterThanOrEqual(43);

    const persisted = profiles.aiko.storage_connections;
    expect(persisted[0]).toHaveProperty('secretCiphertext.algorithm', 'AES-GCM-256');
    expect(persisted[1]).toHaveProperty('secretCiphertext.algorithm', 'AES-GCM-256');
    for (const secret of [
      'legacy-key-id',
      'legacy-b2-secret',
      'legacy-google-access',
      'legacy-google-refresh',
    ]) {
      expect(JSON.stringify(persisted)).not.toContain(secret);
    }
    expect(persisted[0]).not.toHaveProperty('b2KeyId');
    expect(persisted[0]).not.toHaveProperty('b2ApplicationKey');
    expect(persisted[1]).not.toHaveProperty('googleAccessToken');
    expect(persisted[1]).not.toHaveProperty('googleRefreshToken');
    expect(profiles.kone.workspaces[0]).toMatchObject({
      id: 'kone-workspace',
      storageConnectionId: 'kone-b2',
    });
    expect(profiles.kone.unrelatedProfileSetting).toEqual({ retained: true });
    expect(profiles.srkl.workspaces[0]).toMatchObject({
      id: 'srkl-workspace',
      storageConnectionId: 'srkl-legacy-b2',
    });
    expect(legacyProfiles.srkl.workspaces[0]).toMatchObject({
      id: 'legacy-vault',
      storageConnectionId: 'srkl-legacy-b2',
    });
    expect(legacyProfiles.legacyApp.preferences).toEqual({ preserve: true });
    expect(legacyProfiles.srkl.storage_connections[0]).toHaveProperty('secretCiphertext.algorithm', 'AES-GCM-256');
    expect(JSON.stringify(legacyProfiles)).not.toContain('legacy-srkl-key-id');
    expect(JSON.stringify(legacyProfiles)).not.toContain('legacy-srkl-secret');

    const legacyB2 = await resolveUserStorageConnectionSecret('user-1', 'srkl-legacy-b2', query as any);
    expect(legacyB2).toMatchObject({
      b2KeyId: 'legacy-srkl-key-id',
      b2ApplicationKey: 'legacy-srkl-secret',
      b2BucketName: 'srkl-vault',
    });

    const b2 = await resolveUserStorageConnectionSecret('user-1', 'b2-legacy', query as any);
    expect(b2).toMatchObject({
      b2KeyId: 'legacy-key-id',
      b2ApplicationKey: 'legacy-b2-secret',
      b2BucketName: 'archive',
    });
    const drive = await resolveUserStorageConnectionSecret('user-1', 'drive-legacy', query as any);
    expect(drive).toMatchObject({
      googleAccessToken: 'legacy-google-access',
      googleRefreshToken: 'legacy-google-refresh',
      googleEmail: 'owner@example.test',
    });
    expect(await resolveUserStorageConnectionSecret('different-user', 'b2-legacy', query as any)).toBeNull();
    await expect(resolveUserStorageConnectionSecret('user-2', 'b2-legacy', query as any))
      .rejects.toThrow(/could not be decrypted/i);

    const validOwnerProfiles = structuredClone(profiles);
    profiles = structuredClone(validOwnerProfiles);
    profiles.aiko.storage_connections[0].provider = 'google_drive';
    await expect(resolveUserStorageConnectionSecret('user-1', 'b2-legacy', query as any))
      .rejects.toThrow(/could not be decrypted/i);

    // Rebinding an otherwise valid envelope to another opaque connection ID
    // must fail AES-GCM authentication even for the same owner.
    profiles = structuredClone(validOwnerProfiles);
    profiles.aiko.storage_connections[0].id = 'tampered-connection-id';
    await expect(resolveUserStorageConnectionSecret('user-1', 'tampered-connection-id', query as any))
      .rejects.toThrow(/could not be decrypted/i);
  });



  it('fails closed without DDL, insert, or update when an encrypted envelope has no wrapping key', async () => {
    let writes = 0;
    const profiles = {
      srkl: {
        storage_connections: [{
          id: 'encrypted-b2',
          provider: 'backblaze_b2',
          label: 'Encrypted B2',
          secretCiphertext: {
            version: 1,
            algorithm: 'AES-GCM-256',
            iv: 'AAAAAAAAAAAAAAAA',
            ciphertext: 'AAAAAAAAAAAAAAAAAAAAAA',
          },
        }],
      },
    };
    const query = async (sql: string) => {
      if (/^\s*(CREATE|ALTER|INSERT|UPDATE|DELETE)\b/i.test(sql)) writes += 1;
      if (sql.includes('FROM "ultrst-users"')) {
        return { rows: [{ id: 'user-1', app_profiles: profiles }] };
      }
      if (sql.includes('FROM "srkl_application_profiles"')) return { rows: [] };
      if (sql.includes('FROM public."ultrst-credentials"')) return { rows: [] };
      return { rows: [] };
    };

    await expect(resolveUserStorageConnectionSecret('user-1', 'encrypted-b2', query as any))
      .rejects.toThrow(/storage encryption key is missing/i);
    expect(writes).toBe(0);
  });


  it('rejects unsupported system key versions without replacing the installed key', async () => {
    const installedKey = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    let updates = 0;
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return { rows: [{
          id: 'system',
          credentials: { storageConnections: { encryptionKey: installedKey, encryptionKeyVersion: 2 } },
        }] };
      }
      if (sql.includes('UPDATE public."ultrst-credentials"')) updates += 1;
      return { rows: [] };
    };

    await expect(getStorageConnectionEncryptionKey(query as any))
      .rejects.toThrow(/version is not supported/i);
    expect(updates).toBe(0);
  });


  it('requires a dedicated Google OAuth state signing secret in system credentials', async () => {
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              googleDriveOAuth: {
                clientId: 'system-client-id',
                clientSecret: 'system-client-secret-with-sufficient-length',
                redirectUri: 'https://storage.example.test/api/workspaces/storage/google/callback',
                allowedReturnOrigins: ['https://aiko.example.test', 'https://kone.example.test'],
              },
            },
          }],
        };
      }
      return { rows: [] };
    };

    await expect(getGoogleDriveOAuthConfiguration(query as any))
      .rejects.toThrow(/OAuth state signing secret/i);
  });

  it('uses only the explicit system-owned OAuth state signing secret', async () => {
    const stateSecret = 'dedicated-state-signing-secret-with-more-than-32-characters';
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return {
          rows: [{
            id: 'system',
            credentials: {
              googleDriveOAuth: {
                clientId: 'system-client-id',
                clientSecret: 'system-client-secret-with-sufficient-length',
                stateSecret,
                redirectUri: 'https://storage.example.test/api/workspaces/storage/google/callback',
                allowedReturnOrigins: ['https://aiko.example.test', 'https://kone.example.test'],
              },
            },
          }],
        };
      }
      return { rows: [] };
    };

    await expect(getGoogleDriveOAuthConfiguration(query as any)).resolves.toMatchObject({
      clientId: 'system-client-id',
      clientSecret: 'system-client-secret-with-sufficient-length',
      stateSecret,
      allowedReturnOrigins: ['https://aiko.example.test', 'https://kone.example.test'],
    });
  });

  it('installs one raw 32-byte AES-256 key with an atomic nested merge', async () => {
    let systemCredentials: Record<string, any> = {
      googleDriveOAuth: {
        clientId: 'system-client-id',
        clientSecret: 'system-client-secret',
      },
      unrelatedSystemSetting: { retained: true },
    };
    let updateCount = 0;
    const query = async (sql: string, params: unknown[] = []) => {
      if (sql.includes('SELECT id, credentials')) {
        return { rows: [{ id: 'system', credentials: systemCredentials }] };
      }
      if (sql.includes('UPDATE public."ultrst-credentials"')) {
        updateCount += 1;
        // Model PostgreSQL's conditional row update: exactly one concurrent
        // initializer wins; a later writer cannot replace the persisted key.
        if (!systemCredentials.storageConnections?.encryptionKey) {
          systemCredentials = {
            ...systemCredentials,
            storageConnections: {
              ...(systemCredentials.storageConnections || {}),
              encryptionKey: String(params[0]),
              encryptionKeyVersion: 1,
            },
          };
        }
        return { rows: [] };
      }
      return { rows: [] };
    };

    const [first, second] = await Promise.all([
      getOrCreateStorageConnectionEncryptionKey(query as any),
      getOrCreateStorageConnectionEncryptionKey(query as any),
    ]);
    expect(first).toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const base64 = first.replace(/-/g, '+').replace(/_/g, '/').padEnd(44, '=');
    expect(atob(base64)).toHaveLength(32);
    expect(systemCredentials.googleDriveOAuth.clientId).toBe('system-client-id');
    expect(systemCredentials.googleDriveOAuth.clientSecret).toBe('system-client-secret');
    expect(systemCredentials.unrelatedSystemSetting).toEqual({ retained: true });
    expect(systemCredentials.storageConnections.encryptionKeyVersion).toBe(1);
    expect(updateCount).toBe(2);
  });

  it('refuses to replace a malformed existing wrapping key', async () => {
    let updateCount = 0;
    const query = async (sql: string) => {
      if (sql.includes('SELECT id, credentials')) {
        return { rows: [{ id: 'system', credentials: { storageConnections: { encryptionKey: 'not-a-valid-key' } } }] };
      }
      if (sql.includes('UPDATE public."ultrst-credentials"')) updateCount += 1;
      return { rows: [] };
    };
    await expect(getOrCreateStorageConnectionEncryptionKey(query as any)).rejects.toThrow(/malformed/i);
    expect(updateCount).toBe(0);
  });

});
