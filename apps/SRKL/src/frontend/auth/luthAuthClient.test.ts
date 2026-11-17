import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { luthAuthClient, luthFetch } from './luthAuthClient';

const originalFetch = globalThis.fetch;
const originalGetAuthHeaders = luthAuthClient.getAuthHeaders;
after(() => {
  globalThis.fetch = originalFetch;
  luthAuthClient.getAuthHeaders = originalGetAuthHeaders;
});

test('Luth transport overwrites caller authorization and preserves request headers', async () => {
  luthAuthClient.getAuthHeaders = () => ({ Authorization: 'Bearer canonical-luth-token' });
  let captured: RequestInit | undefined;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    captured = init;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  await luthFetch('/api/private', {
    headers: { Authorization: 'Bearer caller-controlled-token', 'x-test': '1' },
  });

  const headers = new Headers(captured?.headers);
  assert.equal(headers.get('authorization'), 'Bearer canonical-luth-token');
  assert.equal(headers.get('x-test'), '1');
  assert.equal(captured?.credentials, 'include');
  assert.equal(captured?.cache, 'no-store');
});
