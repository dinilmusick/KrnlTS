import { afterEach, describe, expect, it, vi } from 'vitest';

const { storageExecute, workspaceExecute } = vi.hoisted(() => ({
  storageExecute: vi.fn(),
  workspaceExecute: vi.fn(),
}));

vi.mock('@ultrst-armada/kloks/backend/krnl-services', () => ({
  StorageServiceFacade: { execute: storageExecute },
  WorkspaceServiceFacade: { execute: workspaceExecute },
  SrklServiceFacade: { execute: vi.fn() },
}));

vi.mock('../auth/luthSession.js', () => ({
  proxyLuthAuthRequest: vi.fn(async () => null),
  authenticateLuthRequest: vi.fn(async (request: Request) => {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', 'verified-luth-user');
    return { request: new Request(request, { headers }) };
  }),
}));

import { fetchHandler } from './httpsAdapter.js';

const env = {
  SYSTEM_DATABASE_URL: 'postgresql://primary.example/db',
  SYSTEM_DATABASE_URL_2: 'postgresql://fallback-two.example/db',
  SYSTEM_DATABASE_URL_3: 'postgresql://fallback-three.example/db',
  APP_URL: 'https://kone.example',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('KONE authenticated canonical storage routes', () => {
  it('creates Google authorization state for the verified Luth principal and sets an HttpOnly nonce cookie', async () => {
    storageExecute.mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=signed',
      nonce: 'one-time-nonce',
      expiresAt: '2026-11-17T00:10:00.000Z',
    });
    const response = await fetchHandler(new Request(
      'https://kone.example/api/storage/connections/google/authorize?returnTo=https%3A%2F%2Fkone.example%2F',
    ), env);
    expect(response.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('createGoogleDriveAuthorizationRequest', expect.objectContaining({
      userId: 'verified-luth-user',
      returnTo: 'https://kone.example/',
      callbackOrigin: 'https://kone.example',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL }),
    }));
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax');
    expect(response.headers.get('set-cookie')).toContain('one-time-nonce');
  });

  it('completes Google authorization using the user bound into verified signed state', async () => {
    storageExecute.mockImplementation(async (operation: string) => {
      if (operation === 'verifyGoogleDriveAuthorizationState') {
        return { userId: 'state-bound-user', returnTo: 'https://kone.example/workspace' };
      }
      if (operation === 'completeGoogleDriveAuthorization') return { id: 'google-connection' };
      throw new Error('Unexpected storage operation: ' + operation);
    });
    const response = await fetchHandler(new Request(
      'https://kone.example/api/storage/connections/google/callback?code=oauth-code&state=signed-state',
      { headers: { Cookie: 'kone_google_drive_nonce=nonce-value' } },
    ), env);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('storage=google-drive-connected');
    expect(storageExecute).toHaveBeenCalledWith('verifyGoogleDriveAuthorizationState', expect.objectContaining({
      state: 'signed-state',
      nonceCookie: 'nonce-value',
      callbackOrigin: 'https://kone.example',
    }));
    expect(storageExecute).toHaveBeenCalledWith('completeGoogleDriveAuthorization', expect.objectContaining({
      userId: 'state-bound-user',
      code: 'oauth-code',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL }),
    }));
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('lists Google folders and selects a root only for the verified owner', async () => {
    storageExecute.mockResolvedValueOnce([{ id: 'folder-1', name: 'Documents' }]);
    const foldersResponse = await fetchHandler(new Request('https://kone.example/api/storage/connections/google/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: 'google-connection', parentFolderId: 'root', userId: 'spoofed-user' }),
    }), env);
    expect(foldersResponse.status).toBe(200);
    expect(storageExecute).toHaveBeenCalledWith('listGoogleDriveFolders', expect.objectContaining({
      userId: 'verified-luth-user',
      connectionId: 'google-connection',
      parentFolderId: 'root',
    }));

    storageExecute.mockResolvedValueOnce({ id: 'folder-1', name: 'Documents' });
    const rootResponse = await fetchHandler(new Request('https://kone.example/api/storage/connections/google/root', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: 'google-connection', folderId: 'folder-1', userId: 'spoofed-user' }),
    }), env);
    expect(rootResponse.status).toBe(200);
    expect(storageExecute).toHaveBeenLastCalledWith('selectGoogleDriveRootFolder', expect.objectContaining({
      userId: 'verified-luth-user',
      connectionId: 'google-connection',
      folderId: 'folder-1',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL }),
    }));
  });

  it('verifies Google Drive account identity through the authenticated Kloks operation', async () => {
    storageExecute.mockResolvedValue({ accountId: 'google-account-1', email: 'owner@example.test' });
    const response = await fetchHandler(new Request('https://kone.example/api/storage/connections/google/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: 'google-connection', userId: 'spoofed-user' }),
    }), env);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      accountId: 'google-account-1',
      email: 'owner@example.test',
    });
    expect(storageExecute).toHaveBeenCalledWith('getGoogleDriveAccountIdentity', expect.objectContaining({
      userId: 'verified-luth-user',
      connectionId: 'google-connection',
      env: expect.objectContaining({ SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL }),
    }));
  });
});
