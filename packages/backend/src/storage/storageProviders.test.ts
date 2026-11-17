import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  throw new Error('The optional Supabase driver must not load during module initialization.');
});

import { GoogleDriveWorkspaceService } from './GoogleDriveWorkspaceService.js';
import { GoogleDriveStorageService } from './GoogleDriveStorageService.js';
import { LocalFSAdapter } from './LocalFSAdapter.js';
import { StorageAdapterFactory } from './StorageAdapterFactory.js';
import * as nodeStorage from './node.js';
import { BucketStorageService, SupabaseStorageAdapter } from './node.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const baseConfig = {
  provider: 'google_drive' as const,
  googleClientId: 'client-id',
  googleRedirectUri: 'https://app.example.test/google/callback',
  googleAccessToken: 'access-token',
  googleRefreshToken: 'refresh-token',
};

describe('Fetch-native Google Drive storage integration', () => {

  it('keeps the optional Supabase driver lazy until storage is used', () => {
    const adapter = new SupabaseStorageAdapter({
      provider: 'supabase',
      bucket: 'workspace',
      endpoint: 'https://example.supabase.co',
      accessKey: 'test-key',
    });
    expect(adapter).toBeInstanceOf(SupabaseStorageAdapter);
  });

  it('preserves S3-compatible bucket storage through the existing factory', () => {
    const service = new BucketStorageService({
      provider: 's3_compatible',
      bucket: 'workspace',
      region: 'us-east-1',
      endpoint: 'https://s3.example.test',
      accessKey: 'access',
      secretKey: 'secret',
    });
    expect(service).toBeInstanceOf(BucketStorageService);
    expect(StorageAdapterFactory.create({
      provider: 's3',
      bucket: 'workspace',
      accessKey: 'access',
      secretKey: 'secret',
    })).toBeInstanceOf(BucketStorageService);
  });

  it('constructs the canonical workspace service lazily through the storage factory', () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = StorageAdapterFactory.create(baseConfig, {
      googleDrive: { fetcher },
    });

    expect(adapter).toBeInstanceOf(GoogleDriveStorageService);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('delegates file operations to the canonical Fetch service and preserves Drive metadata', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      files: [{
        id: 'drive-file-1',
        name: 'notes.txt',
        mimeType: 'text/plain',
        size: '12',
        modifiedTime: '2026-11-12T00:00:00.000Z',
        parents: ['root'],
      }],
    }));
    const persistCredentials = vi.fn();
    const adapter = new GoogleDriveStorageService(baseConfig, {
      fetcher,
      persistCredentials,
    });

    await expect(adapter.list()).resolves.toMatchObject([{
      path: 'notes.txt',
      id: 'drive-file-1',
      mimeType: 'text/plain',
      isFolder: false,
      size: 12,
    }]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(persistCredentials).not.toHaveBeenCalled();
    expect(adapter.getConnectionMetadata()).toEqual({
      provider: 'google_drive',
      googleClientId: 'client-id',
      googleRedirectUri: 'https://app.example.test/google/callback',
    });
  });

  it('loads persisted credentials and routes refresh through canonical persistence', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({
      access_token: 'rotated-access-token',
      refresh_token: 'rotated-refresh-token',
      expires_in: 3600,
    }));
    const persistCredentials = vi.fn();
    const adapter = new GoogleDriveStorageService({
      ...baseConfig,
      googleAccessTokenExpiresAt: 1,
    }, {
      clientSecret: 'server-secret',
      fetcher,
      getCredentials: async () => ({
        accessToken: 'expired-access-token',
        refreshToken: 'existing-refresh-token',
        expiresAt: 1,
      }),
      persistCredentials,
    });

    await expect(adapter.refreshTokens()).resolves.toMatchObject({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });
    expect(persistCredentials).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    }));
  });

  it('uses the canonical OAuth/PKCE contract without a Node Google SDK', async () => {
    const verifier = GoogleDriveWorkspaceService.createPkceCodeVerifier();
    const challenge = await GoogleDriveWorkspaceService.createPkceCodeChallenge(verifier);
    const url = new URL(GoogleDriveWorkspaceService.createAuthorizationUrl({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/google/callback',
    }, 'workspace-state', undefined, challenge));

    expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive');
    expect(url.searchParams.get('state')).toBe('workspace-state');
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.has('client_secret')).toBe(false);
  });


  it('exports the Fetch-native Drive facade and LocalFS while retiring the legacy SDK surface', () => {
    expect(nodeStorage.GoogleDriveStorageService).toBe(GoogleDriveStorageService);
    expect(nodeStorage.LocalFSAdapter).toBe(LocalFSAdapter);
    expect(nodeStorage).not.toHaveProperty('GoogleDriveAdapter');
    expect(nodeStorage).not.toHaveProperty('GoogleDriveOAuth');
    expect(nodeStorage).not.toHaveProperty('createGoogleDriveAuthorizationUrl');
    expect(nodeStorage).not.toHaveProperty('refreshGoogleDriveAccessToken');
  });

  it('keeps LocalFS available as a Node-only storage provider', () => {
    const local = StorageAdapterFactory.create({
      provider: 'local_fs',
      basePath: '/tmp/kloks-storage-test',
    });
    expect(local).toBeInstanceOf(LocalFSAdapter);
  });
});
