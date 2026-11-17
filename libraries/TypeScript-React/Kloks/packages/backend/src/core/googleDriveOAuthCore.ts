/**
 * @file googleDriveOAuthCore.ts
 * @description Fetch-native Google Drive OAuth state and authorization lifecycle.
 *
 * Uses Web Crypto and Web APIs only. OAuth client configuration is system-owned;
 * tokens are persisted through the user-owned Kloks storage connection core.
 */

import {
  completeGoogleDriveAuthorization,
  getSystemGoogleOAuthConfiguration,
  type GoogleDriveSystemOAuthConfiguration,
  type PublicStorageConnection,
} from './storageConnectionCore.js';
import {
  GOOGLE_DRIVE_WORKSPACE_SCOPE,
  GoogleDriveWorkspaceService,
} from '../storage/GoogleDriveWorkspaceService.js';

export interface GoogleDriveAuthorizationRequest {
  authorizationUrl: string;
  state: string;
  nonce: string;
  expiresAt: string;
}

export interface GoogleDriveAuthorizationState {
  userId: string;
  returnTo: string;
  callbackOrigin: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}

type OAuthQuery = (
  sql: string,
  params?: unknown[],
) => Promise<{ rows: Array<Record<string, any>> }>;

const STATE_TTL_MS = 10 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Google Drive OAuth state is malformed.');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toCryptoBufferSource(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function stateSigningKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await stateSigningKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyPayload(payload: string, signature: string, secret: string): Promise<boolean> {
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return false;
  }
  const key = await stateSigningKey(secret, ['verify']);
  return crypto.subtle.verify('HMAC', key, toCryptoBufferSource(signatureBytes), encoder.encode(payload));
}

function safeOrigin(value: string, label: string): string {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Google Drive OAuth ${label} must be a valid absolute URL.`);
  }
}

function validateReturnTo(
  returnToInput: string,
  callbackOrigin: string,
  config: GoogleDriveSystemOAuthConfiguration,
): string {
  let returnTo: URL;
  try {
    returnTo = new URL(returnToInput, callbackOrigin);
  } catch {
    throw new Error('Google Drive OAuth return URL is invalid.');
  }
  if (returnTo.protocol !== 'https:' && returnTo.hostname !== 'localhost') {
    throw new Error('Google Drive OAuth return URL must use HTTPS.');
  }
  if (returnTo.origin !== callbackOrigin && !config.allowedReturnOrigins.includes(returnTo.origin)) {
    throw new Error(
      'Google Drive OAuth return origin is not allowed. Add it to allowedReturnOrigins in the system-owned Google OAuth configuration.',
    );
  }
  return returnTo.toString();
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

async function resolveConfig(query: OAuthQuery): Promise<GoogleDriveSystemOAuthConfiguration> {
  return getSystemGoogleOAuthConfiguration(query);
}

/** Create the Google authorization URL and signed state for a verified Luth user. */
export async function createGoogleDriveAuthorizationRequest(
  input: {
    userId: string;
    returnTo: string;
    callbackOrigin: string;
  },
  query: OAuthQuery,
): Promise<GoogleDriveAuthorizationRequest> {
  const userId = String(input.userId || '').trim();
  if (!userId) throw new Error('A verified Luth user is required to connect Google Drive.');

  const config = await resolveConfig(query);
  const callbackOrigin = safeOrigin(input.callbackOrigin, 'callback origin');
  const configuredCallbackOrigin = safeOrigin(config.redirectUri, 'redirect URI');
  if (callbackOrigin !== configuredCallbackOrigin) {
    throw new Error(
      'Google Drive OAuth callback origin does not match the system-owned redirectUri. Update the Google OAuth system configuration.',
    );
  }

  const returnTo = validateReturnTo(input.returnTo || callbackOrigin, callbackOrigin, config);
  const issuedAt = Date.now();
  const state: GoogleDriveAuthorizationState = {
    userId,
    returnTo,
    callbackOrigin,
    nonce: randomNonce(),
    issuedAt,
    expiresAt: issuedAt + STATE_TTL_MS,
  };
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(state)));
  const signature = await signPayload(payload, config.stateSecret);
  const signedState = `${payload}.${signature}`;
  const authorizationUrl = GoogleDriveWorkspaceService.createAuthorizationUrl(
    { clientId: config.clientId, redirectUri: config.redirectUri },
    signedState,
    [GOOGLE_DRIVE_WORKSPACE_SCOPE],
  );

  return {
    authorizationUrl,
    state: signedState,
    nonce: state.nonce,
    expiresAt: new Date(state.expiresAt).toISOString(),
  };
}

/** Verify state signature, nonce cookie, callback binding, TTL, and return origin. */
export async function verifyGoogleDriveAuthorizationState(
  input: {
    state: string;
    nonceCookie: string;
    callbackOrigin: string;
  },
  query: OAuthQuery,
): Promise<GoogleDriveAuthorizationState> {
  const config = await resolveConfig(query);
  const parts = String(input.state || '').split('.');
  if (parts.length !== 2) throw new Error('Google Drive OAuth state is malformed.');

  const [payload, signature] = parts;
  const signatureValid = await verifyPayload(payload, signature, config.stateSecret);
  if (!signatureValid) throw new Error('Google Drive OAuth state signature is invalid.');

  let parsed: GoogleDriveAuthorizationState;
  try {
    parsed = JSON.parse(decoder.decode(base64UrlToBytes(payload)));
  } catch {
    throw new Error('Google Drive OAuth state payload is invalid.');
  }

  const callbackOrigin = safeOrigin(input.callbackOrigin, 'callback origin');
  const configuredCallbackOrigin = safeOrigin(config.redirectUri, 'redirect URI');
  if (!parsed || parsed.callbackOrigin !== callbackOrigin || callbackOrigin !== configuredCallbackOrigin) {
    throw new Error('Google Drive OAuth callback origin does not match the signed authorization request.');
  }
  if (!parsed.userId || !parsed.nonce || !Number.isFinite(parsed.issuedAt) || !Number.isFinite(parsed.expiresAt)) {
    throw new Error('Google Drive OAuth state is missing required authorization context.');
  }
  if (parsed.expiresAt < Date.now() || parsed.issuedAt > Date.now() + 30_000 || parsed.expiresAt - parsed.issuedAt > STATE_TTL_MS) {
    throw new Error('Google Drive OAuth state has expired. Restart the connection flow.');
  }
  if (!constantTimeEqual(parsed.nonce, String(input.nonceCookie || ''))) {
    throw new Error('Google Drive OAuth nonce validation failed. Restart the connection flow.');
  }

  const normalizedReturnTo = validateReturnTo(parsed.returnTo, callbackOrigin, config);
  if (normalizedReturnTo !== parsed.returnTo) {
    throw new Error('Google Drive OAuth return URL did not match the signed authorization context.');
  }
  return parsed;
}

/**
 * Canonical callback boundary. The signed state and nonce cookie are verified
 * before the authorization code is exchanged or any user connection is written.
 */
export async function completeGoogleDriveAuthorizationCallback(
  input: {
    state: string;
    nonceCookie: string;
    callbackOrigin: string;
    code: string;
  },
  query: OAuthQuery,
): Promise<{ connection: PublicStorageConnection; returnTo: string }> {
  const authorization = await verifyGoogleDriveAuthorizationState({
    state: input.state,
    nonceCookie: input.nonceCookie,
    callbackOrigin: input.callbackOrigin,
  }, query);
  if (!String(input.code || '').trim()) {
    throw new Error('Google Drive authorization code is required.');
  }
  const connection = await completeGoogleDriveAuthorization(authorization.userId, input.code, query);
  return { connection, returnTo: authorization.returnTo };
}
