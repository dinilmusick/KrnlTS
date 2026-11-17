/**
 * @file cryptoVault.ts
 * @description AES-256-GCM Encrypted Workspace Vault Protocol.
 * Packed Envelope: [16B Salt][12B IV][16B AuthTag][Ciphertext]
 * File size strictly < 200 lines.
 */

import crypto from 'crypto';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH + TAG_LENGTH; // 44 bytes
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits

export function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

export function getDefaultWorkspaceSecret(userId: string, workspaceId: string): string {
  const masterEntropy = [process.env.SYSTEM_DATABASE_URL, process.env.SYSTEM_DATABASE_URL_2, process.env.SYSTEM_DATABASE_URL_3]
    .map((value) => String(value || '').trim())
    .find(Boolean);
  if (!masterEntropy) throw new Error('System database secret is required for workspace vault encryption.');
  const masterKey = crypto.createHmac('sha256', masterEntropy).update('srkl-workspace-vault:v1').digest('hex');
  return crypto.createHash('sha256').update(`${masterKey}:${userId}:${workspaceId}`).digest('hex');
}

export function encryptVaultBuffer(data: Buffer | Uint8Array, secret: string): Buffer {
  const rawBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]);
}

export function decryptVaultBuffer(envelope: Buffer | Uint8Array, secret: string): Buffer {
  const rawBuffer = Buffer.isBuffer(envelope) ? envelope : Buffer.from(envelope);
  if (rawBuffer.length < HEADER_LENGTH) {
    throw new Error(`Invalid encrypted vault payload: buffer too short (${rawBuffer.length} bytes)`);
  }

  const salt = rawBuffer.subarray(0, SALT_LENGTH);
  const iv = rawBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = rawBuffer.subarray(SALT_LENGTH + IV_LENGTH, HEADER_LENGTH);
  const ciphertext = rawBuffer.subarray(HEADER_LENGTH);

  const key = deriveKey(secret, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

export function isEncryptedVaultBuffer(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < HEADER_LENGTH) return false;
  // SQLite plaintext starts with "SQLite format 3\0"
  const headerStr = Buffer.from(buffer.slice(0, 16)).toString('utf-8');
  return !headerStr.startsWith('SQLite format 3');
}
/**
 * Existing encrypted vaults must never degrade into a new empty database.
 * A missing object is handled by the caller; a present but unreadable object
 * is a data-integrity failure and must stop the operation.
 */
export function decryptExistingVaultOrThrow(
  envelope: Buffer | Uint8Array,
  secret: string,
  source: 'cloud' | 'local',
): Buffer {
  try {
    if (!envelope || envelope.length === 0) {
      throw new Error('Encrypted vault payload is empty.');
    }
    const plaintext = decryptVaultBuffer(envelope, secret);
    const sqliteHeader = Buffer.from('SQLite format 3\0', 'utf8');
    if (plaintext.length < sqliteHeader.length || !plaintext.subarray(0, sqliteHeader.length).equals(sqliteHeader)) {
      throw new Error('Decrypted vault payload is not a SQLite database.');
    }
    return plaintext;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown decryption error';
    throw new Error(`Refusing to initialize an empty vault because the existing ${source} vault could not be decrypted: ${detail}`);
  }
}
