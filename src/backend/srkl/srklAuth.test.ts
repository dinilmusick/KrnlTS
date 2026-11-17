import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLuthUserId } from './srklAuth.js';

test('does not resolve an identity without a Bearer session', async () => {
  let calls = 0;
  const resolver = async () => { calls += 1; return { id: 'user-1' }; };
  for (const header of [undefined, '', 'Basic abc', 'user-1', 'Bearer']) {
    assert.equal(await resolveLuthUserId(header, resolver), '');
  }
  assert.equal(calls, 0);
});

test('passes only the Bearer token to canonical Luth resolution', async () => {
  let received = '';
  const userId = await resolveLuthUserId('Bearer luth-session-token', async token => {
    received = token;
    return { id: ' user-42 ' };
  });
  assert.equal(received, 'luth-session-token');
  assert.equal(userId, 'user-42');
});

test('rejects a resolved principal without a usable canonical id', async () => {
  assert.equal(await resolveLuthUserId('Bearer invalid-session', async () => null), '');
  assert.equal(await resolveLuthUserId('Bearer invalid-session', async () => ({ id: 42 })), '');
  assert.equal(await resolveLuthUserId('Bearer invalid-session', async () => ({ id: '  ' })), '');
});

test('propagates canonical identity-service failures for an unavailable response', async () => {
  await assert.rejects(
    () => resolveLuthUserId('Bearer luth-session-token', async () => { throw new Error('Luth unavailable'); }),
    /Luth unavailable/,
  );
});
