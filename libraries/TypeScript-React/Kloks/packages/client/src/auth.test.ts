import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CanonicalAuthClient,
  DEFAULT_LUTH_URL,
  LuthAuthClient,
  createCanonicalAuthClient,
  createLuthAuthClient,
} from './auth.js';

describe('Kloks public canonical auth entrypoint', () => {
  it('exports the shared GutTS client and compatibility aliases', () => {
    expect(DEFAULT_LUTH_URL).toMatch(/^https:\/\//);
    expect(createCanonicalAuthClient).toBe(createLuthAuthClient);
    expect(CanonicalAuthClient).toBe(LuthAuthClient);
  });

  it('creates a client with the canonical Luth authority', () => {
    const client = createLuthAuthClient({
      ecosystemId: 'ultrst-armada',
      applicationId: 'kloks-auth-contract-test',
      origin: 'https://example.test',
      autoRegister: false,
    });
    expect(client.luthUrl).toBe(DEFAULT_LUTH_URL);
    expect(client.applicationId).toBe('kloks-auth-contract-test');
    expect(typeof client.getSession).toBe('function');
    expect(typeof client.signOut).toBe('function');
  });

  it('exports universal Luth guard and canonical public routes', async () => {
    const { CANONICAL_PUBLIC_ROUTES, isPublicRoute, extractLuthToken, verifyLuthRequest } = await import('./auth.js');
    expect(Array.isArray(CANONICAL_PUBLIC_ROUTES)).toBe(true);
    expect(isPublicRoute('/api/health')).toBe(true);
    expect(isPublicRoute('/health')).toBe(true);
    expect(isPublicRoute('/api/v1/auth/me')).toBe(true);
    expect(isPublicRoute('/api/v1/workspaces/ws-1')).toBe(false);

    const publicReq = new Request('https://aiko.test/api/health');
    const publicResult = await verifyLuthRequest(publicReq);
    expect(publicResult).toBeNull();

    const protectedReq = new Request('https://aiko.test/api/v1/workspaces/ws-1');
    const protectedResult = await verifyLuthRequest(protectedReq);
    expect(protectedResult instanceof Response).toBe(true);
    expect((protectedResult as Response).status).toBe(401);
  });

  it('extracts token across Bearer, x-api-key, Better-Auth cookies, and luth_session', async () => {
    const { extractLuthToken } = await import('./auth.js');
    expect(extractLuthToken(new Request('https://a.test', { headers: { authorization: 'Bearer token-1' } }))).toBe('token-1');
    expect(extractLuthToken(new Request('https://a.test', { headers: { 'x-api-key': 'key-2' } }))).toBe('key-2');
    expect(extractLuthToken(new Request('https://a.test', { headers: { cookie: 'better-auth.session_token=ba-token' } }))).toBe('ba-token');
    expect(extractLuthToken(new Request('https://a.test', { headers: { cookie: '__Secure-better-auth.session_token=sec-token' } }))).toBe('sec-token');
    expect(extractLuthToken(new Request('https://a.test', { headers: { cookie: 'luth_session=ls-token' } }))).toBe('ls-token');
  });

  it('formats unauthenticated MCP requests as JSON-RPC 2.0 error', async () => {
    const { verifyLuthRequest } = await import('./auth.js');
    const mcpReq = new Request('https://aiko.test/api/mcp', { method: 'POST' });
    const res = await verifyLuthRequest(mcpReq);
    expect(res instanceof Response).toBe(true);
    expect((res as Response).status).toBe(401);
    const body = await (res as Response).json();
    expect(body.jsonrpc).toBe('2.0');
    expect(body.error?.code).toBe(-32001);
    expect(body.error?.message).toBe('A verified Luth session is required.');
  });
});

describe('createUniversalAuthFetch shared transport contract', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('injects canonical headers and defaults credentials to include', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const { createUniversalAuthFetch } = await import('./auth.js');
    const authFetch = createUniversalAuthFetch({ getAuthHeaders: () => ({ Authorization: 'Bearer luth-token', 'X-Luth-App': 'aiko' }) });
    await authFetch('/api/private', { headers: { 'X-Trace-Id': 'trace-1' } });
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer luth-token');
    expect(headers.get('x-luth-app')).toBe('aiko');
    expect(headers.get('x-trace-id')).toBe('trace-1');
    expect(init?.credentials).toBe('include');
  });

  it('preserves caller Authorization and caller-supplied headers', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const { createUniversalAuthFetch } = await import('./auth.js');
    const authFetch = createUniversalAuthFetch({ getAuthHeaders: () => ({ Authorization: 'Bearer canonical-token' }) });
    const requestHeaders = new Headers({ 'X-Trace-Id': 'immutable' });
    await authFetch('/api/private', { headers: requestHeaders, credentials: 'same-origin' });
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer canonical-token');
    expect(new Headers(init?.headers).get('x-trace-id')).toBe('immutable');
    expect(init?.credentials).toBe('same-origin');
    expect(requestHeaders.has('authorization')).toBe(false);
  });

  it('merges Request input headers with init and canonical headers', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);
    const { createUniversalAuthFetch } = await import('./auth.js');
    const authFetch = createUniversalAuthFetch({ getAuthHeaders: () => ({ Authorization: 'Bearer luth-token' }) });
    const request = new Request('https://example.test/api/private', { headers: { 'X-From-Request': 'request' } });
    await authFetch(request, { headers: { 'X-From-Init': 'init' } });
    const [, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get('x-from-request')).toBe('request');
    expect(headers.get('x-from-init')).toBe('init');
    expect(headers.get('authorization')).toBe('Bearer luth-token');
  });
});
