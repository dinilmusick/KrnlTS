/**
 * @file storageConnectionCore.ts
 * @description Fetch-native user storage connection registry.
 *
 * User-owned connection records remain compatible with the existing
 * app_profiles.srkl.storage_connections shape. Secrets are read only by
 * server-side operations; all list/create/test results use an allow-list
 * projection with opaque connection IDs.
 */

import { authorizeB2, b2ListBuckets } from '../storage/B2DirectClient.js';
import {
  GOOGLE_DRIVE_WORKSPACE_SCOPE,
  GoogleDriveWorkspaceService,
  type GoogleDriveWorkspaceFolder,
  type GoogleDriveWorkspaceTokens,
} from '../storage/GoogleDriveWorkspaceService.js';
import { queryUnifiedDb } from './unifiedDb.js';
import { getGoogleDriveOAuthConfiguration, getOrCreateStorageConnectionEncryptionKey, getStorageConnectionEncryptionKey } from './systemCredentialsCore.js';

export type StorageProviderId = 'backblaze_b2' | 'google_drive';

export interface StorageProviderCapability {
  id: StorageProviderId;
  displayName: string;
  enabled: boolean;
  availabilityReason?: string;
  canSelectExistingConnection: boolean;
  canCreateConnection: boolean;
  requiredConfigurationFields: string[];
  authorizationMode: 'application_key' | 'oauth2';
  discoveryCapabilities: {
    accounts: boolean;
    buckets: boolean;
    folders: boolean;
  };
}

export interface PublicStorageConnection {
  id: string;
  provider: string;
  label: string;
  role?: 'primary' | 'redundant_clone';
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  testedAt?: string;
  testStatus?: string;
  latencyMs?: number;
  b2BucketName?: string;
  bucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;
  googleEmail?: string;
  googleAccountId?: string;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
}

type StorageQuery = (
  sql: string,
  params?: unknown[],
) => Promise<{ rows: Array<Record<string, any>> }>;

const DEFAULT_QUERY: StorageQuery = (sql, params) => queryUnifiedDb(sql, params);

const PUBLIC_FIELDS = [
  'id',
  'provider',
  'label',
  'role',
  'enabled',
  'createdAt',
  'updatedAt',
  'testedAt',
  'testStatus',
  'latencyMs',
  'b2BucketName',
  'bucketName',
  'b2Region',
  'b2Endpoint',
  'googleEmail',
  'googleAccountId',
  'googleRootFolderId',
  'googleRootFolderName',
] as const;

function mergeProfileDocuments(primary: any, legacy: any): any {
  if (Array.isArray(primary) && Array.isArray(legacy)) {
    const primaryHasIds = primary.every((item) => item && typeof item === 'object' && typeof item.id === 'string');
    const legacyHasIds = legacy.every((item) => item && typeof item === 'object' && typeof item.id === 'string');
    if (primaryHasIds && legacyHasIds) {
      const merged = new Map<string, any>(primary.map((item) => [item.id, item]));
      for (const item of legacy) {
        const existing = merged.get(item.id);
        merged.set(item.id, existing ? mergeProfileDocuments(existing, item) : item);
      }
      return [...merged.values()];
    }
    const merged = [...primary];
    const seen = new Set(primary.map((item) => JSON.stringify(item)));
    for (const item of legacy) {
      const key = JSON.stringify(item);
      if (!seen.has(key)) {
        merged.push(item);
        seen.add(key);
      }
    }
    return merged;
  }
  if (
    primary && typeof primary === 'object'
    && !Array.isArray(primary)
    && legacy && typeof legacy === 'object'
    && !Array.isArray(legacy)
  ) {
    const merged: Record<string, any> = { ...legacy, ...primary };
    for (const key of Object.keys(legacy)) {
      if (Object.prototype.hasOwnProperty.call(primary, key)) {
        merged[key] = mergeProfileDocuments(primary[key], legacy[key]);
      }
    }
    return merged;
  }
  return primary === undefined ? legacy : primary;
}

function parseProfiles(value: unknown): Record<string, any> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' ? value as Record<string, any> : {};
}

const STORAGE_SECRET_FIELDS = [
  'b2KeyId',
  'b2ApplicationKey',
  'keyId',
  'applicationKey',
  'appKey',
  'accessKeyId',
  'secretAccessKey',
  'googleAccessToken',
  'googleAccessTokenExpiresAt',
  'googleRefreshToken',
  'googleTokenType',
] as const;

function isMissingOptionalProfileTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown };
  if (candidate.code === '42P01' || candidate.code === 'PGRST205') return true;
  const message = typeof candidate.message === 'string' ? candidate.message : '';
  return /(?:relation|table).*(?:does not exist|not found)|schema cache.*(?:relation|table)/i.test(message);
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Storage connection secret envelope is malformed.');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Copy into an ArrayBuffer-owned view for modern Web Crypto BufferSource types. */
function toCryptoBufferSource(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function extractConnectionSecretPayload(connection: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const field of STORAGE_SECRET_FIELDS) {
    if (connection[field] !== undefined && connection[field] !== null && connection[field] !== '') {
      payload[field] = connection[field];
    }
  }
  if (connection.credentials && typeof connection.credentials === 'object') {
    payload.credentials = connection.credentials;
    const nested = connection.credentials;
    const aliases: Record<string, string[]> = {
      b2KeyId: ['b2KeyId', 'keyId'],
      b2ApplicationKey: ['b2ApplicationKey', 'applicationKey', 'appKey'],
      googleAccessToken: ['googleAccessToken', 'accessToken'],
      googleRefreshToken: ['googleRefreshToken', 'refreshToken'],
      googleAccessTokenExpiresAt: ['googleAccessTokenExpiresAt', 'expiresAt'],
    };
    for (const [target, candidates] of Object.entries(aliases)) {
      if (payload[target] !== undefined) continue;
      const key = candidates.find((candidate) => nested[candidate] !== undefined && nested[candidate] !== null);
      if (key) payload[target] = nested[key];
    }
  }
  return payload;
}

function hasConnectionSecrets(connection: Record<string, any>): boolean {
  return Object.keys(extractConnectionSecretPayload(connection)).length > 0;
}

async function encryptConnectionSecretPayload(
  userId: string,
  connection: Record<string, any>,
  payload: Record<string, any>,
  query: StorageQuery,
): Promise<Record<string, any>> {
  if (Object.keys(payload).length === 0) return connection;
  if (!connection.id || !connection.provider) {
    throw new Error('A storage connection ID and provider are required before encrypting its credentials.');
  }

  const wrappingKey = await getOrCreateStorageConnectionEncryptionKey(query);
  const key = await crypto.subtle.importKey(
    'raw',
    toCryptoBufferSource(decodeBase64Url(wrappingKey)),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = new TextEncoder().encode(
    'ultrst-storage-connection:v1:' + userId + ':' + connection.id + ':' + connection.provider,
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toCryptoBufferSource(iv), additionalData: toCryptoBufferSource(additionalData) },
    key,
    toCryptoBufferSource(new TextEncoder().encode(JSON.stringify(payload))),
  );

  const safe: Record<string, any> = { ...connection };
  for (const field of STORAGE_SECRET_FIELDS) delete safe[field];
  delete safe.credentials;
  safe.secretCiphertext = {
    version: 1,
    algorithm: 'AES-GCM-256',
    iv: encodeBase64Url(iv),
    ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
  };
  return safe;
}

async function hydrateConnectionSecrets(
  userId: string,
  connection: Record<string, any>,
  query: StorageQuery,
): Promise<Record<string, any>> {
  const envelope = connection.secretCiphertext;
  let payload: Record<string, any> = {};

  if (envelope !== undefined) {
    if (
      envelope?.version !== 1
      || envelope?.algorithm !== 'AES-GCM-256'
      || typeof envelope.iv !== 'string'
      || typeof envelope.ciphertext !== 'string'
    ) {
      throw new Error('The saved storage connection has an unsupported encrypted credential format.');
    }
    try {
      const wrappingKey = await getStorageConnectionEncryptionKey(query);
      const key = await crypto.subtle.importKey(
        'raw',
        toCryptoBufferSource(decodeBase64Url(wrappingKey)),
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );
      const additionalData = new TextEncoder().encode(
        'ultrst-storage-connection:v1:' + userId + ':' + connection.id + ':' + connection.provider,
      );
      const plaintext = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: toCryptoBufferSource(decodeBase64Url(envelope.iv)),
          additionalData: toCryptoBufferSource(additionalData),
        },
        key,
        toCryptoBufferSource(decodeBase64Url(envelope.ciphertext)),
      );
      const parsed = JSON.parse(new TextDecoder().decode(plaintext));
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid payload');
      payload = parsed;
    } catch (error) {
      // Preserve system key configuration failures so operators can distinguish
      // key loss/version drift from a ciphertext or AAD authentication failure.
      if (error instanceof Error && error.message.startsWith('[STORAGE_SECRET_CONFIGURATION_')) {
        throw error;
      }
      throw new Error('The saved storage connection credentials could not be decrypted with the current system key.');
    }
  }

  // Legacy plaintext formats are merged only in server memory. The profile
  // migration below rewrites them to the encrypted envelope before returning.
  payload = { ...payload, ...extractConnectionSecretPayload(connection) };
  const hydrated: Record<string, any> = { ...connection, ...payload };
  if (payload.credentials && typeof payload.credentials === 'object') {
    const nested = payload.credentials;
    hydrated.b2KeyId = hydrated.b2KeyId || nested.b2KeyId || nested.keyId;
    hydrated.b2ApplicationKey = hydrated.b2ApplicationKey || nested.b2ApplicationKey || nested.applicationKey || nested.appKey;
    hydrated.googleAccessToken = hydrated.googleAccessToken || nested.googleAccessToken || nested.accessToken;
    hydrated.googleRefreshToken = hydrated.googleRefreshToken || nested.googleRefreshToken || nested.refreshToken;
    hydrated.googleAccessTokenExpiresAt = hydrated.googleAccessTokenExpiresAt || nested.googleAccessTokenExpiresAt || nested.expiresAt;
  }
  return hydrated;
}

async function protectConnectionForStorage(
  userId: string,
  connection: Record<string, any>,
  query: StorageQuery,
): Promise<Record<string, any>> {
  const hydrated = await hydrateConnectionSecrets(userId, connection, query);
  const payload = extractConnectionSecretPayload(hydrated);
  if (Object.keys(payload).length === 0) return connection;
  return encryptConnectionSecretPayload(userId, hydrated, payload, query);
}

async function writeUserProfiles(
  record: { id: string; email?: string; profiles: Record<string, any>; source: 'ultrst-users' | 'srkl_application_profiles' },
  query: StorageQuery,
): Promise<void> {
  if (record.source === 'ultrst-users') {
    try {
      const legacy = await query(
        'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $2 LIMIT 1',
        [record.id, record.email || record.id],
      );
      if (legacy.rows[0]) {
        const legacyProfiles = parseProfiles(legacy.rows[0].app_profiles);
        const canonicalProfiles = record.profiles;
        const canonicalConnections = Array.isArray(canonicalProfiles.srkl?.storage_connections)
          ? canonicalProfiles.srkl.storage_connections
          : [];
        const legacyConnections = Array.isArray(legacyProfiles.srkl?.storage_connections)
          ? legacyProfiles.srkl.storage_connections
          : [];
        const byId = new Map<string, any>();
        for (const connection of legacyConnections) {
          if (connection && typeof connection.id === 'string') byId.set(connection.id, connection);
        }
        // Canonical records win when the same ID exists, but legacy-only IDs
        // are retained so a profile-store migration cannot orphan old accounts.
        for (const connection of canonicalConnections) {
          if (connection && typeof connection.id === 'string') byId.set(connection.id, connection);
        }
        if (!canonicalProfiles.srkl || typeof canonicalProfiles.srkl !== 'object') {
          canonicalProfiles.srkl = {};
        }
        canonicalProfiles.srkl.storage_connections = [...byId.values()];

        await query(
          'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2 OR email = $3',
          [JSON.stringify({
            ...legacyProfiles,
            srkl: {
              ...(legacyProfiles.srkl || {}),
              storage_connections: canonicalProfiles.srkl.storage_connections,
            },
          }), record.id, record.email || record.id],
        );
      }
    } catch (error) {
      if (!isMissingOptionalProfileTable(error)) throw error;
      // Only an absent compatibility table is optional; operational failures
      // must abort the profile write rather than silently lose legacy state.
    }
  }

  const table = record.source === 'ultrst-users' ? '"ultrst-users"' : '"srkl_application_profiles"';
  await query(
    'UPDATE ' + table + ' SET app_profiles = $1, updated_at = NOW() WHERE id = $2 OR email = $3',
    [JSON.stringify(record.profiles), record.id, record.email || record.id],
  );
}

async function migrateLegacyConnectionCollections(
  userId: string,
  query: StorageQuery,
): Promise<void> {
  const record = await findUserRecord(userId, query);
  if (!record) return;
  let changed = record.needsProfileMerge;

  for (const value of Object.values(record.profiles)) {
    if (!value || typeof value !== 'object') continue;
    const profile = value as Record<string, any>;
    if (!Array.isArray(profile.storage_connections)) continue;
    const secured: any[] = [];
    for (const connection of profile.storage_connections) {
      if (connection && typeof connection === 'object' && hasConnectionSecrets(connection)) {
        const next = await protectConnectionForStorage(record.id, connection, query);
        secured.push(next);
        if (next !== connection && !connection.secretCiphertext) changed = true;
      } else {
        secured.push(connection);
      }
    }
    if (changed) profile.storage_connections = secured;
  }

  if (record.source === 'ultrst-users') {
    try {
      const legacy = await query(
        'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $2 LIMIT 1',
        [record.id, record.email || record.id],
      );
      if (legacy.rows[0]) {
        const profiles = parseProfiles(legacy.rows[0].app_profiles);
        let legacyChanged = false;
        for (const value of Object.values(profiles)) {
          if (!value || typeof value !== 'object') continue;
          const profile = value as Record<string, any>;
          if (!Array.isArray(profile.storage_connections)) continue;
          const secured: any[] = [];
          for (const connection of profile.storage_connections) {
            if (connection && typeof connection === 'object' && hasConnectionSecrets(connection)) {
              const next = await protectConnectionForStorage(record.id, connection, query);
              secured.push(next);
              if (next !== connection && !connection.secretCiphertext) legacyChanged = true;
            } else {
              secured.push(connection);
            }
          }
          if (legacyChanged) profile.storage_connections = secured;
        }
        if (legacyChanged) {
          await query(
            'UPDATE "srkl_application_profiles" SET app_profiles = $1, updated_at = NOW() WHERE id = $2 OR email = $3',
            [JSON.stringify(profiles), record.id, record.email || record.id],
          );
        }
      }
    } catch (error) {
      if (!isMissingOptionalProfileTable(error)) throw error;
      // The legacy SRKL table is optional only when it is genuinely absent.
    }
  }

  if (changed) await writeUserProfiles(record, query);
}


function connectionCollections(profiles: Record<string, any>): any[][] {
  const collections: any[][] = [];
  const srklConnections = profiles.srkl?.storage_connections;
  if (Array.isArray(srklConnections)) collections.push(srklConnections);

  for (const [key, value] of Object.entries(profiles)) {
    if (key === 'srkl' || !value || typeof value !== 'object') continue;
    const connections = (value as Record<string, any>).storage_connections;
    if (Array.isArray(connections)) collections.push(connections);
  }
  return collections;
}

export function toPublicStorageConnection(raw: Record<string, any>): PublicStorageConnection | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id || typeof raw.provider !== 'string') return null;
  const safe: Record<string, unknown> = {};
  for (const key of PUBLIC_FIELDS) {
    const value = raw[key];
    if (value !== undefined && value !== null) safe[key] = value;
  }
  safe.label = String(raw.label || raw.name || raw.id);
  safe.enabled = raw.enabled !== false;
  return safe as unknown as PublicStorageConnection;
}

function deduplicateRawConnections(items: any[]): any[] {
  const byId = new Map<string, any>();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id) continue;
    const existing = byId.get(item.id);
    // Earlier collections are canonical; later legacy collections fill only
    // fields that are absent from the canonical connection.
    byId.set(item.id, existing ? { ...item, ...existing, id: existing.id } : item);
  }
  return [...byId.values()];
}

async function findUserRecord(userId: string, query: StorageQuery): Promise<{
  id: string;
  profiles: Record<string, any>;
  email?: string;
  source: 'ultrst-users' | 'srkl_application_profiles';
  needsProfileMerge: boolean;
} | null> {
  if (!userId?.trim()) return null;

  try {
    const result = await query(
      'SELECT id, email, app_profiles FROM "ultrst-users" WHERE id = $1 OR email = $1 LIMIT 1',
      [userId],
    );
    if (result.rows[0]) {
      const userId = String(result.rows[0].id);
      const canonicalProfiles = parseProfiles(result.rows[0].app_profiles);
      let profiles = canonicalProfiles;
      let needsProfileMerge = false;
      try {
        const legacy = await query(
          'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $2 LIMIT 1',
          [userId, String(result.rows[0].email || userId)],
        );
        if (legacy.rows[0]) {
          profiles = mergeProfileDocuments(profiles, parseProfiles(legacy.rows[0].app_profiles));
          needsProfileMerge = JSON.stringify(profiles) !== JSON.stringify(canonicalProfiles);
        }
      } catch (error) {
        if (!isMissingOptionalProfileTable(error)) throw error;
        // An absent legacy table is optional; operational failures are not.
      }
      return { id: userId, email: String(result.rows[0].email || '') || undefined, profiles, source: 'ultrst-users', needsProfileMerge };
    }
  } catch (error) {
    if (!isMissingOptionalProfileTable(error)) throw error;
    // Some older installations have the SRKL profile table before the
    // shared user profile is available. Keep that record shape readable.
  }

  try {
    const result = await query(
      'SELECT id, email, app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $1 LIMIT 1',
      [userId],
    );
    if (result.rows[0]) {
      return {
        id: String(result.rows[0].id),
        email: String(result.rows[0].email || '') || undefined,
        profiles: parseProfiles(result.rows[0].app_profiles),
        source: 'srkl_application_profiles',
        needsProfileMerge: false,
      };
    }
  } catch (error) {
    if (!isMissingOptionalProfileTable(error)) throw error;
    // SRKL is optional for applications that use the shared storage service.
  }
  return null;
}

async function mergeLegacySrklConnections(
  userId: string,
  profiles: Record<string, any>,
  query: StorageQuery,
  email?: string,
): Promise<any[]> {
  const local = connectionCollections(profiles).flat();
  try {
    const result = await query(
      'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $2 LIMIT 1',
      [userId, email || userId],
    );
    if (result.rows[0]) {
      const legacyProfiles = parseProfiles(result.rows[0].app_profiles);
      local.push(...(Array.isArray(legacyProfiles.srkl?.storage_connections)
        ? legacyProfiles.srkl.storage_connections
        : []));
    }
  } catch (error) {
    if (!isMissingOptionalProfileTable(error)) throw error;
    // Legacy table is intentionally optional after profile migration.
  }
  return deduplicateRawConnections(local);
}

/** Internal server-only connection resolution for storage engines; never expose through HTTP. */
export async function listUserStorageConnectionsWithSecrets(
  userId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<Record<string, any>[]> {
  await migrateLegacyConnectionCollections(userId, query);
  const record = await findUserRecord(userId, query);
  if (!record) return [];
  const raw = await mergeLegacySrklConnections(record.id, record.profiles, query, record.email);
  return Promise.all(raw.map((connection) => hydrateConnectionSecrets(record.id, connection, query)));
}

async function persistStorageConnectionCollection(
  userId: string,
  connections: Record<string, any>[],
  query: StorageQuery,
): Promise<void> {
  const record = await findUserRecord(userId, query);
  if (!record) throw new Error('A canonical user profile was not found for this storage connection.');

  const secured = await Promise.all(
    connections.map((connection) => protectConnectionForStorage(record.id, connection, query)),
  );
  const incoming = new Map(secured.map((connection) => [String(connection.id), connection]));
  const assigned = new Set<string>();
  const profiles = record.profiles;

  for (const value of Object.values(profiles)) {
    if (!value || typeof value !== 'object') continue;
    const profile = value as Record<string, any>;
    if (!Array.isArray(profile.storage_connections)) continue;
    profile.storage_connections = profile.storage_connections
      .map((current: any) => {
        const id = String(current?.id || '');
        const next = incoming.get(id);
        if (!next) return null;
        assigned.add(id);
        return next;
      })
      .filter(Boolean);
  }

  const unassigned = secured.filter((connection) => !assigned.has(String(connection.id)));
  if (unassigned.length) {
    if (!profiles.srkl || typeof profiles.srkl !== 'object') profiles.srkl = {};
    const existing = Array.isArray(profiles.srkl.storage_connections)
      ? profiles.srkl.storage_connections
      : [];
    const byId = new Map(existing.map((connection: any) => [String(connection?.id || ''), connection]));
    for (const connection of unassigned) byId.set(String(connection.id), connection);
    profiles.srkl.storage_connections = [...byId.values()];
  }

  await writeUserProfiles(record, query);
}

/** Set the primary marker/** Set the primary marker without changing an existing workspace's explicit association. */
export async function setPrimaryUserStorageConnection(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection[]> {
  const connections = await listUserStorageConnectionsWithSecrets(userId, query);
  if (!connections.some((connection) => connection.id === connectionId)) {
    throw new Error('Storage connection was not found for this user.');
  }
  const updated = connections.map((connection) => ({
    ...connection,
    role: connection.id === connectionId ? 'primary' : 'redundant_clone',
  }));
  await persistStorageConnectionCollection(userId, updated, query);
  return updated.map(toPublicStorageConnection).filter((item): item is PublicStorageConnection => Boolean(item));
}

/** Delete only unreferenced connections; workspace associations must never become dangling. */
export async function deleteUserStorageConnection(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection[]> {
  const record = await findUserRecord(userId, query);
  if (!record) throw new Error('User profile was not found.');
  const connections = await mergeLegacySrklConnections(record.id, record.profiles, query, record.email);
  if (!connections.some((connection) => connection.id === connectionId)) {
    throw new Error('Storage connection was not found for this user.');
  }

  const isReferenced = (profiles: Record<string, any>): boolean =>
    Object.values(profiles).some((profile) =>
      profile && typeof profile === 'object'
      && Array.isArray((profile as any).workspaces)
      && (profile as any).workspaces.some((workspace: any) => workspace.storageConnectionId === connectionId),
    );

  let referenced = isReferenced(record.profiles);
  // Existing SRKL installations may still hold workspace associations in the
  // compatibility table even after the user connection registry is read from
  // ultrst-users. Never delete an ID while either profile source references it.
  if (!referenced) {
    try {
      const legacy = await query(
        'SELECT app_profiles FROM "srkl_application_profiles" WHERE id = $1 OR email = $2 LIMIT 1',
        [record.id, record.email || record.id],
      );
      if (legacy.rows[0]) referenced = isReferenced(parseProfiles(legacy.rows[0].app_profiles));
    } catch (error) {
      if (!isMissingOptionalProfileTable(error)) throw error;
      // Only an absent compatibility table is optional; a failed read must
      // never be interpreted as proof that a connection has no workspace refs.
    }
  }
  if (referenced) {
    throw new Error('This storage connection is associated with a workspace. Change the workspace storage before deleting the connection.');
  }

  let updated = connections.filter((connection) => connection.id !== connectionId);
  if (!updated.some((connection) => connection.role === 'primary') && updated.length > 0) {
    updated = updated.map((connection, index) => ({
      ...connection,
      role: index === 0 ? 'primary' : 'redundant_clone',
    }));
  }
  await persistStorageConnectionCollection(userId, updated, query);
  return updated.map(toPublicStorageConnection).filter((item): item is PublicStorageConnection => Boolean(item));
}

/** Browser-safe list of all existing connections owned by a verified user. */
export async function listUserStorageConnections(
  userId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection[]> {
  const connections = await listUserStorageConnectionsWithSecrets(userId, query);
  return connections
    .map(toPublicStorageConnection)
    .filter((connection): connection is PublicStorageConnection => Boolean(connection));
}

/** Server-only credential resolver. Never return this object from an HTTP API. */
export async function resolveUserStorageConnectionSecret(
  userId: string,
  connectionId?: string,
  query: StorageQuery = DEFAULT_QUERY,
  provider?: string,
): Promise<Record<string, any> | null> {
  const connections = await listUserStorageConnectionsWithSecrets(userId, query);
  const eligible = provider ? connections.filter((item) => item.provider === provider) : connections;
  if (connectionId) return eligible.find((item) => item.id === connectionId) || null;
  return eligible.find((item) => item.role === 'primary' && item.enabled !== false)
    || eligible.find((item) => item.enabled !== false)
    || null;
}

function normalizeWorkspaceAssociationPrefix(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return null;
  return segments.join('/');
}

/**
 * Resolve the persisted workspace association for an owner-bound connection.
 * The folder prefix is a lookup constraint only; the returned workspace data
 * is sourced from the saved user profile and is never constructed from caller
 * supplied storage roots.
 */
export async function resolveUserWorkspaceStorageAssociation(
  userId: string,
  connectionId: string,
  folderPrefix: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<Record<string, any> | null> {
  if (!userId?.trim() || !connectionId?.trim()) return null;
  const requestedPrefix = normalizeWorkspaceAssociationPrefix(folderPrefix);
  if (!requestedPrefix) return null;

  const record = await findUserRecord(userId, query);
  if (!record) return null;
  const workspaces = Object.values(record.profiles).flatMap((profile: any) =>
    profile && typeof profile === 'object' && Array.isArray(profile.workspaces)
      ? profile.workspaces
      : [],
  );
  const matches = workspaces.filter((workspace: any) => {
    if (!workspace || typeof workspace !== 'object' || !String(workspace.id || '').trim()) return false;
    if (String(workspace.storageConnectionId || '').trim() !== connectionId) return false;
    const provider = String(workspace.storageProvider || '').toLowerCase();
    if (provider && !['backblaze_b2', 'google_drive'].includes(provider)) return false;
    const storedPrefix = normalizeWorkspaceAssociationPrefix(
      workspace.localFolderKey
      || workspace.localFolderName
      || workspace.workspacePath
      || workspace.id,
    );
    return storedPrefix === requestedPrefix;
  });

  if (matches.length !== 1) return null;
  return { ...matches[0], __ownerUserId: record.id };
}

async function persistStorageConnection(
  userId: string,
  connection: Record<string, any>,
  query: StorageQuery,
): Promise<void> {
  const existing = await listUserStorageConnectionsWithSecrets(userId, query);
  const next = existing.filter((item) => item.id !== connection.id);
  next.push(connection);
  await persistStorageConnectionCollection(userId, next, query);
}

export async function testBackblazeCredentials(
  keyId: string,
  applicationKey: string,
): Promise<{ success: boolean; accountId?: string; buckets: Array<{ id: string; name: string; type?: string }>; error?: string }> {
  const normalizedKeyId = String(keyId || '').trim();
  const normalizedApplicationKey = String(applicationKey || '').trim();
  if (!normalizedKeyId || !normalizedApplicationKey) {
    return { success: false, buckets: [], error: 'Backblaze B2 Key ID and Application Key are required.' };
  }

  try {
    const auth = await authorizeB2(normalizedKeyId, normalizedApplicationKey);
    const buckets = await b2ListBuckets(normalizedKeyId, normalizedApplicationKey);
    return {
      success: true,
      accountId: auth.accountId,
      buckets: buckets.map((bucket: any) => ({
        id: String(bucket.bucketId || ''),
        name: String(bucket.bucketName || ''),
        type: typeof bucket.bucketType === 'string' ? bucket.bucketType : undefined,
      })).filter((bucket: any) => bucket.name),
    };
  } catch (error) {
    return {
      success: false,
      buckets: [],
      error: error instanceof Error ? error.message : 'Backblaze B2 credential validation failed.',
    };
  }
}

/** Validate credentials and bucket access before persisting the user-owned connection. */
export async function createBackblazeStorageConnection(
  input: {
    userId: string;
    label?: string;
    keyId: string;
    applicationKey: string;
    bucketName: string;
    region?: string;
    endpoint?: string;
  },
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection> {
  const userId = String(input.userId || '').trim();
  const keyId = String(input.keyId || '').trim();
  const applicationKey = String(input.applicationKey || '').trim();
  const bucketName = String(input.bucketName || '').trim();
  if (!userId || !keyId || !applicationKey || !bucketName) {
    throw new Error('A user, B2 Key ID, Application Key, and bucket are required.');
  }

  const test = await testBackblazeCredentials(keyId, applicationKey);
  if (!test.success) throw new Error(test.error || 'Backblaze B2 credential validation failed.');
  const selectedBucket = test.buckets.find((bucket) => bucket.name === bucketName);
  if (!selectedBucket) throw new Error('The selected Backblaze bucket is not available to these credentials.');

  const now = new Date().toISOString();
  const connection = {
    id: `conn_b2_${crypto.randomUUID()}`,
    provider: 'backblaze_b2',
    label: String(input.label || `Backblaze B2 — ${bucketName}`).trim(),
    role: 'redundant_clone',
    enabled: true,
    createdAt: now,
    updatedAt: now,
    testedAt: now,
    testStatus: 'ok',
    b2KeyId: keyId,
    b2ApplicationKey: applicationKey,
    b2BucketName: bucketName,
    bucketName,
    b2Region: String(input.region || 'us-west-004').trim(),
    b2Endpoint: String(input.endpoint || 's3.us-west-004.backblazeb2.com').trim(),
    providerAccountId: test.accountId,
  };

  const record = await findUserRecord(userId, query);
  if (!record) throw new Error('A canonical user profile was not found for this storage connection.');
  const currentConnections = await listUserStorageConnectionsWithSecrets(record.id, query);
  const duplicate = currentConnections.find((item) =>
    item.provider === 'backblaze_b2'
    && String(item.b2KeyId || item.keyId || item.accessKeyId || '') === keyId
    && String(item.b2BucketName || item.bucketName || '') === bucketName,
  );
  if (duplicate) return toPublicStorageConnection(duplicate)!;

  connection.role = currentConnections.length === 0 ? 'primary' : 'redundant_clone';
  await persistStorageConnection(record.id, connection, query);
  return toPublicStorageConnection(connection)!;
}

/** List buckets for a saved connection without returning its credentials. */
export async function listBackblazeBucketsForConnection(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<Array<{ id: string; name: string; type?: string }>> {
  const connection = await resolveUserStorageConnectionSecret(userId, connectionId, query);
  if (!connection || connection.provider !== 'backblaze_b2') {
    throw new Error('Backblaze B2 storage connection was not found for this user.');
  }
  const keyId = String(connection.b2KeyId || connection.keyId || connection.accessKeyId || '').trim();
  const applicationKey = String(connection.b2ApplicationKey || connection.applicationKey || connection.appKey || connection.secretAccessKey || '').trim();
  if (!keyId || !applicationKey) throw new Error('The saved Backblaze connection is missing server-side credentials.');

  const result = await testBackblazeCredentials(keyId, applicationKey);
  if (!result.success) throw new Error(result.error || 'Backblaze B2 bucket discovery failed.');
  return result.buckets;
}

export interface GoogleDriveSystemOAuthConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
  allowedReturnOrigins: string[];
}

/** Resolve system-owned Google OAuth configuration from the canonical system credential record. */
export async function getSystemGoogleOAuthConfiguration(
  query: StorageQuery = DEFAULT_QUERY,
): Promise<GoogleDriveSystemOAuthConfiguration> {
  return getGoogleDriveOAuthConfiguration(query);
}

/** Only capability metadata is exposed; client secrets stay in the system credential store. */
export async function getStorageProviderCapabilities(
  query: StorageQuery = DEFAULT_QUERY,
): Promise<StorageProviderCapability[]> {
  let googleOAuthConfigured = false;
  let googleOAuthError = 'Google Drive OAuth system configuration is missing from public."ultrst-credentials" (id="system").';
  try {
    await getSystemGoogleOAuthConfiguration(query);
    googleOAuthConfigured = true;
  } catch (error) {
    googleOAuthError = error instanceof Error ? error.message : googleOAuthError;
  }
  return [
    {
      id: 'backblaze_b2',
      displayName: 'Backblaze B2',
      enabled: true,
      canSelectExistingConnection: true,
      canCreateConnection: true,
      requiredConfigurationFields: ['keyId', 'applicationKey', 'bucketName'],
      authorizationMode: 'application_key',
      discoveryCapabilities: { accounts: true, buckets: true, folders: false },
    },
    {
      id: 'google_drive',
      displayName: 'Google Drive',
      enabled: googleOAuthConfigured,
      ...(!googleOAuthConfigured ? { availabilityReason: googleOAuthError } : {}),
      canSelectExistingConnection: true,
      canCreateConnection: googleOAuthConfigured,
      requiredConfigurationFields: [],
      authorizationMode: 'oauth2',
      discoveryCapabilities: { accounts: true, buckets: false, folders: true },
    },
  ];
}


/** Persist an exchanged or refreshed Google token set against the verified owner. */
export async function persistGoogleDriveTokens(
  userId: string,
  connectionId: string,
  tokens: GoogleDriveWorkspaceTokens,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection> {
  if (!userId || !connectionId || !tokens.accessToken) {
    throw new Error('Google Drive credential persistence inputs are incomplete.');
  }
  const connection = await resolveUserStorageConnectionSecret(userId, connectionId, query, 'google_drive');
  if (!connection) throw new Error('Google Drive connection is not owned by the authenticated user.');

  const updated = {
    ...connection,
    googleAccessToken: tokens.accessToken,
    googleAccessTokenExpiresAt: tokens.expiresAt,
    googleRefreshToken: tokens.refreshToken || connection.googleRefreshToken,
    updatedAt: new Date().toISOString(),
  };
  await persistStorageConnection(userId, updated, query);
  return toPublicStorageConnection(updated)!;
}

/** Construct a server-only Fetch-based Drive client for an owned connection. */
export async function createGoogleDriveWorkspaceClient(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
  rootFolderId?: string,
): Promise<GoogleDriveWorkspaceService> {
  const connection = await resolveUserStorageConnectionSecret(userId, connectionId, query, 'google_drive');
  if (!connection || connection.enabled === false) {
    throw new Error('Google Drive connection was not found or is disabled for this user.');
  }

  const system = await getSystemGoogleOAuthConfiguration(query);
  const tokens: GoogleDriveWorkspaceTokens = {
    accessToken: String(connection.googleAccessToken || ''),
    ...(connection.googleRefreshToken ? { refreshToken: String(connection.googleRefreshToken) } : {}),
    ...(connection.googleAccessTokenExpiresAt
      ? { expiresAt: Number(connection.googleAccessTokenExpiresAt) }
      : {}),
  };
  if (!tokens.accessToken && !tokens.refreshToken) {
    throw new Error('Google Drive connection has no saved authorization tokens. Reconnect the Google account.');
  }

  const connectionRootFolderId = String(connection.googleRootFolderId || 'root');
  const selectedRootFolderId = String(rootFolderId || connectionRootFolderId);
  const createService = (selectedRoot: string) => new GoogleDriveWorkspaceService({
    clientId: system.clientId,
    clientSecret: system.clientSecret,
    redirectUri: system.redirectUri,
    tokens,
    rootFolderId: selectedRoot,
    googleAccountId: String(connection.googleAccountId || ''),
    persistTokens: async (nextTokens) => {
      await persistGoogleDriveTokens(userId, connectionId, nextTokens, query);
    },
  });

  if (selectedRootFolderId !== connectionRootFolderId) {
    const rootVerifier = createService(connectionRootFolderId);
    await rootVerifier.assertFolderWithinRoot(selectedRootFolderId);
  }
  return createService(selectedRootFolderId);
}

/** Complete the system-configured OAuth exchange and save the resulting user connection. */
export async function completeGoogleDriveAuthorization(
  userId: string,
  code: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<PublicStorageConnection> {
  if (!userId?.trim()) throw new Error('A verified Luth user is required to connect Google Drive.');
  const system = await getSystemGoogleOAuthConfiguration(query);
  const tokens = await GoogleDriveWorkspaceService.exchangeAuthorizationCode(
    {
      clientId: system.clientId,
      clientSecret: system.clientSecret,
      redirectUri: system.redirectUri,
    },
    code,
  );

  const provisional = new GoogleDriveWorkspaceService({
    clientId: system.clientId,
    clientSecret: system.clientSecret,
    redirectUri: system.redirectUri,
    tokens,
  });
  const identity = await provisional.getAccountIdentity();

  const record = await findUserRecord(userId, query);
  if (!record) throw new Error('A canonical user profile was not found for this Google Drive connection.');
  const connections = await mergeLegacySrklConnections(record.id, record.profiles, query, record.email);
  const existing = connections.find((item) =>
    item.provider === 'google_drive'
    && (item.googleAccountId === identity.accountId
      || (identity.email && item.googleEmail === identity.email)),
  );
  const now = new Date().toISOString();
  const connection = {
    ...(existing || {}),
    id: existing?.id || `conn_google_drive_${crypto.randomUUID()}`,
    provider: 'google_drive',
    label: `Google Drive — ${identity.email || 'Google account'}`,
    role: existing?.role || (connections.length === 0 ? 'primary' : 'redundant_clone'),
    enabled: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    testedAt: now,
    testStatus: 'ok',
    googleEmail: identity.email || existing?.googleEmail || '',
    googleAccountId: identity.accountId,
    googleAccessToken: tokens.accessToken,
    googleAccessTokenExpiresAt: tokens.expiresAt,
    googleRefreshToken: tokens.refreshToken || existing?.googleRefreshToken,
    googleRootFolderId: existing?.googleRootFolderId || 'root',
    googleRootFolderName: existing?.googleRootFolderName || 'My Drive',
  };
  await persistStorageConnection(record.id, connection, query);
  return toPublicStorageConnection(connection)!;
}

/** List Drive folders after verifying that the connection belongs to this user. */
export async function listGoogleDriveFoldersForConnection(
  userId: string,
  connectionId: string,
  parentFolderId?: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<GoogleDriveWorkspaceFolder[]> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  await drive.getAccountIdentity();
  return drive.listFolders(parentFolderId);
}

/** Validate and persist the selected Drive root against the user-owned connection. */
export async function selectGoogleDriveRootFolder(
  userId: string,
  connectionId: string,
  folderId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<GoogleDriveWorkspaceFolder> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  await drive.getAccountIdentity();
  const folder = await drive.selectRootFolder(folderId);
  const connection = await resolveUserStorageConnectionSecret(userId, connectionId, query, 'google_drive');
  if (!connection) throw new Error('Google Drive connection was not found for this user.');
  await persistStorageConnection(userId, {
    ...connection,
    googleRootFolderId: folder.id,
    googleRootFolderName: folder.name,
    updatedAt: new Date().toISOString(),
  }, query);
  return folder;
}


/** Server-only Google Drive file operations; secrets and tokens remain in the user connection. */
export async function testGoogleDriveConnectionForUser(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<{ success: boolean; latencyMs: number; error?: string; email?: string }> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  const started = Date.now();
  try {
    const identity = await drive.getAccountIdentity();
    const result = await drive.testConnection();
    return {
      success: Boolean(result.ok),
      latencyMs: Number(result.latencyMs || Date.now() - started),
      ...(identity.email ? { email: identity.email } : {}),
      ...(result.error ? { error: result.error } : {}),
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Google Drive connection failed.',
    };
  }
}

export async function writeGoogleDriveFileForConnection(
  userId: string,
  connectionId: string,
  path: string,
  data: string | Uint8Array,
  contentType = 'application/octet-stream',
  query: StorageQuery = DEFAULT_QUERY,
): Promise<void> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  await drive.write(path, bytes, contentType);
}

export async function readGoogleDriveFileForConnection(
  userId: string,
  connectionId: string,
  path: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<Uint8Array | null> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  try {
    return await drive.read(path);
  } catch (error) {
    if (error instanceof Error && /not found|HTTP 404/i.test(error.message)) return null;
    throw error;
  }
}

export async function deleteGoogleDriveFileForConnection(
  userId: string,
  connectionId: string,
  path: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<void> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  await drive.delete(path);
}

export async function listGoogleDriveFilesForConnection(
  userId: string,
  connectionId: string,
  path = '',
  query: StorageQuery = DEFAULT_QUERY,
): Promise<Array<{ path: string; size: number; modifiedAt: number; isFolder?: boolean }>> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  return drive.list(path);
}


/** Return the authenticated user's Google account identity without exposing OAuth tokens. */
export async function getGoogleDriveAccountIdentityForUser(
  userId: string,
  connectionId: string,
  query: StorageQuery = DEFAULT_QUERY,
): Promise<{ accountId: string; email?: string }> {
  const drive = await createGoogleDriveWorkspaceClient(userId, connectionId, query);
  return drive.getAccountIdentity();
}
