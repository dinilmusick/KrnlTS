import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptExistingVaultOrThrow, encryptVaultBuffer } from './cryptoVault';

test('existing encrypted vault bytes round-trip without changing payload', () => {
  const plaintext = Buffer.from('SQLite format 3\0preserved-vault-fixture');
  const encrypted = encryptVaultBuffer(plaintext, 'srkl-test-vault-secret');
  assert.deepEqual(decryptExistingVaultOrThrow(encrypted, 'srkl-test-vault-secret', 'local'), plaintext);
  assert.deepEqual(decryptExistingVaultOrThrow(encrypted, 'srkl-test-vault-secret', 'cloud'), plaintext);
});

test('corrupt or empty existing vaults fail closed instead of initializing an empty database', () => {
  const valid = encryptVaultBuffer(Buffer.from('SQLite format 3\0existing vault data'), 'srkl-test-vault-secret');
  const corrupted = Buffer.from(valid);
  corrupted[corrupted.length - 1] ^= 0xff;

  assert.throws(
    () => decryptExistingVaultOrThrow(corrupted, 'srkl-test-vault-secret', 'cloud'),
    /Refusing to initialize an empty vault because the existing cloud vault could not be decrypted/,
  );
  assert.throws(
    () => decryptExistingVaultOrThrow(Buffer.alloc(0), 'srkl-test-vault-secret', 'local'),
    /existing local vault could not be decrypted/,
  );
  assert.throws(
    () => decryptExistingVaultOrThrow(valid, 'wrong-secret', 'local'),
    /existing local vault could not be decrypted/,
  );
  const encryptedNonSqlite = encryptVaultBuffer(Buffer.from('not a SQLite database'), 'srkl-test-vault-secret');
  assert.throws(
    () => decryptExistingVaultOrThrow(encryptedNonSqlite, 'srkl-test-vault-secret', 'local'),
    /Decrypted vault payload is not a SQLite database/,
  );
});
