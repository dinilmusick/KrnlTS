import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeEcosystemAccess,
  authenticateRequest,
  setWorkspaceResolverForTesting,
  isAuthorizedAppForCredentials,
  setAppAuthorizationLookupForTesting,
} from '../../src/server/routes/ecosystemAuthHelper.js';
import { sanitizeCredentials } from '../../src/server/routes/ecosystemAccountResolver.js';
import { setVerifiedPrincipal } from '../../src/server/luthSession.js';
import { requireAdmin } from '../../src/server/routes/admin.js';

function verifiedRequest(userId: string, headers: Record<string, string> = {}, query: Record<string, unknown> = {}, body: Record<string, unknown> = {}) {
  const req: any = { headers, query, body };
  setVerifiedPrincipal(req, { id: userId, email: `${userId}@example.test`, role: 'user' });
  return req;
}

describe('SRKL Luth identity and ecosystem authorization', () => {
  before(() => {
    setWorkspaceResolverForTesting(async (userId: string) => {
      if (userId === 'usr_alice') return { workspaces: [{ id: 'ws_alice_main' }], activeWorkspaceId: 'ws_alice_main' };
      if (userId === 'usr_bob') return { workspaces: [{ id: 'ws_bob_main' }], activeWorkspaceId: 'ws_bob_main' };
      return null;
    });
    setAppAuthorizationLookupForTesting(async () => ({ rows: [] }));
  });
  after(() => {
    setWorkspaceResolverForTesting(null);
    setAppAuthorizationLookupForTesting(null);
  });

  it('rejects requests without identity injected by the Luth verification middleware', async () => {
    const req: any = { headers: { authorization: 'Bearer fake-local-token' }, query: {}, body: {} };
    assert.equal(authenticateRequest(req), null);
    const decision = await authorizeEcosystemAccess(req, { appId: 'depm', includeCredentials: true });
    assert.equal(decision.statusCode, 401);
    assert.equal(decision.includeCredentials, false);
  });

  it('uses only the verified request identity, never caller-supplied user IDs', async () => {
    const req = verifiedRequest('usr_alice', { 'x-user-id': 'usr_forged', 'x-app-id': 'depm' }, { userId: 'usr_bob' });
    const decision = await authorizeEcosystemAccess(req, { appId: 'depm', includeCredentials: true });
    assert.equal(decision.statusCode, 403);
    assert.equal(decision.includeCredentials, false);
    assert.match(decision.error || '', /cannot access accounts for requested user/);
  });

  it('denies cross-user workspace access for a verified principal', async () => {
    const req = verifiedRequest('usr_alice', { 'x-user-id': 'usr_forged', 'x-app-id': 'depm' });
    const decision = await authorizeEcosystemAccess(req, { appId: 'depm', includeCredentials: true }, 'ws_bob_main');
    assert.equal(decision.statusCode, 403);
    assert.equal(decision.includeCredentials, false);
    assert.match(decision.error || '', /workspace does not belong/);
  });

  it('allows only active registry applications to receive privileged credentials', async () => {
    setAppAuthorizationLookupForTesting(async () => ({ rows: [{ app_id: 'aiko', status: 'active' }] }));
    assert.equal(await isAuthorizedAppForCredentials('aiko'), true);
    setAppAuthorizationLookupForTesting(async () => ({ rows: [{ app_id: 'aiko', status: 'disabled' }] }));
    assert.equal(await isAuthorizedAppForCredentials('aiko'), false);
    setAppAuthorizationLookupForTesting(async () => ({ rows: [] }));
    assert.equal(await isAuthorizedAppForCredentials('unknown-app'), false);
  });

  it('fails closed when the canonical app registry is unavailable', async () => {
    setAppAuthorizationLookupForTesting(async () => { throw new Error('registry unavailable'); });
    assert.equal(await isAuthorizedAppForCredentials('aiko'), false);
  });

  it('grants admin access only to a server-verified SRKL admin principal', () => {
    const invoke = (req: any) => {
      let statusCode = 200;
      let nextCalled = false;
      const res: any = {
        status(code: number) { statusCode = code; return this; },
        json() { return this; },
      };
      requireAdmin(req, res, () => { nextCalled = true; });
      return { statusCode, nextCalled };
    };

    assert.deepEqual(invoke({ headers: { 'x-user-role': 'admin' } }), { statusCode: 403, nextCalled: false });
    const adminRequest: any = { headers: { 'x-user-role': 'user' } };
    setVerifiedPrincipal(adminRequest, { id: 'luth-admin-1', email: 'admin@example.test', role: 'admin' });
    assert.deepEqual(invoke(adminRequest), { statusCode: 200, nextCalled: true });
  });

  it('sanitizes credentials for presentation-only access', () => {
    const safe = sanitizeCredentials({ apiKey: 'secret-value', endpoint: 'https://api.example.com' });
    assert.equal(safe.apiKey, '••••••••');
    assert.equal(safe.endpoint, 'https://api.example.com');
  });

  it('does not accept local tokens, cookies or the legacy usr-admin bypass as identity', () => {
    for (const headers of [
      { authorization: 'Bearer sess::usr_alice::sess_123' },
      { 'x-session-token': 'sess::usr_alice::sess_123' },
      { cookie: 'srkl_access_token=sess%3A%3Ausr_alice%3A%3Asess_123' },
      { authorization: 'Bearer usr-admin' },
    ]) assert.equal(authenticateRequest({ headers } as any), null);
  });

  it('derives identity exclusively from the non-forgeable verified request principal', () => {
    assert.equal(authenticateRequest({ headers: { 'x-user-id': 'usr_alice' } } as any), null);
    const req = verifiedRequest('usr_alice', { 'x-user-id': 'usr_forged' });
    assert.deepEqual(authenticateRequest(req), { userId: 'usr_alice' });
  });
});
