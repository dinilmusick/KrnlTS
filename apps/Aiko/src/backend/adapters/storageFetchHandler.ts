/**
 * @file storageFetchHandler.ts
 * @description Fetch-native authenticated Kloks storage routes.
 *
 * Persistent B2/Google file operations always use the shared Kloks registry and
 * storage adapters. A local Node filesystem service may be injected by the Node
 * bootstrap, but is never imported into this Fetch module or Worker dependency graph.
 */

import { extractLuthToken } from '@ultrst-armada/kloks/auth';
import {
  StorageServiceFacade,
  WorkspaceServiceFacade,
} from '@ultrst-armada/kloks/backend/krnl-services';
import { resolveAikoLuthUser, listAikoWorkspaces } from './luthFetchAuth.js';
import type { Env } from './httpsAdapter.js';

export type StorageOperation =
  | 'getProviderCapabilities'
  | 'getConnections'
  | 'testBackblazeCredentials'
  | 'createBackblazeConnection'
  | 'listBackblazeConnectionBuckets'
  | 'createGoogleDriveAuthorizationRequest'
  | 'verifyGoogleDriveAuthorizationState'
  | 'completeGoogleDriveAuthorization'
  | 'listGoogleDriveFolders'
  | 'getGoogleDriveAccountIdentity'
  | 'selectGoogleDriveRootFolder'
  | 'listWorkspaceStorageFiles'
  | 'readWorkspaceStorageFile'
  | 'writeWorkspaceStorageFile'
  | 'deleteWorkspaceStorageFile';

export interface StorageConnectionProjection {
  id: string;
  provider: string;
  label: string;
  role?: 'primary' | 'redundant_clone';
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  testedAt?: string;
  testStatus?: 'ok' | 'error';
  latencyMs?: number;
  bucketName?: string;
  b2BucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;
  googleEmail?: string;
  googleAccountId?: string;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
}

export interface StorageProviderCapabilityProjection {
  id: string;
  displayName: string;
  enabled: boolean;
  availabilityReason?: string;
  canSelectExistingConnection: boolean;
  canCreateConnection: boolean;
  requiredConfigurationFields: string[];
  authorizationMode: string;
  discoveryCapabilities: { accounts: boolean; buckets: boolean; folders: boolean };
}

export interface StorageFolderProjection {
  id: string;
  name: string;
  mimeType?: string;
}

export interface StorageFetchDependencies {
  resolveUserFromToken?: (token: string, env: Env) => Promise<{ id?: string } | null>;
  executeStorageOperation?: <T>(
    operation: StorageOperation,
    input: Record<string, unknown>,
    env: Env,
  ) => Promise<T>;
}


export interface AikoNodeWorkspaceFileService {
  listFiles(workspaceId: string, path: string): Promise<any[]>;
  readFile(workspaceId: string, path: string): Promise<unknown>;
  writeFile(workspaceId: string, path: string, data: string): Promise<unknown>;
  deleteFile(workspaceId: string, path: string): Promise<unknown>;
}

let nodeWorkspaceFileService: AikoNodeWorkspaceFileService | null = null;

/** Called only by Aiko's Node server bootstrap; not part of the Worker entrypoint. */
export function configureStorageNodeWorkspaceService(
  service: AikoNodeWorkspaceFileService | null,
): void {
  nodeWorkspaceFileService = service;
}


const GOOGLE_NONCE_COOKIE = 'aiko_google_drive_nonce';
const GOOGLE_CALLBACK_PATH = '/api/v1/storage/connections/google/callback';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown, maxLength = 512): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u001f\u007f]/.test(normalized)) return null;
  return normalized;
}

function isOpaqueIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 512 && /^[A-Za-z0-9_-]+$/.test(value);
}

function isOpaqueConnectionId(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 8
    && value.length <= 200
    && /^[A-Za-z0-9_-]+$/.test(value);
}

function ownerHintMatches(body: Record<string, unknown>, userId: string): boolean {
  const supplied = body.userId ?? body.user_id;
  return supplied === undefined || supplied === null || supplied === '' || supplied === userId;
}

function projectConnection(value: unknown): StorageConnectionProjection | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 200);
  const provider = stringValue(value.provider, 64);
  if (!id || !provider) return null;
  const projection: StorageConnectionProjection = {
    id,
    provider,
    label: stringValue(value.label, 200) || id,
  };
  if (value.role === 'primary' || value.role === 'redundant_clone') projection.role = value.role;
  if (typeof value.enabled === 'boolean') projection.enabled = value.enabled;
  for (const key of ['createdAt', 'updatedAt', 'testedAt'] as const) {
    const field = stringValue(value[key], 80);
    if (field) projection[key] = field;
  }
  if (value.testStatus === 'ok' || value.testStatus === 'error') projection.testStatus = value.testStatus;
  if (typeof value.latencyMs === 'number' && Number.isFinite(value.latencyMs)) projection.latencyMs = value.latencyMs;
  for (const key of [
    'bucketName', 'b2BucketName', 'b2Region', 'b2Endpoint',
    'googleEmail', 'googleAccountId', 'googleRootFolderId', 'googleRootFolderName',
  ] as const) {
    const field = stringValue(value[key], 512);
    if (field) projection[key] = field;
  }
  return projection;
}

function projectProviderCapability(value: unknown): StorageProviderCapabilityProjection | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 64);
  const displayName = stringValue(value.displayName, 120);
  const discovery = isRecord(value.discoveryCapabilities) ? value.discoveryCapabilities : {};
  if (!id || !displayName) return null;
  return {
    id,
    displayName,
    enabled: value.enabled === true,
    ...(stringValue(value.availabilityReason, 500) ? { availabilityReason: stringValue(value.availabilityReason, 500)! } : {}),
    canSelectExistingConnection: value.canSelectExistingConnection === true,
    canCreateConnection: value.canCreateConnection === true,
    requiredConfigurationFields: Array.isArray(value.requiredConfigurationFields)
      ? value.requiredConfigurationFields.filter((item): item is string => typeof item === 'string')
      : [],
    authorizationMode: stringValue(value.authorizationMode, 40) || 'none',
    discoveryCapabilities: {
      accounts: discovery.accounts === true,
      buckets: discovery.buckets === true,
      folders: discovery.folders === true,
    },
  };
}

function projectFolder(value: unknown): StorageFolderProjection | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id, 512);
  const name = stringValue(value.name, 512);
  if (!id || !name) return null;
  const mimeType = stringValue(value.mimeType, 160);
  return { id, name, ...(mimeType ? { mimeType } : {}) };
}

function getCookie(request: Request, name: string): string {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      try { return decodeURIComponent(item.slice(separator + 1).trim()); } catch { return ''; }
    }
  }
  return '';
}

function clearGoogleNonceCookie(secure: boolean): string {
  return GOOGLE_NONCE_COOKIE + '=; Path=' + GOOGLE_CALLBACK_PATH + '; HttpOnly; SameSite=Lax; Max-Age=0' + (secure ? '; Secure' : '');
}

function methodNotAllowed(allowed: string): Response {
  return jsonRes({ success: false, error: 'Method not allowed.' }, 405, { Allow: allowed });
}

async function findOwnedConnection(
  userId: string,
  connectionId: string,
  provider: 'backblaze_b2' | 'google_drive',
  env: Env,
  execute: <T>(operation: StorageOperation, input: Record<string, unknown>, env: Env) => Promise<T>,
): Promise<StorageConnectionProjection | null> {
  const result = await execute<unknown>('getConnections', { userId }, env);
  const connections = Array.isArray(result)
    ? result
    : isRecord(result) && Array.isArray(result.connections) ? result.connections : [];
  const connection = connections.map(projectConnection).find((item) =>
    item !== null && item.id === connectionId && item.provider === provider && item.enabled !== false,
  );
  return connection || null;
}

function redirectAfterGoogleOAuth(returnTo: string, connected?: StorageConnectionProjection): Response {
  const destination = new URL(returnTo);
  if (connected) {
    destination.searchParams.set('googleDriveConnected', '1');
    destination.searchParams.set('googleDriveConnectionId', connected.id);
    destination.searchParams.delete('googleDriveError');
  } else {
    destination.searchParams.set('googleDriveError', '1');
    destination.searchParams.delete('googleDriveConnected');
    destination.searchParams.delete('googleDriveConnectionId');
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.toString(),
      'Set-Cookie': clearGoogleNonceCookie(new URL(returnTo).protocol === 'https:'),
      'Cache-Control': 'no-store',
    },
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workspace-Id, X-Requested-With',
};

function jsonRes(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS_HEADERS, ...extraHeaders },
  });
}

function extractToken(request: Request): string {
  return extractLuthToken(request) || (request.headers.get('x-session-token')?.trim() || '');
}

async function getVerifiedUserId(request: Request, env: Env, resolver?: StorageFetchDependencies['resolveUserFromToken']): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;
  const user = resolver ? await resolver(token, env) : await resolveAikoLuthUser(token, env);
  return user?.id ? String(user.id) : null;
}

async function getActiveWorkspace(
  userId: string,
  env: Env,
): Promise<{ userId: string; workspaceId: string } | null> {
  const result = await listAikoWorkspaces(userId, { ...env, WORKSPACE_APP_ID: 'aiko' })
    .catch(() => ({ workspaces: [], activeWorkspaceId: null }));
  const workspaceId = result.activeWorkspaceId || (result.workspaces && result.workspaces[0]?.id);
  return workspaceId ? { userId, workspaceId: String(workspaceId) } : null;
}

async function executeStorageOperation<T>(
  operation: StorageOperation,
  input: Record<string, unknown>,
  env: Env,
): Promise<T> {
  return StorageServiceFacade.execute(operation, { ...input, env }) as Promise<T>;
}

function normalizeRelativeFilePath(value: string): string {
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch {
    throw new Error('Storage file path encoding is invalid.');
  }
  const normalized = decoded.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/');
  if (
    !normalized
    || parts.some((part) => !part || part === '.' || part === '..')
    || normalized.includes('\0')
  ) {
    throw new Error('Storage file path must be a safe workspace-relative path.');
  }
  return normalized;
}

async function resolveWorkspaceStorageContext(
  active: { userId: string; workspaceId: string },
  env: Env,
): Promise<{
  workspace: Record<string, any>;
  connection: Record<string, any> | null;
  folderPrefix: string;
}> {
  const result = await WorkspaceServiceFacade.execute('findWorkspace', {
    workspaceId: active.workspaceId,
    env: { ...env, WORKSPACE_APP_ID: 'aiko' },
  }) as { user?: Record<string, any>; workspace?: Record<string, any>; connection?: Record<string, any> | null };

  if (!result?.workspace || String(result.user?.id || '') !== active.userId) {
    throw new Error('The requested workspace is not owned by the verified Luth user.');
  }
  const workspace = result.workspace;
  const storageProvider = String(workspace.storageProvider || 'local_fs');
  if (storageProvider !== 'local_fs' && (
    !result.connection
    || String(result.connection.id || '') !== String(workspace.storageConnectionId || '')
    || String(result.connection.provider || '') !== String(workspace.storageProvider || '')
  )) {
    throw new Error('The workspace storage connection association is invalid.');
  }
  const folderPrefix = String(
    workspace.localFolderKey || workspace.localFolderName || workspace.id || '',
  ).replace(/^\/+|\/+$/g, '');
  if (!folderPrefix) throw new Error('The canonical workspace has no storage folder prefix.');

  return {
    workspace,
    connection: result.connection || null,
    folderPrefix,
  };
}

function sharedFileInput(
  active: { userId: string; workspaceId: string },
  context: { workspace: Record<string, any>; connection: Record<string, any> | null; folderPrefix: string },
  relativePath?: string,
): Record<string, unknown> {
  const connection = context.connection;
  if (!connection?.id || !connection.provider) {
    throw new Error('The workspace has no verified persistent storage connection.');
  }
  return {
    userId: active.userId,
    connectionId: connection.id,
    folderPrefix: context.folderPrefix,
    ...(relativePath ? { relativePath } : {}),
    ...(context.workspace.b2BucketName || connection.b2BucketName || connection.bucketName
      ? { bucketName: context.workspace.b2BucketName || connection.b2BucketName || connection.bucketName }
      : {}),
    ...(context.workspace.googleRootFolderId || connection.googleRootFolderId
      ? { rootFolderId: context.workspace.googleRootFolderId || connection.googleRootFolderId }
      : {}),
  };
}

export async function handleStorageRequest(
  request: Request,
  pathname: string,
  env: Env,
  dependencies: StorageFetchDependencies = {},
): Promise<Response | null> {
  const route = pathname.replace(/^\/api\/v1/, '/api');
  if (!route.startsWith('/api/storage')) return null;


  const method = request.method;
  const staticMethods: Record<string, string> = {
    '/api/storage/providers': 'GET',
    '/api/storage/connections': 'GET',
    '/api/storage/connections/backblaze/test': 'POST',
    '/api/storage/connections/backblaze': 'POST',
    '/api/storage/connections/backblaze/buckets': 'POST',
    '/api/storage/connections/google/connect': 'POST',
    '/api/storage/connections/google/callback': 'GET',
    '/api/storage/connections/google/folders': 'POST',
    '/api/storage/connections/google/identity': 'POST',
    '/api/storage/connections/google/root': 'POST',
    '/api/storage/config': 'GET',
    '/api/storage/sync': 'POST',
    '/api/storage/files': 'GET',
  };
  const expectedMethod = staticMethods[route];
  if (expectedMethod && method !== expectedMethod) return methodNotAllowed(expectedMethod);
  if (route.startsWith('/api/storage/files/') && !['GET', 'PUT', 'DELETE'].includes(method)) {
    return methodNotAllowed('GET, PUT, DELETE');
  }
  if (!expectedMethod && !route.startsWith('/api/storage/files/')) {
    return jsonRes({ success: false, error: 'Storage route not found.' }, 404);
  }

  let userId: string | null;
  try {
    userId = await getVerifiedUserId(request, env, dependencies.resolveUserFromToken);
  } catch {
    return jsonRes({ success: false, error: 'Canonical Luth authentication service unavailable.' }, 503);
  }
  if (!userId) return jsonRes({ success: false, error: 'A verified Luth session is required.' }, 401);

  const execute: <T>(operation: StorageOperation, input: Record<string, unknown>, bindings: Env) => Promise<T> =
    dependencies.executeStorageOperation
      || ((operation, input, bindings) => executeStorageOperation(operation, input, bindings));

  if (route === '/api/storage/providers' && method === 'GET') {
    try {
      const result = await execute<unknown>('getProviderCapabilities', {}, env);
      const values = Array.isArray(result) ? result : isRecord(result) && Array.isArray(result.providers) ? result.providers : [];
      return jsonRes({ success: true, providers: values.map(projectProviderCapability).filter(Boolean) });
    } catch {
      return jsonRes({ success: false, error: 'Unable to discover storage providers.' }, 503);
    }
  }

  if (route === '/api/storage/connections' && method === 'GET') {
    try {
      const result = await execute<unknown>('getConnections', { userId }, env);
      const values = Array.isArray(result) ? result : isRecord(result) && Array.isArray(result.connections) ? result.connections : [];
      return jsonRes({ success: true, connections: values.map(projectConnection).filter(Boolean) });
    } catch {
      return jsonRes({ success: false, error: 'Unable to list storage connections.' }, 503);
    }
  }

  if (route === '/api/storage/connections/backblaze/test' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const keyId = stringValue(body.keyId, 256);
    const applicationKey = stringValue(body.applicationKey, 512);
    if (!keyId || !applicationKey) return jsonRes({ success: false, error: 'Backblaze keyId and applicationKey are required.' }, 400);
    try {
      const result = await execute<Record<string, unknown>>('testBackblazeCredentials', { keyId, applicationKey }, env);
      return jsonRes({
        success: result.success === true,
        ...(stringValue(result.accountId, 256) ? { accountId: result.accountId } : {}),
        buckets: Array.isArray(result.buckets) ? result.buckets.filter(isRecord).map((bucket) => ({
          ...(stringValue(bucket.id, 256) ? { id: bucket.id } : {}),
          ...(stringValue(bucket.bucketId, 256) ? { bucketId: bucket.bucketId } : {}),
          ...(stringValue(bucket.name, 255) ? { name: bucket.name } : {}),
          ...(stringValue(bucket.bucketName, 255) ? { bucketName: bucket.bucketName } : {}),
        })) : [],
        ...(stringValue(result.error, 500) ? { error: result.error } : {}),
      }, result.success === true ? 200 : 400);
    } catch {
      return jsonRes({ success: false, error: 'Backblaze credential validation failed.', buckets: [] }, 400);
    }
  }

  if (route === '/api/storage/connections/backblaze' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const keyId = stringValue(body.keyId, 256);
    const applicationKey = stringValue(body.applicationKey, 512);
    const bucketName = stringValue(body.bucketName, 255);
    if (!keyId || !applicationKey || !bucketName) {
      return jsonRes({ success: false, error: 'Backblaze keyId, applicationKey and bucketName are required.' }, 400);
    }
    try {
      const connection = await execute<unknown>('createBackblazeConnection', {
        userId,
        keyId,
        applicationKey,
        bucketName,
        ...(stringValue(body.label, 200) ? { label: stringValue(body.label, 200)! } : {}),
        ...(stringValue(body.region, 100) ? { region: stringValue(body.region, 100)! } : {}),
        ...(stringValue(body.endpoint, 300) ? { endpoint: stringValue(body.endpoint, 300)! } : {}),
      }, env);
      const projection = projectConnection(isRecord(connection) && isRecord(connection.connection) ? connection.connection : connection);
      if (!projection || projection.provider !== 'backblaze_b2') {
        return jsonRes({ success: false, error: 'Kloks did not return a valid Backblaze connection.' }, 502);
      }
      return jsonRes({ success: true, connection: projection }, 201);
    } catch {
      return jsonRes({ success: false, error: 'Unable to create the Backblaze storage connection.' }, 400);
    }
  }

  if (route === '/api/storage/connections/backblaze/buckets' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const connectionId = body.connectionId;
    if (!isOpaqueConnectionId(connectionId)) return jsonRes({ success: false, error: 'A valid connectionId is required.' }, 400);
    try {
      const owned = await findOwnedConnection(userId, connectionId, 'backblaze_b2', env, execute);
      if (!owned) return jsonRes({ success: false, error: 'Backblaze connection not found for this user.' }, 404);
      const buckets = await execute<unknown[]>('listBackblazeConnectionBuckets', { userId, connectionId }, env);
      return jsonRes({ success: true, buckets: Array.isArray(buckets) ? buckets.filter(isRecord).map((bucket) => ({
        ...(stringValue(bucket.id, 256) ? { id: bucket.id } : {}),
        ...(stringValue(bucket.bucketId, 256) ? { bucketId: bucket.bucketId } : {}),
        ...(stringValue(bucket.name, 255) ? { name: bucket.name } : {}),
        ...(stringValue(bucket.bucketName, 255) ? { bucketName: bucket.bucketName } : {}),
        ...(stringValue(bucket.type, 100) ? { type: bucket.type } : {}),
      })) : [] });
    } catch {
      return jsonRes({ success: false, error: 'Unable to list buckets for this Backblaze connection.', buckets: [] }, 400);
    }
  }

  if (route === '/api/storage/connections/google/connect' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const requestUrl = new URL(request.url);
    const returnTo = stringValue(body.returnTo, 2048) || request.headers.get('referer') || requestUrl.origin;
    try {
      const authorization = await execute<{
        authorizationUrl: string;
        nonce: string;
        expiresAt: string;
      }>('createGoogleDriveAuthorizationRequest', {
        userId,
        returnTo,
        callbackOrigin: requestUrl.origin,
      }, env);
      if (!stringValue(authorization.authorizationUrl, 4096) || !stringValue(authorization.nonce, 256)) {
        return jsonRes({ success: false, error: 'Kloks returned an invalid Google authorization request.' }, 502);
      }
      const authorizationUrl = new URL(authorization.authorizationUrl);
      const expectedCallback = new URL(GOOGLE_CALLBACK_PATH, requestUrl.origin).toString();
      if (authorizationUrl.searchParams.get('redirect_uri') !== expectedCallback) {
        return jsonRes({ success: false, error: 'Google OAuth system redirect URI must exactly match the AIKO callback endpoint.' }, 503);
      }
      return jsonRes({
        success: true,
        authorizationUrl: authorizationUrl.toString(),
        expiresAt: authorization.expiresAt,
      }, 200, {
        'Set-Cookie': GOOGLE_NONCE_COOKIE + '=' + encodeURIComponent(authorization.nonce)
          + '; Path=' + GOOGLE_CALLBACK_PATH + '; HttpOnly; SameSite=Lax; Max-Age=600' + (requestUrl.protocol === 'https:' ? '; Secure' : ''),
        'Cache-Control': 'no-store',
      });
    } catch {
      return jsonRes({ success: false, error: 'Google Drive authorization could not be started.' }, 503);
    }
  }

  if (route === '/api/storage/connections/google/callback' && method === 'GET') {
    const callbackUrl = new URL(request.url);
    const state = callbackUrl.searchParams.get('state') || '';
    const code = callbackUrl.searchParams.get('code') || '';
    const oauthError = callbackUrl.searchParams.get('error') || '';
    const nonceCookie = getCookie(request, GOOGLE_NONCE_COOKIE);
    if (!state || !nonceCookie) return jsonRes({ success: false, error: 'Google Drive authorization state is missing.' }, 400);
    try {
      const verified = await execute<{
        userId: string;
        returnTo: string;
      }>('verifyGoogleDriveAuthorizationState', {
        state,
        nonceCookie,
        callbackOrigin: callbackUrl.origin,
      }, env);
      if (verified.userId !== userId) {
        return jsonRes({ success: false, error: 'Google Drive authorization belongs to a different Luth principal.' }, 403);
      }
      if (oauthError || !code) return redirectAfterGoogleOAuth(verified.returnTo);
      const result = await execute<unknown>('completeGoogleDriveAuthorization', { userId, code }, env);
      const connection = projectConnection(isRecord(result) && isRecord(result.connection) ? result.connection : result);
      if (!connection || connection.provider !== 'google_drive') {
        return jsonRes({ success: false, error: 'Kloks did not return a valid Google Drive connection.' }, 502);
      }
      return redirectAfterGoogleOAuth(verified.returnTo, connection);
    } catch {
      return jsonRes({ success: false, error: 'Google Drive authorization could not be verified or completed.' }, 400);
    }
  }

  if (route === '/api/storage/connections/google/folders' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const connectionId = body.connectionId;
    const parentFolderId = body.parentFolderId === undefined ? undefined : body.parentFolderId;
    if (!isOpaqueConnectionId(connectionId) || (parentFolderId !== undefined && !isOpaqueIdentifier(parentFolderId))) {
      return jsonRes({ success: false, error: 'A valid connectionId and optional parentFolderId are required.' }, 400);
    }
    try {
      const owned = await findOwnedConnection(userId, connectionId, 'google_drive', env, execute);
      if (!owned) return jsonRes({ success: false, error: 'Google Drive connection not found for this user.' }, 404);
      const folders = await execute<unknown[]>('listGoogleDriveFolders', {
        userId,
        connectionId,
        ...(parentFolderId ? { parentFolderId } : {}),
      }, env);
      return jsonRes({ success: true, folders: Array.isArray(folders) ? folders.map(projectFolder).filter(Boolean) : [] });
    } catch {
      return jsonRes({ success: false, error: 'Unable to list Google Drive folders.', folders: [] }, 400);
    }
  }

  if (route === '/api/storage/connections/google/identity' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const connectionId = body.connectionId;
    if (!isOpaqueConnectionId(connectionId)) return jsonRes({ success: false, error: 'A valid connectionId is required.' }, 400);
    try {
      const owned = await findOwnedConnection(userId, connectionId, 'google_drive', env, execute);
      if (!owned) return jsonRes({ success: false, error: 'Google Drive connection not found for this user.' }, 404);
      const identity = await execute<{ accountId: string; email?: string }>('getGoogleDriveAccountIdentity', {
        userId,
        connectionId,
      }, env);
      const accountId = stringValue(identity.accountId, 512);
      if (!accountId) return jsonRes({ success: false, error: 'Kloks returned an invalid Google Drive account identity.' }, 502);
      return jsonRes({ success: true, identity: { accountId, ...(stringValue(identity.email, 320) ? { email: identity.email } : {}) } });
    } catch {
      return jsonRes({ success: false, error: 'Unable to verify the Google Drive account identity.' }, 400);
    }
  }

  if (route === '/api/storage/connections/google/root' && method === 'POST') {
    const body = await readJsonObject(request);
    if (!body) return jsonRes({ success: false, error: 'A valid JSON object is required.' }, 400);
    if (!ownerHintMatches(body, userId)) return jsonRes({ success: false, error: 'The supplied owner does not match the verified Luth principal.' }, 403);
    const connectionId = body.connectionId;
    const folderId = body.folderId;
    if (!isOpaqueConnectionId(connectionId) || !isOpaqueIdentifier(folderId)) {
      return jsonRes({ success: false, error: 'A valid connectionId and folderId are required.' }, 400);
    }
    try {
      const owned = await findOwnedConnection(userId, connectionId, 'google_drive', env, execute);
      if (!owned) return jsonRes({ success: false, error: 'Google Drive connection not found for this user.' }, 404);
      const folder = await execute<unknown>('selectGoogleDriveRootFolder', { userId, connectionId, folderId }, env);
      const projection = projectFolder(folder);
      if (!projection) return jsonRes({ success: false, error: 'Kloks returned an invalid Google Drive folder.' }, 502);
      return jsonRes({ success: true, folder: projection });
    } catch {
      return jsonRes({ success: false, error: 'Unable to select the Google Drive root folder.' }, 400);
    }
  }

    const active = await getActiveWorkspace(userId, env);
  if (!active) return jsonRes({ success: false, error: 'No active workspace is available for workspace file storage.' }, 409);

  if (route === '/api/storage/config' && method === 'GET') {
    return jsonRes({
      success: true,
      config: {
        primary: { id: active.workspaceId, provider: 'canonical_workspace', label: 'Kloks Workspace', status: 'CONNECTED' },
        backups: [],
        sync: { state: 'CANONICAL', workspaceId: active.workspaceId },
      },
    });
  }

  if (route === '/api/storage/sync' && method === 'POST') {
    return jsonRes({ success: true, sync: { state: 'CANONICAL', workspaceId: active.workspaceId }, syncedAt: new Date().toISOString() });
  }

  if (route === '/api/storage/files' && method === 'GET') {
    try {
      const context = await resolveWorkspaceStorageContext(active, env);
      if (context.workspace.storageProvider === 'local_fs' || !context.connection) {
        if (!nodeWorkspaceFileService) {
          return jsonRes({ success: false, error: 'Local filesystem storage is unavailable in this Fetch runtime.' }, 501);
        }
        const url = new URL(request.url);
        const files = await nodeWorkspaceFileService.listFiles(active.workspaceId, String(url.searchParams.get('dir') || ''));
        return jsonRes({ success: true, files });
      }
      const url = new URL(request.url);
      const files = await executeStorageOperation<any[]>('listWorkspaceStorageFiles', {
        ...sharedFileInput(active, context),
        subPrefix: String(url.searchParams.get('dir') || ''),
      }, env);
      return jsonRes({ success: true, files });
    } catch (error) {
      return jsonRes({ success: false, error: error instanceof Error ? error.message : 'Unable to list workspace files.' }, 503);
    }
  }

  if (route.startsWith('/api/storage/files/')) {
    let filePath: string;
    try {
      filePath = normalizeRelativeFilePath(route.slice('/api/storage/files/'.length));
    } catch (error) {
      return jsonRes({ success: false, error: error instanceof Error ? error.message : 'Invalid storage file path.' }, 400);
    }

    try {
      const context = await resolveWorkspaceStorageContext(active, env);
      if (context.workspace.storageProvider === 'local_fs' || !context.connection) {
        if (!nodeWorkspaceFileService) {
          return jsonRes({ success: false, error: 'Local filesystem storage is unavailable in this Fetch runtime.' }, 501);
        }
        if (method === 'GET') {
          const data = await nodeWorkspaceFileService.readFile(active.workspaceId, filePath);
          return new Response(data as any, { status: 200, headers: { 'Content-Type': 'application/octet-stream', ...CORS_HEADERS } });
        }
        if (method === 'PUT') {
          const body = await request.text();
          return jsonRes(await nodeWorkspaceFileService.writeFile(active.workspaceId, filePath, body));
        }
        if (method === 'DELETE') {
          return jsonRes(await nodeWorkspaceFileService.deleteFile(active.workspaceId, filePath));
        }
      } else {
        const input = sharedFileInput(active, context, filePath);
        if (method === 'GET') {
          const data = await executeStorageOperation<Uint8Array | null>('readWorkspaceStorageFile', input, env);
          if (!data) return jsonRes({ success: false, error: 'File not found.' }, 404);
          return new Response(data, { status: 200, headers: { 'Content-Type': 'application/octet-stream', ...CORS_HEADERS } });
        }
        if (method === 'PUT') {
          const data = new Uint8Array(await request.arrayBuffer());
          const result = await executeStorageOperation<any>('writeWorkspaceStorageFile', {
            ...input,
            content: data,
            contentType: request.headers.get('content-type') || 'application/octet-stream',
          }, env);
          return jsonRes(result);
        }
        if (method === 'DELETE') {
          return jsonRes(await executeStorageOperation<boolean>('deleteWorkspaceStorageFile', input, env));
        }
      }
    } catch (error) {
      return jsonRes({
        success: false,
        error: error instanceof Error ? error.message : 'Workspace file operation failed.',
      }, 503);
    }
  }

  return null;
}
