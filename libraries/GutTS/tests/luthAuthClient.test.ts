import { afterEach, describe, expect, it, vi } from 'vitest';
import { LuthAuthClient, hydrateLuthTokenFromUrl, resolveClientOrigin, type LuthAuthTokenStore } from '../src/auth/luthAuthClient.js';
import { resolveServerRuntimeAppUrl } from '../src/server/auth.js';

function tokenStore(initial = ''): LuthAuthTokenStore {
  let token = initial;
  return {
    get: () => token,
    set: (value) => { token = value; },
    clear: () => { token = ''; },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('deployment origin resolution', () => {
  it('prefers an explicit origin over the Web location origin', () => {
    vi.stubEnv('APP_URL', 'https://env.example/path');
    vi.stubGlobal('location', { origin: 'https://browser.example' });
    expect(resolveClientOrigin('https://explicit.example/path')).toBe('https://explicit.example');
  });

  it('uses the Web location origin when no explicit origin is supplied', () => {
    vi.stubGlobal('location', { origin: 'https://browser.example' });
    expect(resolveClientOrigin()).toBe('https://browser.example');
  });

  it('keeps Node APP_URL resolution in the explicit server adapter', () => {
    vi.stubEnv('APP_URL', 'https://app.example/path');
    expect(resolveClientOrigin()).toBe('');
    expect(resolveServerRuntimeAppUrl()).toBe('https://app.example/path');
  });

  it('returns an empty origin when no Web location is available', () => {
    vi.stubEnv('APP_URL', 'https://ignored.example');
    expect(resolveClientOrigin()).toBe('');
  });

  it('fails visibly when a non-browser client has no deployment origin', () => {
    vi.stubEnv('APP_URL', '');
    expect(() => new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      autoRegister: false,
    })).toThrow(/APPLICATION_ORIGIN_UNAVAILABLE/);
  });

  it('accepts a server-resolved APP_URL as an explicit origin during registration', async () => {
    vi.stubEnv('APP_URL', 'https://client.example/path');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      registered: true,
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      origin: 'https://client.example',
      environment: 'production',
      authenticationEnabled: true,
    }), { status: 200 }));
    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      origin: resolveServerRuntimeAppUrl(),
    });
    await client.register();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.origin).toBe('https://client.example');
    expect(body.environment).toBe('production');
  });
});

describe('LuthAuthClient', () => {
  it('captures the bearer token issued by Luth and sends it on later requests', async () => {
    const store = tokenStore();
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        registered: true,
        ecosystemId: 'ultrst-armada',
        applicationId: 'test',
        origin: 'https://test.example',
        environment: 'production',
        authenticationEnabled: true,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'u1', name: 'Test', email: 'test@example.com' },
        session: { id: 's1', userId: 'u1', expiresAt: new Date().toISOString() },
      }), { status: 200, headers: { 'set-auth-token': 'token-1' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'u1', name: 'Test', email: 'test@example.com' },
        session: { id: 's1', userId: 'u1', expiresAt: new Date().toISOString() },
      }), { status: 200 }));

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      origin: 'https://test.example',
      tokenStore: store,
    });

    await client.getSession();
    expect(store.get()).toBe('token-1');
    await client.getSession();

    const secondSessionRequest = fetchMock.mock.calls[2]?.[1];
    const headers = new Headers(secondSessionRequest?.headers);
    expect(headers.get('authorization')).toBe('Bearer token-1');
  });

  it('preserves complete JWT-shaped tokens in the default browser token store', async () => {
    const jwt = 'header.payload.signature';
    const values = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200, headers: { 'set-auth-token': jwt } }));
    const client = new LuthAuthClient({ ecosystemId: 'ultrst-armada', applicationId: 'test', origin: 'https://test.example', autoRegister: false });
    await client.signInWithEmail({ email: 'test@example.com', password: 'secret' });
    expect(new Headers(client.getAuthHeaders()).get('authorization')).toBe(`Bearer ${jwt}`);
  });

  it('hydrates an OAuth callback token from the URL and removes it from browser history', () => {
    const store = tokenStore();
    const replaceState = vi.fn();
    vi.stubGlobal('location', {
      href: 'http://localhost/?token=oauth-token&keep=1#workspace',
      origin: 'http://localhost',
      search: '?token=oauth-token&keep=1',
      pathname: '/',
      hash: '#workspace',
    });
    vi.stubGlobal('history', { replaceState });
    vi.stubGlobal('document', { title: 'Loky' });

    expect(hydrateLuthTokenFromUrl(store)).toBe(true);
    expect(store.get()).toBe('oauth-token');
    expect(replaceState).toHaveBeenCalledWith({}, 'Loky', '/?keep=1#workspace');

  });

  it('clears the token only after a successful sign-out and verifies invalidation', async () => {
    const store = tokenStore('token-1');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        registered: true,
        ecosystemId: 'ultrst-armada',
        applicationId: 'test',
        origin: 'https://test.example',
        environment: 'production',
        authenticationEnabled: true,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: false, error: 'SESSION_INVALID' }), { status: 401 }));

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      origin: 'https://test.example',
      tokenStore: store,
    });

    await client.signOut();
    expect(store.get()).toBe('');
  });

  it('fails over to alternate Luth URL when primary deployment fails', async () => {
    const primaryUrl = 'https://luth-primary.internal';
    const secondaryUrl = 'https://luth-secondary.internal';

    const fetchMock = vi.spyOn(globalThis, 'fetch')
      // Primary fails with 503 Service Unavailable
      .mockResolvedValueOnce(new Response('Unavailable', { status: 503 }))
      // Secondary succeeds for registration
      .mockResolvedValueOnce(new Response(JSON.stringify({
        registered: true,
        ecosystemId: 'ultrst-armada',
        applicationId: 'test',
        origin: 'https://test.example',
        environment: 'production',
        authenticationEnabled: true,
      }), { status: 200 }))
      // Secondary succeeds for session
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'u2', name: 'Secondary User', email: 'sec@example.com' },
        session: { id: 's2', userId: 'u2', expiresAt: new Date().toISOString() },
      }), { status: 200 }));

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      luthUrls: [primaryUrl, secondaryUrl],
      origin: 'https://test.example',
      autoRegister: true,
    });

    const session = await client.getSession();
    expect(session.authenticated).toBe(true);
    expect(session.user?.id).toBe('u2');
    expect(client.luthUrl).toBe(secondaryUrl);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${primaryUrl}/api/registry/register`);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${secondaryUrl}/api/registry/register`);
  });

  it('round-robins healthy requests across the configured Luth pool', async () => {
    const urls = [
      'https://luth-one.internal',
      'https://luth-two.internal',
      'https://luth-three.internal',
    ];
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      return new Response(JSON.stringify({
        authenticated: true,
        user: { id: url.includes('one') ? 'u1' : url.includes('two') ? 'u2' : 'u3', name: 'User', email: 'user@example.com' },
        session: { id: 's1', userId: 'u1', expiresAt: new Date().toISOString() },
      }), { status: 200 });
    });

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      luthUrls: urls,
      origin: 'https://test.example',
      autoRegister: false,
    });

    await client.getSession();
    await client.getSession();
    await client.getSession();
    await client.getSession();

    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://luth-one.internal/api/session',
      'https://luth-two.internal/api/session',
      'https://luth-three.internal/api/session',
      'https://luth-one.internal/api/session',
    ]);
  });

  it('times out a stalled Luth deployment and fails over to the next deployment', async () => {
    const primaryUrl = 'https://luth-stalled.internal';
    const secondaryUrl = 'https://luth-healthy.internal';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (String(input).startsWith(primaryUrl)) {
        return new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason || new Error('aborted')), { once: true });
        });
      }
      return Promise.resolve(new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'u-timeout', name: 'Healthy', email: 'healthy@example.com' },
        session: { id: 's-timeout', userId: 'u-timeout', expiresAt: new Date().toISOString() },
      }), { status: 200 }));
    });

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      luthUrls: [primaryUrl, secondaryUrl],
      origin: 'https://test.example',
      autoRegister: false,
      timeoutMs: 5,
    });

    const session = await client.getSession();

    expect(session.authenticated).toBe(true);
    expect(client.luthUrl).toBe(secondaryUrl);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://luth-stalled.internal/api/session',
      'https://luth-healthy.internal/api/session',
    ]);
  });

  it('resolves dynamic Luth URLs using luthUrlResolver', async () => {
    const dynamicUrl = 'https://luth-discovered.internal';
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        authenticated: true,
        user: { id: 'u3', name: 'Discovered', email: 'disc@example.com' },
        session: { id: 's3', userId: 'u3', expiresAt: new Date().toISOString() },
      }), { status: 200 }));

    const client = new LuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'test',
      luthUrlResolver: async () => [dynamicUrl],
      origin: 'https://test.example',
      autoRegister: false,
    });

    const session = await client.getSession();
    expect(session.authenticated).toBe(true);
    expect(client.luthUrls).toContain(dynamicUrl);
  });
});

