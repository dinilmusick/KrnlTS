import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginSystemUser, resolveUserFromToken } from './UnifiedAuthCore.js';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Kloks Luth-backed auth compatibility facade', () => {
  it('delegates email login and returns only the bearer token issued by Luth', async () => {
    const requests: Array<{ url: string; authorization: string | null }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      requests.push({ url, authorization: headers.get('authorization') });
      if (url.endsWith('/api/auth/sign-in/email')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'set-auth-token': 'luth-issued-token' },
        });
      }
      return new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'luth-user-1', email: 'user@example.test', name: 'Test User' },
        session: { id: 'session-1', userId: 'luth-user-1' },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    const queryDb = vi.fn(async () => ({ rows: [] }));
    const result = await loginSystemUser('user@example.test', 'password-not-real', false, queryDb);

    expect(result.success).toBe(true);
    expect(result.token).toBe('luth-issued-token');
    expect(result.user?.id).toBe('luth-user-1');
    expect(requests[1].authorization).toBe('Bearer luth-issued-token');
    expect(queryDb).not.toHaveBeenCalled();
  });

  it('does not resolve a user ID or local token without a valid Luth session', async () => {
    globalThis.fetch = vi.fn(async () => new Response(
      JSON.stringify({ authenticated: false, error: 'SESSION_INVALID' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;
    const queryDb = vi.fn(async () => ({ rows: [{ id: 'user-id' }] }));
    await expect(resolveUserFromToken('user-id', queryDb)).resolves.toBeNull();
    expect(queryDb).not.toHaveBeenCalled();
  });

  it('preserves Luth credential rejection status instead of reporting a provider outage', async () => {
    globalThis.fetch = vi.fn(async () => new Response(
      JSON.stringify({ message: 'Invalid email or password' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;
    const result = await loginSystemUser('user@example.test', 'wrong-password', false, async () => ({ rows: [] }));
    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects application-local administrator login before contacting Luth', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    const result = await loginSystemUser('admin@example.test', 'password-not-real', true, async () => ({ rows: [] }));
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/Administrative authentication is not provided/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
