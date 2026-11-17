import {
  GoogleDriveWorkspaceService,
  GOOGLE_DRIVE_WORKSPACE_SCOPE,
} from '@ultrst-armada/kloks/backend/storage-workspace';

/** Application callbacks own signed state/session validation; Kloks owns Google OAuth protocol handling. */
export function authorizationUrl(clientId: string, redirectUri: string, state: string): string {
  return GoogleDriveWorkspaceService.createAuthorizationUrl(
    {
      clientId,
      redirectUri,
    },
    state,
    [GOOGLE_DRIVE_WORKSPACE_SCOPE],
  );
}

export async function exchangeCode(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string,
) {
  return GoogleDriveWorkspaceService.exchangeAuthorizationCode(
    {
      clientId,
      clientSecret,
      redirectUri,
    },
    code,
  );
}
