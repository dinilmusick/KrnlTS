import { describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_DRIVE_WORKSPACE_SCOPE,
  GoogleDriveWorkspaceService,
} from '../packages/backend/src/storage/GoogleDriveWorkspaceService.js';
import { StorageAdapterFactory } from '../packages/backend/src/storage/StorageAdapterFactory.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Fetch-native Google Drive storage compatibility', () => {
  it('uses RFC 7636 S256 PKCE and Drive-only consent scopes', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await GoogleDriveWorkspaceService.createPkceCodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');

    const url = new URL(GoogleDriveWorkspaceService.createAuthorizationUrl(
      { clientId: 'client-id', redirectUri: 'https://app.example.test/callback' },
      'signed-state',
      [GOOGLE_DRIVE_WORKSPACE_SCOPE],
      challenge,
    ));
    expect(url.searchParams.get('state')).toBe('signed-state');
    expect(url.searchParams.get('scope')).toBe(GOOGLE_DRIVE_WORKSPACE_SCOPE);
    expect(url.searchParams.get('code_challenge')).toBe(challenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.has('client_secret')).toBe(false);
    expect(() => GoogleDriveWorkspaceService.createAuthorizationUrl(
      { clientId: 'client-id', redirectUri: 'https://app.example.test/callback' },
      'signed-state',
      [GOOGLE_DRIVE_WORKSPACE_SCOPE, 'openid'],
    )).toThrow(/storage scopes only/i);
  });

  it('validates callback state before code exchange', () => {
    expect(() => GoogleDriveWorkspaceService.validateOAuthState('stored', 'stored')).not.toThrow();
    expect(() => GoogleDriveWorkspaceService.validateOAuthState('stored', 'attacker')).toThrow(/state validation failed/i);
  });

  it('exchanges authorization codes through injected Fetch and persists credentials', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'exchanged-access-token',
      expires_in: 3600,
    }));
    const persistTokens = vi.fn();
    const tokens = await GoogleDriveWorkspaceService.exchangeAuthorizationCode({
      clientId: 'client-id',
      clientSecret: 'server-secret',
      redirectUri: 'https://app.example.test/callback',
      fetcher,
      persistTokens,
    }, 'authorization-code', 'existing-refresh-token', verifier);

    expect(tokens).toMatchObject({
      accessToken: 'exchanged-access-token',
      refreshToken: 'existing-refresh-token',
    });
    expect(persistTokens).toHaveBeenCalledWith(tokens);
    const body = fetcher.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get('code_verifier')).toBe(verifier);
    expect(body.get('client_secret')).toBe('server-secret');
  });

  it('refreshes through Fetch and preserves the existing refresh token', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      access_token: 'rotated-access-token',
      expires_in: 3600,
    }));
    const persistTokens = vi.fn();
    const service = new GoogleDriveWorkspaceService({
      clientId: 'client-id',
      redirectUri: 'https://app.example.test/callback',
      tokens: { accessToken: 'expired-access-token', refreshToken: 'existing-refresh-token', expiresAt: 1 },
      fetcher,
      persistTokens,
    });

    await expect(service.refreshTokens()).resolves.toMatchObject({
      accessToken: 'rotated-access-token',
      refreshToken: 'existing-refresh-token',
    });
    expect(persistTokens).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'rotated-access-token',
      refreshToken: 'existing-refresh-token',
    }));
  });

  it('routes factory operations through the canonical Fetch facade without exposing secrets', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ files: [] }));
    const adapter = StorageAdapterFactory.create({
      provider: 'google_drive',
      googleClientId: 'client-id',
      googleRedirectUri: 'https://app.example.test/callback',
    }, {
      googleDrive: {
        clientSecret: 'server-only-secret',
        getCredentials: async () => ({ accessToken: 'access-token', refreshToken: 'refresh-token' }),
        fetcher,
      },
    });

    await expect(adapter.list()).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toContain('/drive/v3/files');
    expect(JSON.stringify((adapter as any).getConnectionMetadata())).not.toContain('server-only-secret');
  });
});
