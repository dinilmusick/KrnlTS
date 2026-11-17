// ══════════════════════════════════════════════════════════════════════════════
// SRKL CRYPTO CLIENT (WEB CRYPTO API AES-256-GCM)
// Envelope: [16B Salt][12B IV][16B AuthTag][Ciphertext]
// ══════════════════════════════════════════════════════════════════════════════

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH + TAG_LENGTH; // 44 bytes
const PBKDF2_ITERATIONS = 100000;

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Decrypt an AES-256-GCM vault envelope in browser memory using Web Crypto API.
 */
export async function decryptVaultBufferInBrowser(
  envelopeBuffer: ArrayBuffer | Uint8Array,
  secretHex: string
): Promise<Uint8Array> {
  const rawBytes = envelopeBuffer instanceof Uint8Array 
    ? envelopeBuffer 
    : new Uint8Array(envelopeBuffer);

  if (rawBytes.length < HEADER_LENGTH) {
    throw new Error(`Invalid encrypted vault payload: buffer too short (${rawBytes.length} bytes)`);
  }

  // 1. Unpack Header [Salt 16B][IV 12B][AuthTag 16B][Ciphertext...]
  const salt = rawBytes.slice(0, SALT_LENGTH);
  const iv = rawBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = rawBytes.slice(SALT_LENGTH + IV_LENGTH, HEADER_LENGTH);
  const ciphertext = rawBytes.slice(HEADER_LENGTH);

  // Web Crypto expects ciphertext + tag appended together for AES-GCM
  const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextWithTag.set(ciphertext, 0);
  ciphertextWithTag.set(authTag, ciphertext.length);

  // 2. Import base password/secret
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
  }

  const rawSecretBytes = new TextEncoder().encode(secretHex);
  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    rawSecretBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 3. Derive AES-256-GCM key matching SRKL server's pbkdf2Sync(secret, salt, 100000, 32, 'sha256')
  const aesKey = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 4. Decrypt in memory
  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128,
    },
    aesKey,
    ciphertextWithTag
  );

  return new Uint8Array(decryptedBuffer);
}
