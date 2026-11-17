import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLuthSession } from './luthSession';

test('rejects identity strings that are not Luth bearer credentials', async () => {
  let calls = 0;
  const result = await verifyLuthSession('usr-attacker', async () => {
    calls++;
    return new Response('{}', { status: 200 });
  });
  assert.equal(result, null);
  assert.equal(calls, 0);
});

test('accepts only a user identity returned by the Luth session endpoint', async () => {
  let requestedUrl = '';
  let requestedHeaders: Headers | undefined;
  const result = await verifyLuthSession('Bearer canonical-luth-token', async (input, init) => {
    requestedUrl = String(input);
    requestedHeaders = new Headers(init?.headers);
    return new Response(JSON.stringify({
      authenticated: true,
      user: { id: 'luth-user-1', email: 'user@example.test', name: 'Verified User' },
    }), { status: 200 });
  });
  assert.equal(requestedUrl.endsWith('/api/session'), true);
  assert.equal(requestedHeaders?.get('authorization'), 'Bearer canonical-luth-token');
  assert.equal(requestedHeaders?.get('x-app-id'), 'srkl');
  assert.deepEqual(result, {
    authenticated: true,
    user: { id: 'luth-user-1', email: 'user@example.test', name: 'Verified User', image: null, emailVerified: false },
  });
});

test('rejects expired or malformed Luth sessions', async () => {
  const invalid = await verifyLuthSession('Bearer expired-token', async () =>
    new Response(JSON.stringify({ authenticated: false }), { status: 401 }),
  );
  const malformed = await verifyLuthSession('Bearer malformed-token', async () =>
    new Response(JSON.stringify({ authenticated: true, user: { id: '', email: '' } }), { status: 200 }),
  );
  assert.equal(invalid, null);
  assert.equal(malformed, null);
});
