import { describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_DRIVE_WORKSPACE_SCOPE,
  GoogleDriveWorkspaceService,
} from './GoogleDriveWorkspaceService.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createService(fetcher: typeof fetch) {
  return new GoogleDriveWorkspaceService({
    clientId: 'client-id',
    redirectUri: 'https://app.example.test/api/storage/google/callback',
    tokens: { accessToken: 'access-token' },
    fetcher,
  });
}

describe('Fetch-native canonical Google Drive workspace service', () => {
  it('generates an RFC 7636 S256 challenge and includes it in a storage-only OAuth URL', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await GoogleDriveWorkspaceService.createPkceCodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');

    const generatedVerifier = GoogleDriveWorkspaceService.createPkceCodeVerifier();
    expect(generatedVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const url = new URL(GoogleDriveWorkspaceService.createAuthorizationUrl({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/api/storage/google/callback',
    }, 'signed-state', [GOOGLE_DRIVE_WORKSPACE_SCOPE], challenge));

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.test/api/storage/google/callback');
    expect(url.searchParams.get('scope')).toBe(GOOGLE_DRIVE_WORKSPACE_SCOPE);
    expect(url.searchParams.get('state')).toBe('signed-state');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('client_secret')).toBeNull();
  });

  it('rejects sign-in scopes and malformed PKCE values', async () => {
    expect(() => GoogleDriveWorkspaceService.createAuthorizationUrl({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
    }, 'state', [GOOGLE_DRIVE_WORKSPACE_SCOPE, 'openid'])).toThrow(/storage scopes only/i);
    expect(() => GoogleDriveWorkspaceService.createAuthorizationUrl({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
    }, 'state', [GOOGLE_DRIVE_WORKSPACE_SCOPE], 'not-a-challenge')).toThrow(/S256 challenge/i);
    await expect(GoogleDriveWorkspaceService.createPkceCodeChallenge('too-short')).rejects.toThrow(/verifier/i);
  });

  it('validates OAuth state at the callback boundary before code exchange', () => {
    expect(() => GoogleDriveWorkspaceService.validateOAuthState('stored-state', 'stored-state')).not.toThrow();
    expect(() => GoogleDriveWorkspaceService.validateOAuthState('stored-state', 'attacker-state')).toThrow(/state validation failed/i);
    expect(() => GoogleDriveWorkspaceService.validateOAuthState('', 'returned-state')).toThrow(/state validation failed/i);
  });

  it('exchanges an authorization code with the PKCE verifier and preserves an existing refresh token', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'access-token-from-code',
      expires_in: 3600,
      token_type: 'Bearer',
    }));
    const tokens = await GoogleDriveWorkspaceService.exchangeAuthorizationCode({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      fetcher,
    }, 'authorization-code', 'existing-refresh-token', verifier);

    expect(tokens).toMatchObject({
      accessToken: 'access-token-from-code',
      refreshToken: 'existing-refresh-token',
      tokenType: 'Bearer',
    });
    const body = fetcher.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('authorization-code');
    expect(body.get('code_verifier')).toBe(verifier);
    expect(body.get('client_secret')).toBe('server-secret');
  });

  it('persists newly exchanged credentials and permits public PKCE clients without an empty secret', async () => {
    const persistTokens = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 1800,
    }));
    const tokens = await GoogleDriveWorkspaceService.exchangeAuthorizationCode({
      clientId: 'public-client-id',
      redirectUri: 'https://app.example.test/callback',
      fetcher,
      persistTokens,
    }, 'authorization-code');

    expect(tokens.refreshToken).toBe('new-refresh-token');
    expect(persistTokens).toHaveBeenCalledWith(tokens);
    const body = fetcher.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.has('client_secret')).toBe(false);
  });

  it('redacts OAuth provider descriptions and request failures', async () => {
    const failedExchange = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      error: 'invalid_grant',
      error_description: 'server-secret refresh-token authorization-code access-token',
    }, 400));
    let exchangeError = '';
    try {
      await GoogleDriveWorkspaceService.exchangeAuthorizationCode({
        clientId: 'client-id',
        clientSecret: 'server-secret',
        redirectUri: 'https://app.example.test/callback',
        fetcher: failedExchange,
      }, 'authorization-code', 'refresh-token');
    } catch (error) {
      exchangeError = error instanceof Error ? error.message : String(error);
    }
    expect(exchangeError).toContain('invalid_grant');
    expect(exchangeError).not.toContain('server-secret');
    expect(exchangeError).not.toContain('refresh-token');
    expect(exchangeError).not.toContain('authorization-code');
    expect(exchangeError).not.toContain('access-token');

    const networkFailure = vi.fn<typeof fetch>().mockRejectedValue(new Error('request contained server-secret'));
    await expect(GoogleDriveWorkspaceService.exchangeAuthorizationCode({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      fetcher: networkFailure,
    }, 'authorization-code')).rejects.toThrow('before receiving a response');
  });

  it('refreshes expired credentials, preserves omitted refresh tokens and persists the rotation', async () => {
    const persistTokens = vi.fn();
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'fresh-token', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse({
        user: { permissionId: 'google-account', emailAddress: 'user@example.test' },
      }));
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'expired-token', refreshToken: 'refresh-token', expiresAt: Date.now() - 1 },
      fetcher,
      persistTokens,
    });

    await expect(service.getAccountIdentity()).resolves.toEqual({
      accountId: 'google-account',
      email: 'user@example.test',
    });
    expect(persistTokens).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'fresh-token',
      refreshToken: 'refresh-token',
    }));
    const refreshBody = fetcher.mock.calls[0][1]?.body as URLSearchParams;
    expect(refreshBody.get('grant_type')).toBe('refresh_token');
    expect(refreshBody.get('refresh_token')).toBe('refresh-token');
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer fresh-token');
  });

  it('serializes concurrent initial refreshes and persists the refreshed token set once', async () => {
    let releaseRefresh!: (response: Response) => void;
    let markRefreshStarted!: () => void;
    const refreshStarted = new Promise<void>((resolve) => { markRefreshStarted = resolve; });
    const pendingRefresh = new Promise<Response>((resolve) => { releaseRefresh = resolve; });
    let refreshCalls = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      if (String(input) === 'https://oauth2.googleapis.com/token') {
        refreshCalls += 1;
        markRefreshStarted();
        return pendingRefresh;
      }
      return jsonResponse({ user: { permissionId: 'shared-account' } });
    });
    const persistTokens = vi.fn();
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'expired-token', refreshToken: 'refresh-token', expiresAt: Date.now() - 1 },
      fetcher,
      persistTokens,
    });

    const first = service.getAccountIdentity();
    const second = service.getAccountIdentity();
    await refreshStarted;
    expect(refreshCalls).toBe(1);
    releaseRefresh(jsonResponse({ access_token: 'shared-fresh-token', expires_in: 3600 }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { accountId: 'shared-account' },
      { accountId: 'shared-account' },
    ]);
    expect(refreshCalls).toBe(1);
    expect(persistTokens).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent 401 retries so a late rejected request reuses the rotated token', async () => {
    let aboutCalls = 0;
    let refreshCalls = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url === 'https://oauth2.googleapis.com/token') {
        refreshCalls += 1;
        return jsonResponse({ access_token: 'rotated-token', refresh_token: 'rotated-refresh-token', expires_in: 3600 });
      }
      if (url.includes('/about?')) {
        aboutCalls += 1;
        if (aboutCalls <= 2) return jsonResponse({ error: { message: 'secret echoed from request' } }, 401);
        return jsonResponse({ user: { permissionId: 'account-after-retry' } });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const persistTokens = vi.fn();
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'old-token', refreshToken: 'old-refresh-token' },
      fetcher,
      persistTokens,
    });

    await expect(Promise.all([service.getAccountIdentity(), service.getAccountIdentity()])).resolves.toEqual([
      { accountId: 'account-after-retry' },
      { accountId: 'account-after-retry' },
    ]);
    expect(refreshCalls).toBe(1);
    expect(persistTokens).toHaveBeenCalledTimes(1);
    expect(aboutCalls).toBe(4);
  });

  it('does not activate newly issued credentials when persistence fails and redacts the callback error', async () => {
    const persistTokens = vi.fn().mockRejectedValue(new Error('failed to persist server-secret refresh-token'));
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'unpersisted-access-token',
      refresh_token: 'unpersisted-refresh-token',
      expires_in: 3600,
    }));
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'expired-token', refreshToken: 'existing-refresh-token', expiresAt: Date.now() - 1 },
      fetcher,
      persistTokens,
    });

    let failure = '';
    try {
      await service.getAccountIdentity();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    expect(failure).toBe('Google Drive credentials could not be persisted securely.');
    expect(failure).not.toContain('server-secret');
    expect(failure).not.toContain('refresh-token');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('exposes explicit refresh through the shared persistence lifecycle', async () => {
    const persistTokens = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'manual-refresh-access',
      refresh_token: 'manual-refresh-rotated',
      expires_in: 7200,
      token_type: 'Bearer',
    }));
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'current-access', refreshToken: 'current-refresh' },
      fetcher,
      persistTokens,
    });

    await expect(service.refreshTokens()).resolves.toMatchObject({
      accessToken: 'manual-refresh-access',
      refreshToken: 'manual-refresh-rotated',
      tokenType: 'Bearer',
    });
    expect(persistTokens).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'manual-refresh-access',
      refreshToken: 'manual-refresh-rotated',
    }));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns stable Google account identity, browses folders and persists the selected root as metadata', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({
        user: { permissionId: 'google-account-id', emailAddress: 'user@example.test' },
      }))
      .mockResolvedValueOnce(jsonResponse({
        nextPageToken: 'next-page',
        files: [{
          id: 'folder-1',
          name: 'Projects',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
          modifiedTime: '2026-10-01T00:00:00.000Z',
        }],
      }))
      .mockResolvedValueOnce(jsonResponse({ files: [{
        id: 'folder-2',
        name: 'Archive',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      }] }))
      .mockResolvedValueOnce(jsonResponse({
        id: 'selected-folder',
        name: 'Workspace',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['root'],
      }));
    const service = createService(fetcher);

    await expect(service.getAccountIdentity()).resolves.toEqual({
      accountId: 'google-account-id',
      email: 'user@example.test',
    });
    await expect(service.listFolders()).resolves.toMatchObject([
      { id: 'folder-1', name: 'Projects', parentIds: ['root'] },
      { id: 'folder-2', name: 'Archive', parentIds: ['root'] },
    ]);
    const listUrls = fetcher.mock.calls.slice(1, 3).map(([input]) => new URL(String(input)));
    expect(listUrls[1].searchParams.get('pageToken')).toBe('next-page');

    await expect(service.selectRootFolder('selected-folder')).resolves.toMatchObject({
      id: 'selected-folder',
      name: 'Workspace',
    });
    expect(service.getConnectionMetadata()).toEqual({
      provider: 'google_drive',
      googleAccountId: 'google-account-id',
      googleRootFolderId: 'selected-folder',
    });
    expect(JSON.stringify(service.getConnectionMetadata())).not.toMatch(/accessToken|refreshToken|clientSecret|server-secret/i);
  });

  it('fails closed when Drive returns malformed listing JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('not-json', { status: 200 }),
    );
    const service = createService(fetcher);

    await expect(service.listFolders()).rejects.toThrow(/invalid JSON response/i);
  });

  it('rejects folder browsing outside the configured workspace root', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/files/outside-child')) {
        return jsonResponse({
          id: 'outside-child',
          name: 'Outside child',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['outside-parent'],
        });
      }
      if (url.pathname.endsWith('/files/outside-parent')) {
        return jsonResponse({
          id: 'outside-parent',
          name: 'Outside parent',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'],
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      rootFolderId: 'workspace-root',
      tokens: { accessToken: 'access-token' },
      fetcher,
    });

    await expect(service.listFolders('outside-child'))
      .rejects.toThrow(/outside the configured workspace root/i);
    expect(fetcher.mock.calls.some(([input]) => new URL(String(input)).searchParams.has('q'))).toBe(false);
  });

  it('allows folder browsing inside the configured workspace root', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/files/inside-child')) {
        return jsonResponse({
          id: 'inside-child',
          name: 'Inside child',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['workspace-root'],
        });
      }
      if (url.pathname.endsWith('/files')) {
        return jsonResponse({ files: [{
          id: 'nested-folder',
          name: 'Nested',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['inside-child'],
        }] });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      rootFolderId: 'workspace-root',
      tokens: { accessToken: 'access-token' },
      fetcher,
    });

    await expect(service.listFolders('inside-child')).resolves.toMatchObject([
      { id: 'nested-folder', name: 'Nested', parentIds: ['inside-child'] },
    ]);
  });

  it('rejects a different Google account from the one bound to the saved connection', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      user: { permissionId: 'different-account' },
    }));
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      googleAccountId: 'saved-account',
      tokens: { accessToken: 'access-token' },
      fetcher,
    });

    await expect(service.getAccountIdentity()).rejects.toThrow(/does not match the saved storage connection/i);
    expect(service.getConnectionMetadata()).toMatchObject({
      provider: 'google_drive',
      googleAccountId: 'saved-account',
    });
  });

  it('returns a sanitized successful connection test with account and root metadata', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      user: { permissionId: 'account-for-test', emailAddress: 'owner@example.test' },
    }));
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      rootFolderId: 'workspace-root',
      tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      fetcher,
    });

    await expect(service.testConnection()).resolves.toMatchObject({
      ok: true,
      details: {
        accountId: 'account-for-test',
        email: 'owner@example.test',
        rootFolderId: 'workspace-root',
      },
    });
    expect(JSON.stringify(service.getConnectionMetadata())).not.toMatch(/accessToken|refreshToken/i);
  });

  it('supports list, read, stat, exists, mkdir and delete over mocked Fetch', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/files') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body));
        return jsonResponse({
          id: `${body.name}-id`,
          name: body.name,
          mimeType: body.mimeType,
          parents: body.parents,
        });
      }
      if (url.pathname.endsWith('/files') && url.searchParams.has('q')) {
        const query = url.searchParams.get('q') || '';
        if (query.includes("name = 'missing.txt'")) return jsonResponse({ files: [] });
        if (query.includes("name = 'folder'")) return jsonResponse({ files: [] });
        if (query.includes("name = 'nested'")) return jsonResponse({ files: [] });
        return jsonResponse({ files: [{
          id: 'file-1',
          name: 'note.txt',
          mimeType: 'text/plain',
          size: '4',
          modifiedTime: '2026-11-01T00:00:00.000Z',
          parents: ['root'],
        }] });
      }
      if (url.pathname.endsWith('/files/file-1') && url.searchParams.get('alt') === 'media') {
        return new Response(new Uint8Array([1, 2, 3, 4]));
      }
      if (url.pathname.endsWith('/files/file-1') && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const service = createService(fetcher);

    await expect(service.list()).resolves.toMatchObject([{
      path: 'note.txt', size: 4, id: 'file-1', mimeType: 'text/plain', isFolder: false,
    }]);
    await expect(service.stat('note.txt')).resolves.toMatchObject({
      path: 'note.txt', size: 4, id: 'file-1', mimeType: 'text/plain', isFolder: false,
    });
    await expect(service.exists('note.txt')).resolves.toBe(true);
    await expect(service.exists('missing.txt')).resolves.toBe(false);
    await expect(service.read('note.txt')).resolves.toEqual(new Uint8Array([1, 2, 3, 4]));
    await expect(service.mkdir('folder/nested')).resolves.toBeUndefined();
    await expect(service.delete('note.txt')).resolves.toBeUndefined();
    expect(fetcher.mock.calls.some(([input, init]) => String(input).includes('/files/file-1?') && init?.method === 'DELETE')).toBe(true);
  });

  it('sends valid multipart uploads for new and existing Drive files', async () => {
    const captured: Array<{ url: string; method?: string; headers: Headers; body: Uint8Array }> = [];
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.startsWith('https://www.googleapis.com/drive/v3/files?')) {
        const query = new URL(url).searchParams.get('q') || '';
        if (query.includes("name = 'existing.txt'")) {
          return jsonResponse({ files: [{ id: 'existing-file', name: 'existing.txt', mimeType: 'text/plain' }] });
        }
        return jsonResponse({ files: [] });
      }
      if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files')) {
        captured.push({
          url,
          method: init?.method,
          headers: new Headers(init?.headers),
          body: new Uint8Array(init?.body as ArrayBuffer),
        });
        return jsonResponse({ id: 'uploaded-file' });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const service = createService(fetcher);

    await service.write('new.bin', new Uint8Array([0, 255, 3]), 'application/octet-stream');
    await service.write('existing.txt', 'updated', 'text/plain');

    expect(captured).toHaveLength(2);
    const create = captured[0];
    const update = captured[1];
    expect(create.method).toBe('POST');
    expect(new URL(create.url).searchParams.get('uploadType')).toBe('multipart');
    const boundary = create.headers.get('Content-Type')?.split('boundary=')[1];
    expect(boundary).toBeTruthy();
    const createText = new TextDecoder().decode(create.body);
    expect(createText).toContain(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8`);
    expect(createText).toContain('"name":"new.bin"');
    expect(createText).toContain('"parents":["root"]');
    expect(create.body.some((byte, index) => byte === 0 && create.body[index + 1] === 255 && create.body[index + 2] === 3)).toBe(true);
    expect(update.method).toBe('PATCH');
    expect(update.url).toContain('/files/existing-file?uploadType=multipart');
    expect(new TextDecoder().decode(update.body)).toContain('updated');
  });

  it('redacts Drive API response bodies and transport errors', async () => {
    const apiFailure = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      error: { message: 'server-secret access-token refresh-token request header echoed' },
    }, 403));
    const service = createService(apiFailure);
    let apiFailureMessage = '';
    try {
      await service.getAccountIdentity();
    } catch (error) {
      apiFailureMessage = error instanceof Error ? error.message : String(error);
    }
    expect(apiFailureMessage).toBe('Google Drive request failed with HTTP 403.');
    expect(apiFailureMessage).not.toMatch(/server-secret|access-token|refresh-token/i);

    const networkFailure = vi.fn<typeof fetch>().mockRejectedValue(new Error('Authorization: Bearer access-token'));
    const networkService = createService(networkFailure);
    await expect(networkService.getAccountIdentity()).rejects.toThrow('before receiving a response');
  });

  it('reports missing expired credentials without making a network request', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'expired-token', expiresAt: Date.now() - 1 },
      fetcher,
    });
    await expect(service.getAccountIdentity()).rejects.toThrow(/reconnect/i);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
