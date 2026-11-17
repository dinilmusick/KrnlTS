import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleStorageRequest,
  type StorageFetchDependencies,
  type StorageOperation,
} from './storageFetchHandler.js';

const connectionId = 'conn_google_drive_12345678';
const b2ConnectionId = 'conn_b2_12345678';
const folderId = 'folder_12345678';

function makeRequest(
  path: string,
  method = 'GET',
  body?: unknown,
  authenticated = true,
  extraHeaders: Record<string, string> = {},
): Request {
  const headers = new Headers(extraHeaders);
  if (authenticated) headers.set('Authorization', 'Bearer valid-session');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request('https://aiko.example' + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

function createDependencies(overrides: Partial<StorageFetchDependencies> = {}) {
  const calls: Array<{ operation: StorageOperation; input: Record<string, unknown> }> = [];
  const dependencies: StorageFetchDependencies = {
    resolveUserFromToken: async (token) => token === 'valid-session' ? { id: 'owner-1' } : null,
    executeStorageOperation: async <T>(operation, input): Promise<T> => {
      calls.push({ operation, input });
      let result: unknown;
      switch (operation) {
        case 'getConnections':
          result = [
            {
              id: connectionId,
              provider: 'google_drive',
              label: 'Primary Drive',
              enabled: true,
              googleEmail: 'owner@example.com',
              googleRefreshToken: 'must-not-leak',
              secretCiphertext: { ciphertext: 'must-not-leak' },
            },
            {
              id: b2ConnectionId,
              provider: 'backblaze_b2',
              label: 'Archive B2',
              enabled: true,
              b2ApplicationKey: 'must-not-leak',
            },
          ];
          break;
        case 'getProviderCapabilities':
          result = [{
            id: 'google_drive',
            displayName: 'Google Drive',
            enabled: true,
            canSelectExistingConnection: true,
            canCreateConnection: true,
            requiredConfigurationFields: [],
            authorizationMode: 'oauth2',
            discoveryCapabilities: { accounts: true, buckets: false, folders: true },
          }];
          break;
        case 'testBackblazeCredentials':
          result = { success: true, accountId: 'account-1', buckets: [{ id: 'bucket-1', name: 'archive' }] };
          break;
        case 'createBackblazeConnection':
          result = {
            id: b2ConnectionId,
            provider: 'backblaze_b2',
            label: 'Archive B2',
            enabled: true,
            b2ApplicationKey: 'must-not-leak',
          };
          break;
        case 'listBackblazeConnectionBuckets':
          result = [{ id: 'bucket-1', name: 'archive' }];
          break;
        case 'listGoogleDriveFolders':
          result = [{ id: folderId, name: 'Projects', mimeType: 'application/vnd.google-apps.folder' }];
          break;
        case 'selectGoogleDriveRootFolder':
          result = { id: folderId, name: 'Projects', mimeType: 'application/vnd.google-apps.folder' };
          break;
        case 'getGoogleDriveAccountIdentity':
          result = { accountId: 'google-account-1', email: 'owner@example.com' };
          break;
        case 'createGoogleDriveAuthorizationRequest':
          result = {
            authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=signed&redirect_uri=https%3A%2F%2Faiko.example%2Fapi%2Fv1%2Fstorage%2Fconnections%2Fgoogle%2Fcallback',
            nonce: 'nonce-123456789',
            expiresAt: '2026-11-17T02:00:00.000Z',
          };
          break;
        case 'verifyGoogleDriveAuthorizationState':
          result = { userId: 'owner-1', returnTo: 'https://aiko.example/workspaces' };
          break;
        case 'completeGoogleDriveAuthorization':
          result = { id: connectionId, provider: 'google_drive', label: 'Primary Drive', enabled: true };
          break;
        default:
          result = [];
      }
      return result as T;
    },
    ...overrides,
  };
  return { dependencies, calls };
}

async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  authenticated = true,
  overrides: Partial<StorageFetchDependencies> = {},
  extraHeaders: Record<string, string> = {},
) {
  const { dependencies, calls } = createDependencies(overrides);
  const response = await handleStorageRequest(
    makeRequest(path, method, body, authenticated, extraHeaders),
    new URL('https://aiko.example' + path).pathname,
    {},
    dependencies,
  );
  assert.ok(response);
  return { response, payload: await response.json().catch(() => null), calls };
}

test('rejects unauthenticated storage requests before calling Kloks', async () => {
  const { response, calls } = await call('/api/v1/storage/connections', 'GET', undefined, false);
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});

test('rejects unsupported methods for known storage routes', async () => {
  const { response, calls } = await call('/api/v1/storage/connections/backblaze', 'GET', undefined, false);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  assert.equal(calls.length, 0);
});

test('returns provider capabilities through the canonical service', async () => {
  const { response, payload, calls } = await call('/api/v1/storage/providers');
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.providers[0].id, 'google_drive');
  assert.equal(calls[0].operation, 'getProviderCapabilities');
});

test('returns only safe connection projections and derives owner from Luth', async () => {
  const { response, payload, calls } = await call('/api/v1/storage/connections');
  assert.equal(response.status, 200);
  assert.equal(calls[0].input.userId, 'owner-1');
  assert.equal(payload.connections[0].googleEmail, 'owner@example.com');
  assert.equal('googleRefreshToken' in payload.connections[0], false);
  assert.equal('secretCiphertext' in payload.connections[0], false);
  assert.equal('b2ApplicationKey' in payload.connections[1], false);
});

test('rejects a browser-supplied owner that differs from the verified Luth principal', async () => {
  const { response, calls } = await call(
    '/api/v1/storage/connections/backblaze',
    'POST',
    { userId: 'victim-user', keyId: 'key-id', applicationKey: 'secret-key', bucketName: 'archive' },
  );
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('creates B2 connections with the verified owner and returns a safe projection', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/backblaze',
    'POST',
    { userId: 'owner-1', keyId: 'key-id', applicationKey: 'secret-key', bucketName: 'archive' },
  );
  assert.equal(response.status, 201);
  assert.equal(calls[0].input.userId, 'owner-1');
  assert.equal(payload.connection.id, b2ConnectionId);
  assert.equal('b2ApplicationKey' in payload.connection, false);
});

test('validates connection ownership and provider before listing B2 buckets', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/backblaze/buckets',
    'POST',
    { connectionId: b2ConnectionId },
  );
  assert.equal(response.status, 200);
  assert.equal(payload.buckets[0].name, 'archive');
  assert.equal(calls[0].operation, 'getConnections');
  assert.equal(calls[1].operation, 'listBackblazeConnectionBuckets');
  assert.equal(calls[1].input.userId, 'owner-1');
});

test('validates Google connection ownership before listing Drive folders', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/google/folders',
    'POST',
    { connectionId, parentFolderId: 'root' },
  );
  assert.equal(response.status, 200);
  assert.equal(payload.folders[0].id, folderId);
  assert.equal(calls[1].operation, 'listGoogleDriveFolders');
  assert.equal(calls[1].input.userId, 'owner-1');
});

test('persists Google Drive root selection through Kloks', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/google/root',
    'POST',
    { connectionId, folderId },
  );
  assert.equal(response.status, 200);
  assert.equal(payload.folder.id, folderId);
  assert.equal(calls[1].operation, 'selectGoogleDriveRootFolder');
  assert.equal(calls[1].input.userId, 'owner-1');
});

test('starts Google OAuth through Kloks and stores the nonce in an HTTP-only callback cookie', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/google/connect',
    'POST',
    { returnTo: 'https://aiko.example/workspaces' },
  );
  assert.equal(response.status, 200);
  assert.match(payload.authorizationUrl, /^https:\/\/accounts\.google\.com\//);
  assert.equal('nonce' in payload, false);
  assert.equal(calls[0].operation, 'createGoogleDriveAuthorizationRequest');
  assert.equal(calls[0].input.userId, 'owner-1');
  assert.match(response.headers.get('set-cookie') || '', /HttpOnly/);
  assert.match(response.headers.get('set-cookie') || '', /SameSite=Lax/);
});


test('refuses to start Google OAuth when the system redirect URI does not target the AIKO callback', async () => {
  const dependencies = createDependencies({
    executeStorageOperation: async <T>(operation, input): Promise<T> => {
      if (operation === 'createGoogleDriveAuthorizationRequest') {
        return {
          authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fother.example%2Fcallback',
          nonce: 'nonce-123456789',
          expiresAt: '2026-11-17T02:00:00.000Z',
        } as T;
      }
      return [] as T;
    },
  }).dependencies;
  const response = await handleStorageRequest(
    makeRequest('/api/v1/storage/connections/google/connect', 'POST', { returnTo: 'https://aiko.example/workspaces' }),
    '/api/v1/storage/connections/google/connect',
    {},
    dependencies,
  );
  assert.equal(response?.status, 503);
});

test('Google OAuth callback revalidates the Luth owner and redirects with the created connection ID', async () => {
  const { response, calls } = await call(
    '/api/v1/storage/connections/google/callback?state=signed&code=authorization-code',
    'GET',
    undefined,
    true,
    {},
    { Cookie: 'aiko_google_drive_nonce=nonce-123456789' },
  );
  assert.equal(response.status, 302);
  const destination = new URL(response.headers.get('location') || '');
  assert.equal(destination.searchParams.get('googleDriveConnected'), '1');
  assert.equal(destination.searchParams.get('googleDriveConnectionId'), connectionId);
  assert.equal(calls[0].operation, 'verifyGoogleDriveAuthorizationState');
  assert.equal(calls[1].operation, 'completeGoogleDriveAuthorization');
  assert.equal(calls[1].input.userId, 'owner-1');
});


test('verifies Google Drive account identity through the canonical Kloks operation', async () => {
  const { response, payload, calls } = await call(
    '/api/v1/storage/connections/google/identity',
    'POST',
    { connectionId, userId: 'owner-1' },
  );
  assert.equal(response.status, 200);
  assert.deepEqual(payload.identity, { accountId: 'google-account-1', email: 'owner@example.com' });
  assert.equal(calls[1].operation, 'getGoogleDriveAccountIdentity');
  assert.equal(calls[1].input.userId, 'owner-1');
});


test('rejects Google OAuth state bound to a different Luth principal', async () => {
  const { dependencies, calls } = createDependencies({
    executeStorageOperation: async <T>(operation, input): Promise<T> => {
      if (operation === 'verifyGoogleDriveAuthorizationState') {
        calls.push({ operation, input });
        return { userId: 'another-user', returnTo: 'https://aiko.example/workspaces' } as T;
      }
      calls.push({ operation, input });
      return [] as T;
    },
  });
  const response = await handleStorageRequest(
    makeRequest(
      '/api/v1/storage/connections/google/callback?state=signed&code=authorization-code',
      'GET',
      undefined,
      true,
      { Cookie: 'aiko_google_drive_nonce=nonce-123456789' },
    ),
    '/api/v1/storage/connections/google/callback',
    {},
    dependencies,
  );
  assert.equal(response?.status, 403);
  assert.equal(calls.some((call) => call.operation === 'completeGoogleDriveAuthorization'), false);
});

test('requires the browser-bound Google OAuth nonce cookie on callback', async () => {
  const { response, calls } = await call(
    '/api/v1/storage/connections/google/callback?state=signed&code=authorization-code',
    'GET',
  );
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test('rejects a connection whose provider does not match the requested Google operation', async () => {
  const { response, calls } = await call(
    '/api/v1/storage/connections/google/identity',
    'POST',
    { connectionId: b2ConnectionId },
  );
  assert.equal(response.status, 404);
  assert.equal(calls.length, 1);
});

test('rejects malformed JSON and malformed opaque connection identifiers', async () => {
  const { response } = await call(
    '/api/v1/storage/connections/google/root',
    'POST',
    { connectionId: 'not an opaque id', folderId },
  );
  assert.equal(response.status, 400);
  const malformed = await handleStorageRequest(
    new Request('https://aiko.example/api/v1/storage/connections/backblaze/test', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-session', 'Content-Type': 'application/json' },
      body: '{',
    }),
    '/api/v1/storage/connections/backblaze/test',
    {},
    createDependencies().dependencies,
  );
  assert.equal(malformed?.status, 400);
});
