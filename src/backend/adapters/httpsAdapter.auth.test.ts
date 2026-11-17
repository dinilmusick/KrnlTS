import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchHandler } from './httpsAdapter.js';

const auth = {
  resolveUserFromToken: async (token: string) => token === 'valid-session' ? { id: 'user-one', role: 'user' } : null,
  listWorkspaces: async (userId: string) => userId === 'user-one' ? [{ id: 'workspace-one' }] : [],
};

describe('Aiko canonical Luth HTTP boundary', () => {
  it('rejects operational routes without a verified Luth session', async () => {
    for (const path of [
      '/api/v1/keys', '/api/v1/keys/export', '/api/v1/command', '/api/v1/presets',
      '/api/v1/models/refresh', '/api/v1/module/resolve-intelligence',
      '/api/v1/workspaces/workspace-one/workflows',
      '/api/v1/workspaces/workspace-one/workflows/workflow-one/tool-execute',
      '/api/v1/module/runtime/nodes',
    ]) {
      const response = await fetchHandler(new Request('https://aiko.example.test' + path), {}, auth);
      assert.equal(response.status, 401, path);
    }
  });

  it('accepts a verified Luth principal and enforces workspace ownership', async () => {
    const providers = await fetchHandler(new Request('https://aiko.example.test/api/v1/runtime/providers', { headers: { authorization: 'Bearer valid-session' } }), {}, auth);
    assert.equal(providers.status, 200);
    const denied = await fetchHandler(new Request('https://aiko.example.test/api/v1/workspaces/workspace-two/workflows', { headers: { authorization: 'Bearer valid-session' } }), {}, auth);
    assert.equal(denied.status, 403);
    const allowed = await fetchHandler(new Request('https://aiko.example.test/api/v1/workspaces/workspace-one/workflows', { headers: { authorization: 'Bearer valid-session' } }), {}, auth);
    assert.equal(allowed.status, 200);
    const invalid = await fetchHandler(new Request('https://aiko.example.test/api/v1/runtime/providers', { headers: { authorization: 'Bearer invalid-session' } }), {}, auth);
    assert.equal(invalid.status, 401);
  });

  it('allows admin-only preset mutation only for administrator principals', async () => {
    const user = await fetchHandler(new Request('https://aiko.example.test/api/v1/presets', { method: 'POST', headers: { authorization: 'Bearer valid-session', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Not allowed' }) }), {}, auth);
    assert.equal(user.status, 403);
    const adminAuth = { resolveUserFromToken: async () => ({ id: 'admin', role: 'admin' }), listWorkspaces: async () => [{ id: 'workspace-one' }] };
    const admin = await fetchHandler(new Request('https://aiko.example.test/api/v1/presets', { method: 'POST', headers: { authorization: 'Bearer valid-session', 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Allowed', sigilId: 'test', tensor: [] }) }), {}, adminAuth);
    assert.notEqual(admin.status, 401);
  });

  it('accepts the HttpOnly Luth cookie as the session transport', async () => {
    const response = await fetchHandler(new Request('https://aiko.example.test/api/v1/runtime/providers', { headers: { cookie: 'luth_session=valid-session' } }), {}, auth);
    assert.equal(response.status, 200);
  });

  it('keeps health and discovery endpoints public', async () => {
    assert.equal((await fetchHandler(new Request('https://aiko.example.test/api/health'))).status, 200);
    assert.equal((await fetchHandler(new Request('https://aiko.example.test/api/v1/providers'))).status, 200);
  });
});
