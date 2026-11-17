import {
  GoogleDriveWorkspaceService,
  type GoogleDriveWorkspaceTokens,
} from '@ultrst-armada/kloks/backend/storage-workspace';

export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
}

export interface GoogleDriveEnvironment {
  GOOGLE_DRIVE_CLIENT_ID?: unknown;
  GOOGLE_DRIVE_CLIENT_SECRET?: unknown;
  GOOGLE_DRIVE_REDIRECT_URI?: unknown;
}

export interface GoogleDriveWorkspaceConnection {
  id: string;
  provider: 'google_drive';
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
  googleRefreshToken?: string;
  googleRootFolderId?: string;
}

export interface GoogleDriveWorkspaceStorageHandle {
  storage: GoogleDriveWorkspaceService;
  connection: GoogleDriveWorkspaceConnection;
}

export function getGoogleDriveOAuthConfig(env: GoogleDriveEnvironment): GoogleDriveOAuthConfig {
  const clientId = String(env.GOOGLE_DRIVE_CLIENT_ID ?? '').trim();
  const clientSecret = String(env.GOOGLE_DRIVE_CLIENT_SECRET ?? '').trim();
  const redirectUri = String(env.GOOGLE_DRIVE_REDIRECT_URI ?? '').trim();
  if (!clientId) throw new Error('GOOGLE_DRIVE_CLIENT_ID must be configured in the server secret store.');
  if (!redirectUri) throw new Error('GOOGLE_DRIVE_REDIRECT_URI must be configured in the server environment.');
  return { clientId, clientSecret: clientSecret || undefined, redirectUri };
}

export function createGoogleDriveAuthorizationUrl(
  oauth: GoogleDriveOAuthConfig,
  state: string,
  scopes?: string[],
): string {
  return GoogleDriveWorkspaceService.createAuthorizationUrl(oauth, state, scopes);
}

export function exchangeGoogleDriveAuthorizationCode(
  oauth: GoogleDriveOAuthConfig,
  code: string,
  existingRefreshToken?: string,
  codeVerifier?: string,
): Promise<GoogleDriveWorkspaceTokens> {
  return GoogleDriveWorkspaceService.exchangeAuthorizationCode(
    oauth,
    code,
    existingRefreshToken,
    codeVerifier,
  );
}

export async function createGoogleDriveWorkspaceStorage(
  source: GoogleDriveWorkspaceConnection,
  oauth: GoogleDriveOAuthConfig,
): Promise<GoogleDriveWorkspaceStorageHandle> {
  if (source.provider !== 'google_drive') {
    throw new Error('A Google Drive workspace connection is required.');
  }
  if (!oauth.clientId || !oauth.redirectUri) {
    throw new Error('Google Drive OAuth client ID and redirect URI are required.');
  }

  const connection = { ...source };
  const tokens: GoogleDriveWorkspaceTokens = {
    accessToken: connection.googleAccessToken || '',
    ...(connection.googleRefreshToken ? { refreshToken: connection.googleRefreshToken } : {}),
    ...(connection.googleAccessTokenExpiresAt
      ? { expiresAt: connection.googleAccessTokenExpiresAt }
      : {}),
  };

  const storage = new GoogleDriveWorkspaceService({
    clientId: oauth.clientId,
    clientSecret: oauth.clientSecret,
    redirectUri: oauth.redirectUri,
    tokens,
    rootFolderId: connection.googleRootFolderId || 'root',
    persistTokens: async (updated) => {
      connection.googleAccessToken = updated.accessToken;
      connection.googleRefreshToken = updated.refreshToken;
      connection.googleAccessTokenExpiresAt = updated.expiresAt;
    },
  });

  return { storage, connection };
}
