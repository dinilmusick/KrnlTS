/**
 * @file credentialVaultCore.ts
 * @description Universal Workspace-Scoped Credential Vault.
 * AES-256-GCM + PBKDF2 Web Crypto, non-sensitive manifest.json + encrypted secrets/*.bin (< 200 lines).
 */

import { readWorkspaceFile, writeWorkspaceFile, deleteWorkspaceFile } from './workspaceFileCore';

export interface CredentialEntry {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CredentialManifest {
  version: 1;
  entries: CredentialEntry[];
}

const MANIFEST_PATH = 'credentials/manifest.json';
const SECRET_PREFIX = 'credentials/secrets';

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecretToBlob(plaintext: string | object, vaultKey: string): Promise<Uint8Array> {
  const str = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(vaultKey, salt);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(str));
  const blob = new Uint8Array(1 + 16 + 12 + cipherBuffer.byteLength);
  blob[0] = 0x01;
  blob.set(salt, 1);
  blob.set(iv, 1 + 16);
  blob.set(new Uint8Array(cipherBuffer), 1 + 16 + 12);
  return blob;
}

export async function decryptSecretFromBlob(blob: Uint8Array, vaultKey: string): Promise<any> {
  if (blob.length < 1 + 16 + 12 + 16 || blob[0] !== 0x01) {
    throw new Error('Invalid or corrupted credential vault blob.');
  }
  const salt = blob.slice(1, 17);
  const iv = blob.slice(17, 29);
  const ciphertext = blob.slice(29);
  const key = await deriveAesKey(vaultKey, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  const text = new TextDecoder().decode(decrypted);
  try { return JSON.parse(text); } catch { return text; }
}

export async function loadCredentialManifest(workspace: any, connection: any): Promise<CredentialManifest> {
  const data = await readWorkspaceFile(workspace, connection, MANIFEST_PATH);
  if (!data) return { version: 1, entries: [] };
  try { return JSON.parse(new TextDecoder().decode(data)); } catch { return { version: 1, entries: [] }; }
}

export async function saveCredentialManifest(workspace: any, connection: any, manifest: CredentialManifest): Promise<void> {
  await writeWorkspaceFile(workspace, connection, MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'application/json');
}

export async function listCredentials(workspace: any, connection: any): Promise<CredentialEntry[]> {
  const manifest = await loadCredentialManifest(workspace, connection);
  return manifest.entries;
}

export async function getCredential(workspace: any, connection: any, id: string, vaultKey: string): Promise<any> {
  const blob = await readWorkspaceFile(workspace, connection, `${SECRET_PREFIX}/${id}.bin`);
  if (!blob) throw new Error(`Credential ${id} not found.`);
  const decrypted = await decryptSecretFromBlob(blob, vaultKey);
  const manifest = await loadCredentialManifest(workspace, connection);
  const meta = manifest.entries.find((e) => e.id === id);
  return { id, name: meta?.name, type: meta?.type, metadata: meta?.metadata, secret: decrypted };
}

export async function createCredential(
  workspace: any,
  connection: any,
  payload: { id?: string; name: string; type: string; secret: any; metadata?: Record<string, unknown> },
  vaultKey: string
): Promise<CredentialEntry> {
  const id = payload.id || `cred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const blob = await encryptSecretToBlob(payload.secret, vaultKey);
  await writeWorkspaceFile(workspace, connection, `${SECRET_PREFIX}/${id}.bin`, blob, 'application/octet-stream');

  const manifest = await loadCredentialManifest(workspace, connection);
  const entry: CredentialEntry = {
    id,
    name: payload.name,
    type: payload.type || 'generic',
    createdAt: now,
    updatedAt: now,
    metadata: payload.metadata || {},
  };
  manifest.entries = manifest.entries.filter((e) => e.id !== id).concat(entry);
  await saveCredentialManifest(workspace, connection, manifest);
  return entry;
}

export async function updateCredential(
  workspace: any,
  connection: any,
  id: string,
  payload: { name?: string; type?: string; secret?: any; metadata?: Record<string, unknown> },
  vaultKey: string
): Promise<CredentialEntry> {
  const manifest = await loadCredentialManifest(workspace, connection);
  const entry = manifest.entries.find((e) => e.id === id);
  if (!entry) throw new Error(`Credential ${id} not found.`);

  if (payload.secret !== undefined) {
    const blob = await encryptSecretToBlob(payload.secret, vaultKey);
    await writeWorkspaceFile(workspace, connection, `${SECRET_PREFIX}/${id}.bin`, blob, 'application/octet-stream');
  }

  if (payload.name) entry.name = payload.name;
  if (payload.type) entry.type = payload.type;
  if (payload.metadata) entry.metadata = { ...entry.metadata, ...payload.metadata };
  entry.updatedAt = new Date().toISOString();

  await saveCredentialManifest(workspace, connection, manifest);
  return entry;
}

export async function deleteCredential(workspace: any, connection: any, id: string): Promise<boolean> {
  await deleteWorkspaceFile(workspace, connection, `${SECRET_PREFIX}/${id}.bin`);
  const manifest = await loadCredentialManifest(workspace, connection);
  manifest.entries = manifest.entries.filter((e) => e.id !== id);
  await saveCredentialManifest(workspace, connection, manifest);
  return true;
}

export async function exportEncryptedCredentials(
  workspace: any,
  connection: any,
  ids: string[],
  exportKey: string,
  vaultKey: string
): Promise<{ exportVersion: 1; timestamp: string; package: string }> {
  const manifest = await loadCredentialManifest(workspace, connection);
  const targets = manifest.entries.filter((e) => ids.includes(e.id));
  const decryptedItems: any[] = [];
  for (const entry of targets) {
    const cred = await getCredential(workspace, connection, entry.id, vaultKey);
    decryptedItems.push(cred);
  }
  const blob = await encryptSecretToBlob({ manifestEntries: targets, items: decryptedItems }, exportKey);
  const b64 = Buffer.from(blob).toString('base64');
  return { exportVersion: 1, timestamp: new Date().toISOString(), package: b64 };
}

export async function importEncryptedCredentials(
  workspace: any,
  connection: any,
  packageB64: string,
  exportKey: string,
  vaultKey: string
): Promise<CredentialEntry[]> {
  const blob = new Uint8Array(Buffer.from(packageB64, 'base64'));
  const payload = await decryptSecretFromBlob(blob, exportKey);
  const items = payload.items || [];
  const importedEntries: CredentialEntry[] = [];
  for (const item of items) {
    const entry = await createCredential(
      workspace,
      connection,
      { id: item.id, name: item.name, type: item.type, secret: item.secret, metadata: item.metadata },
      vaultKey
    );
    importedEntries.push(entry);
  }
  return importedEntries;
}
