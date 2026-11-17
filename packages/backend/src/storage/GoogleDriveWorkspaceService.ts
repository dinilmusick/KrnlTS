import type { FileInfo } from './types.js';

export const GOOGLE_DRIVE_WORKSPACE_SCOPE = 'https://www.googleapis.com/auth/drive';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_API_URL = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const PKCE_VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;
const PKCE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SAFE_OAUTH_ERROR_CODES = new Set([
  'access_denied',
  'invalid_client',
  'invalid_grant',
  'invalid_request',
  'invalid_scope',
  'server_error',
  'temporarily_unavailable',
  'unauthorized_client',
  'unsupported_grant_type',
]);

export interface GoogleDriveWorkspaceTokens {
  accessToken: string;
  refreshToken?: string;
  /** Unix epoch milliseconds. */
  expiresAt?: number;
  tokenType?: string;
}

export interface GoogleDriveWorkspaceOptions {
  clientId: string;
  /** Server-side OAuth client secret. Never include it in persisted connection metadata. */
  clientSecret?: string;
  redirectUri: string;
  /** Credentials loaded by the server-side connection owner. */
  tokens?: GoogleDriveWorkspaceTokens;
  rootFolderId?: string;
  /** Previously associated Google account ID; a different identity is rejected. */
  googleAccountId?: string;
  fetcher?: typeof fetch;
  /** Persists an exchanged or rotated credential set before it becomes current in this instance. */
  persistTokens?: (tokens: GoogleDriveWorkspaceTokens) => Promise<void> | void;
}

export interface GoogleDriveWorkspaceFolder {
  id: string;
  name: string;
  mimeType: string;
  parentIds: string[];
  modifiedAt: number;
}

type DriveFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
};

function encodeBytes(parts: Array<string | Uint8Array>): Uint8Array {
  const encoder = new TextEncoder();
  const buffers = parts.map((part) => typeof part === 'string' ? encoder.encode(part) : part);
  const output = new Uint8Array(buffers.reduce((sum, item) => sum + item.length, 0));
  let offset = 0;
  for (const item of buffers) {
    output.set(item, offset);
    offset += item.length;
  }
  return output;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function validatePkceVerifier(verifier: string): void {
  if (!PKCE_VERIFIER_PATTERN.test(verifier)) {
    throw new Error('Google Drive PKCE verifier must contain 43 to 128 URL-safe characters.');
  }
}

function quoteDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function parseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    throw new Error('Google Drive returned an invalid JSON response.');
  }
}

async function persistTokensSafely(
  persistTokens: GoogleDriveWorkspaceOptions['persistTokens'],
  tokens: GoogleDriveWorkspaceTokens,
): Promise<void> {
  if (!persistTokens) return;
  try {
    await persistTokens({ ...tokens });
  } catch {
    // Persistence callback errors can contain serialized credentials or provider request details.
    throw new Error('Google Drive credentials could not be persisted securely.');
  }
}

/**
 * Fetch-native Google Drive implementation for Worker/edge runtimes.
 *
 * This class deliberately uses only Web Fetch, URL, TextEncoder, Uint8Array,
 * Web Crypto and standard response/header APIs. It does not import googleapis,
 * Node streams, Buffer, filesystem or Node-only modules. OAuth credentials are
 * supplied and persisted only by server-side callers.
 */
export class GoogleDriveWorkspaceService {
  private readonly options: GoogleDriveWorkspaceOptions;
  private readonly fetcher: typeof fetch;
  private tokens: GoogleDriveWorkspaceTokens;
  private refreshPromise?: Promise<GoogleDriveWorkspaceTokens>;

  constructor(options: GoogleDriveWorkspaceOptions) {
    if (!options.clientId?.trim()) throw new Error('Google Drive OAuth client ID is required.');
    if (!options.redirectUri?.trim()) throw new Error('Google Drive OAuth redirect URI is required.');
    this.options = options;
    this.fetcher = options.fetcher || fetch;
    this.tokens = { ...(options.tokens || { accessToken: '' }) };
  }

  /** Generate a cryptographically random RFC 7636 verifier using Web Crypto. */
  static createPkceCodeVerifier(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return encodeBase64Url(bytes);
  }

  /** Create the S256 challenge corresponding to a previously stored verifier. */
  static async createPkceCodeChallenge(codeVerifier: string): Promise<string> {
    validatePkceVerifier(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return encodeBase64Url(new Uint8Array(digest));
  }

  /**
   * Validate callback state against the value stored by the initiating server-side session.
   * Call this at the callback boundary before exchanging the returned authorization code.
   */
  static validateOAuthState(expectedState: string, returnedState: string): void {
    if (!expectedState?.trim() || !returnedState?.trim() || expectedState !== returnedState) {
      throw new Error('Google Drive OAuth state validation failed. Restart the authorization flow.');
    }
  }

  static createAuthorizationUrl(
    options: Pick<GoogleDriveWorkspaceOptions, 'clientId' | 'redirectUri'>,
    state: string,
    scopes: string[] = [GOOGLE_DRIVE_WORKSPACE_SCOPE],
    codeChallenge?: string,
  ): string {
    if (!options.clientId?.trim() || !options.redirectUri?.trim()) {
      throw new Error('Google Drive OAuth client ID and redirect URI are required.');
    }
    if (!state?.trim()) throw new Error('A non-empty Google Drive OAuth state is required.');
    const requestedScopes = scopes.length ? scopes : [GOOGLE_DRIVE_WORKSPACE_SCOPE];
    if (
      !requestedScopes.includes(GOOGLE_DRIVE_WORKSPACE_SCOPE)
      || requestedScopes.some((scope) => !(scope === GOOGLE_DRIVE_WORKSPACE_SCOPE || scope.startsWith(`${GOOGLE_DRIVE_WORKSPACE_SCOPE}.`)))
    ) {
      throw new Error('Google Drive workspace authorization requires Drive storage scopes only.');
    }
    if (codeChallenge !== undefined && !PKCE_CHALLENGE_PATTERN.test(codeChallenge)) {
      throw new Error('Google Drive PKCE S256 challenge must be a 43-character base64url value.');
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', options.clientId);
    url.searchParams.set('redirect_uri', options.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('scope', requestedScopes.join(' '));
    url.searchParams.set('state', state);
    if (codeChallenge) {
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  static async exchangeAuthorizationCode(
    options: Pick<GoogleDriveWorkspaceOptions, 'clientId' | 'clientSecret' | 'redirectUri' | 'fetcher' | 'persistTokens'>,
    code: string,
    existingRefreshToken?: string,
    codeVerifier?: string,
  ): Promise<GoogleDriveWorkspaceTokens> {
    if (!options.clientId?.trim() || !options.redirectUri?.trim()) {
      throw new Error('Google Drive OAuth client ID and redirect URI are required.');
    }
    if (!code?.trim()) throw new Error('Google Drive authorization code is required.');
    if (codeVerifier !== undefined) validatePkceVerifier(codeVerifier);

    const tokens = await GoogleDriveWorkspaceService.requestTokens(
      options.fetcher || fetch,
      {
        client_id: options.clientId,
        ...(options.clientSecret ? { client_secret: options.clientSecret } : {}),
        redirect_uri: options.redirectUri,
        grant_type: 'authorization_code',
        code,
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      },
      existingRefreshToken,
    );
    await persistTokensSafely(options.persistTokens, tokens);
    return tokens;
  }

  private static async requestTokens(
    fetcher: typeof fetch,
    fields: Record<string, string>,
    existingRefreshToken?: string,
  ): Promise<GoogleDriveWorkspaceTokens> {
    let response: Response;
    try {
      response = await fetcher(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields),
        cache: 'no-store',
      });
    } catch {
      throw new Error('Google Drive OAuth token request failed before receiving a response.');
    }

    const data = await parseJson(response);
    if (!response.ok || typeof data.access_token !== 'string' || !data.access_token) {
      const safeCode = typeof data.error === 'string' && SAFE_OAUTH_ERROR_CODES.has(data.error)
        ? ` (${data.error})`
        : '';
      throw new Error(`Google Drive OAuth token request failed${safeCode}.`);
    }

    const refreshToken = typeof data.refresh_token === 'string' && data.refresh_token
      ? data.refresh_token
      : existingRefreshToken;
    const expiresIn = Number(data.expires_in);
    return {
      accessToken: data.access_token,
      ...(refreshToken ? { refreshToken } : {}),
      ...(Number.isFinite(expiresIn) && expiresIn > 0
        ? { expiresAt: Date.now() + expiresIn * 1000 }
        : {}),
      ...(typeof data.token_type === 'string' ? { tokenType: data.token_type } : {}),
    };
  }

  /** Force a refresh through this instance's shared refresh/persistence lifecycle. */
  async refreshTokens(): Promise<GoogleDriveWorkspaceTokens> {
    await this.getAccessToken(true);
    return { ...this.tokens };
  }

  private async getAccessToken(forceRefresh = false, rejectedAccessToken?: string): Promise<string> {
    const expiresSoon = typeof this.tokens.expiresAt === 'number' && this.tokens.expiresAt <= Date.now() + 60_000;
    const hasUsableToken = Boolean(this.tokens.accessToken) && !expiresSoon;
    if (!forceRefresh && hasUsableToken) return this.tokens.accessToken;
    // A parallel request may have already refreshed the token that this request rejected.
    if (forceRefresh && hasUsableToken && rejectedAccessToken && this.tokens.accessToken !== rejectedAccessToken) {
      return this.tokens.accessToken;
    }
    if (!this.tokens.refreshToken) {
      throw new Error('Google Drive credentials are missing or expired. Reconnect the Google account.');
    }

    if (!this.refreshPromise) {
      const refreshToken = this.tokens.refreshToken;
      this.refreshPromise = GoogleDriveWorkspaceService.requestTokens(
        this.fetcher,
        {
          client_id: this.options.clientId,
          ...(this.options.clientSecret ? { client_secret: this.options.clientSecret } : {}),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        refreshToken,
      ).then(async (tokens) => {
        await persistTokensSafely(this.options.persistTokens, tokens);
        this.tokens = { ...tokens };
        return { ...this.tokens };
      }).finally(() => {
        this.refreshPromise = undefined;
      });
    }

    const refreshed = await this.refreshPromise;
    return refreshed.accessToken;
  }

  private async api(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
    const token = await this.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    let response: Response;
    try {
      response = await this.fetcher(
        path.startsWith('https://') ? path : `${GOOGLE_API_URL}/${path.replace(/^\/+/, '')}`,
        {
          ...init,
          headers,
          cache: 'no-store',
        },
      );
    } catch {
      // Never forward fetch errors because some implementations include request headers.
      throw new Error('Google Drive request failed before receiving a response.');
    }

    if (response.status === 401 && retry && this.tokens.refreshToken) {
      await this.getAccessToken(true, token);
      return this.api(path, init, false);
    }
    if (!response.ok) {
      // Provider response bodies can echo credentials or include request metadata; expose status only.
      throw new Error(`Google Drive request failed with HTTP ${response.status}.`);
    }
    return response;
  }

  private async listFiles(parentId: string, query = 'trashed = false'): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken = '';
    do {
      const url = new URL(`${GOOGLE_API_URL}/files`);
      url.searchParams.set('q', `'${quoteDriveQuery(parentId)}' in parents and ${query}`);
      url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,modifiedTime,parents)');
      url.searchParams.set('pageSize', '1000');
      url.searchParams.set('supportsAllDrives', 'true');
      url.searchParams.set('includeItemsFromAllDrives', 'true');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const data = await parseJson(await this.api(url.toString()));
      if (!Array.isArray(data.files)) {
        throw new Error('Google Drive file listing returned an invalid response.');
      }
      files.push(...data.files);
      pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
    } while (pageToken);
    return files;
  }

  private async findChild(parentId: string, name: string): Promise<DriveFile | undefined> {
    const matches = await this.listFiles(
      parentId,
      `name = '${quoteDriveQuery(name)}' and trashed = false`,
    );
    return matches.find((item) => Boolean(item.id));
  }

  private async resolveParent(relativePath: string, create = false): Promise<string> {
    let parent = this.options.rootFolderId || 'root';
    for (const segment of relativePath.replace(/\\/g, '/').split('/').filter(Boolean)) {
      let child = await this.findChild(parent, segment);
      if (!child && create) {
        const data = await parseJson(await this.api('files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: segment,
            mimeType: FOLDER_MIME_TYPE,
            parents: [parent],
          }),
        }));
        child = data;
      }
      if (!child?.id || child.mimeType !== FOLDER_MIME_TYPE) {
        throw new Error(`Google Drive folder not found: ${segment}`);
      }
      parent = child.id;
    }
    return parent;
  }

  private splitPath(value: string): { parent: string; name: string } {
    const normalized = value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    const index = normalized.lastIndexOf('/');
    return index < 0
      ? { parent: '', name: normalized }
      : { parent: normalized.slice(0, index), name: normalized.slice(index + 1) };
  }

  async getAccountIdentity(): Promise<{ accountId: string; email?: string }> {
    const url = new URL(`${GOOGLE_API_URL}/about`);
    url.searchParams.set('fields', 'user(permissionId,emailAddress)');
    const data = await parseJson(await this.api(url.toString()));
    const accountId = data.user?.permissionId || data.user?.emailAddress;
    if (typeof accountId !== 'string' || !accountId) {
      throw new Error('Google Drive did not return a stable account identity.');
    }
    if (this.options.googleAccountId && this.options.googleAccountId !== accountId) {
      throw new Error('Google Drive account identity does not match the saved storage connection.');
    }
    this.options.googleAccountId = accountId;
    return {
      accountId,
      ...(typeof data.user?.emailAddress === 'string' ? { email: data.user.emailAddress } : {}),
    };
  }

  /**
   * Folder browsing is always rooted at the persisted workspace root. A caller
   * may browse a descendant, but cannot supply an unrelated Drive folder ID.
   */
  async assertFolderWithinRoot(folderId: string): Promise<void> {
    const rootId = this.options.rootFolderId || 'root';
    if (!folderId || folderId === rootId) return;

    const pending = [folderId];
    const visited = new Set<string>();
    while (pending.length && visited.size < 128) {
      const current = pending.shift()!;
      if (current === rootId) return;
      if (current === 'root' && rootId !== 'root') break;
      if (visited.has(current)) continue;
      visited.add(current);
      const folder = await this.resolveFolder(current);
      for (const parentId of folder.parentIds) {
        if (parentId === rootId) return;
        if (!visited.has(parentId)) pending.push(parentId);
      }
    }
    throw new Error('The selected Google Drive folder is outside the configured workspace root.');
  }

  async listFolders(parentFolderId = this.options.rootFolderId || 'root'): Promise<GoogleDriveWorkspaceFolder[]> {
    await this.assertFolderWithinRoot(parentFolderId);
    const files = await this.listFiles(
      parentFolderId,
      `mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
    );
    return files.flatMap((file) => file.id && file.name ? [{
      id: file.id,
      name: file.name,
      mimeType: FOLDER_MIME_TYPE,
      parentIds: file.parents || [],
      modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
    }] : []);
  }

  async resolveFolder(folderId: string): Promise<GoogleDriveWorkspaceFolder> {
    if (!folderId?.trim()) throw new Error('A Google Drive folder ID is required.');
    const url = new URL(`${GOOGLE_API_URL}/files/${encodeURIComponent(folderId)}`);
    url.searchParams.set('fields', 'id,name,mimeType,parents,modifiedTime');
    url.searchParams.set('supportsAllDrives', 'true');
    const file = await parseJson(await this.api(url.toString()));
    if (!file.id || !file.name || file.mimeType !== FOLDER_MIME_TYPE) {
      throw new Error('The selected Google Drive item is not a folder.');
    }
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      parentIds: file.parents || [],
      modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
    };
  }

  async selectRootFolder(folderId: string): Promise<GoogleDriveWorkspaceFolder> {
    const folder = await this.resolveFolder(folderId);
    this.options.rootFolderId = folder.id;
    return folder;
  }

  async read(path: string): Promise<Uint8Array> {
    const { parent, name } = this.splitPath(path);
    if (!name) throw new Error('A Google Drive file path is required.');
    const parentId = await this.resolveParent(parent);
    const file = await this.findChild(parentId, name);
    if (!file?.id || file.mimeType === FOLDER_MIME_TYPE) throw new Error(`Google Drive file not found: ${path}`);
    const url = new URL(`${GOOGLE_API_URL}/files/${encodeURIComponent(file.id)}`);
    url.searchParams.set('alt', 'media');
    return new Uint8Array(await (await this.api(url.toString())).arrayBuffer());
  }

  async write(path: string, bytes: Uint8Array | string, contentType = 'application/octet-stream'): Promise<void> {
    const { parent, name } = this.splitPath(path);
    if (!name) throw new Error('A Google Drive file name is required.');
    if (!contentType.trim() || /[\r\n]/.test(contentType)) {
      throw new Error('A valid Google Drive file content type is required.');
    }
    const parentId = await this.resolveParent(parent, true);
    const existing = await this.findChild(parentId, name);
    if (existing?.mimeType === FOLDER_MIME_TYPE) throw new Error(`Google Drive path is a folder: ${path}`);

    const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
    const boundary = `kloks-drive-${crypto.randomUUID()}`;
    const body = encodeBytes([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify({
        name,
        mimeType: contentType,
        ...(!existing?.id ? { parents: [parentId] } : {}),
      }),
      `\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
      data,
      `\r\n--${boundary}--\r\n`,
    ]);
    const endpoint = existing?.id
      ? `${GOOGLE_UPLOAD_URL}/files/${encodeURIComponent(existing.id)}?uploadType=multipart&supportsAllDrives=true`
      : `${GOOGLE_UPLOAD_URL}/files?uploadType=multipart&supportsAllDrives=true`;
    await this.api(endpoint, {
      method: existing?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: body.buffer as ArrayBuffer,
    });
  }

  async delete(path: string): Promise<void> {
    const { parent, name } = this.splitPath(path);
    const parentId = await this.resolveParent(parent);
    const file = await this.findChild(parentId, name);
    if (!file?.id) return;
    await this.api(`files/${encodeURIComponent(file.id)}?supportsAllDrives=true`, { method: 'DELETE' });
  }

  async exists(path: string): Promise<boolean> {
    try { await this.stat(path); return true; }
    catch (error) {
      if (error instanceof Error && /not found|HTTP 404/i.test(error.message)) return false;
      throw error;
    }
  }

  async list(path = ''): Promise<FileInfo[]> {
    const parentId = await this.resolveParent(path);
    const files = await this.listFiles(parentId);
    return files.flatMap((file) => file.name ? [{
      path: path ? `${path.replace(/\/+$/, '')}/${file.name}` : file.name,
      size: Number(file.size || 0),
      modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
      ...(file.id ? { id: file.id } : {}),
      ...(file.mimeType ? { mimeType: file.mimeType } : {}),
      isFolder: file.mimeType === FOLDER_MIME_TYPE,
    }] : []);
  }

  async stat(path: string): Promise<FileInfo> {
    const { parent, name } = this.splitPath(path);
    const parentId = await this.resolveParent(parent);
    const file = await this.findChild(parentId, name);
    if (!file?.id) throw new Error(`Google Drive file not found: ${path}`);
    return {
      path,
      size: Number(file.size || 0),
      modifiedAt: file.modifiedTime ? Date.parse(file.modifiedTime) : 0,
      ...(file.id ? { id: file.id } : {}),
      ...(file.mimeType ? { mimeType: file.mimeType } : {}),
      isFolder: file.mimeType === FOLDER_MIME_TYPE,
    };
  }

  async mkdir(path: string): Promise<void> {
    await this.resolveParent(path, true);
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; details?: Record<string, unknown> }> {
    const started = Date.now();
    try {
      const identity = await this.getAccountIdentity();
      return {
        ok: true,
        latencyMs: Date.now() - started,
        details: { accountId: identity.accountId, email: identity.email, rootFolderId: this.options.rootFolderId || 'root' },
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'Google Drive connection failed.',
      };
    }
  }

  getConnectionMetadata(): Record<string, string> {
    return {
      provider: 'google_drive',
      ...(this.options.googleAccountId ? { googleAccountId: this.options.googleAccountId } : {}),
      ...(this.options.rootFolderId ? { googleRootFolderId: this.options.rootFolderId } : {}),
    };
  }
}
