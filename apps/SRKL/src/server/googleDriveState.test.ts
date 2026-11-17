import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeGoogleDriveState,
  encodeGoogleDriveState,
  isSafeGoogleDriveReturnUrl,
  matchesGoogleDriveStateNonce,
} from './googleDriveState';

const secret = 'a'.repeat(48);
const origin = 'https://srkl.example.test';

test('Google Drive OAuth state round-trips a signed user, same-origin return path and nonce', () => {
  const encoded = encodeGoogleDriveState(secret, 'luth-user-1', '/workspace/storage', origin, 1_000, 'n'.repeat(43));
  const decoded = decodeGoogleDriveState(secret, encoded.state, origin, 2_000);
  assert.deepEqual(decoded, { userId: 'luth-user-1', returnTo: '/workspace/storage', nonce: 'n'.repeat(43) });
  assert.equal(matchesGoogleDriveStateNonce(encoded.nonce, decoded.nonce), true);
});

test('rejects tampered signatures, malformed state and expired state', () => {
  const encoded = encodeGoogleDriveState(secret, 'luth-user-1', '/', origin, 1_000, 'n'.repeat(43));
  const [payload, signature] = encoded.state.split('.');
  const tampered = Buffer.from(JSON.stringify({ userId: 'attacker', returnTo: '/', nonce: 'n'.repeat(43), exp: 601_000 })).toString('base64url');
  assert.throws(() => decodeGoogleDriveState(secret, `${tampered}.${signature}`, origin, 2_000), /signature/i);
  assert.throws(() => decodeGoogleDriveState(secret, encoded.state, origin, 601_000), /expired/i);
  assert.throws(() => decodeGoogleDriveState(secret, 'not-a-state', origin), /invalid/i);
});

test('rejects external and protocol-relative return URLs', () => {
  assert.equal(isSafeGoogleDriveReturnUrl('https://attacker.example/path', origin), false);
  assert.equal(isSafeGoogleDriveReturnUrl('//attacker.example/path', origin), false);
  const encoded = encodeGoogleDriveState(secret, 'luth-user-1', 'https://attacker.example', origin);
  assert.equal(encoded.returnTo, '/');
  assert.equal(decodeGoogleDriveState(secret, encoded.state, origin).returnTo, '/');
});

test('rejects a nonce from a different initiating browser session', () => {
  assert.equal(matchesGoogleDriveStateNonce('expected-nonce', 'other-nonce'), false);
  assert.equal(matchesGoogleDriveStateNonce('', 'other-nonce'), false);
});
