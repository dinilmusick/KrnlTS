import express, { Request, Response } from 'express';
import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { getVerifiedPrincipal } from '../luthSession';

const router = express.Router();
const SERVICE_ENV = () => process.env as Record<string, unknown>;

function baseUrl(req: Request): string {
  const protocol = String(req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0].trim();
  return `${protocol}://${req.get('host')}`.replace(/\/+$/, '');
}

function getUserId(req: Request): string {
  return getVerifiedPrincipal(req)?.id || '';
}

function readCookie(req: Request, name: string): string {
  const cookieHeader = req.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) {
      try { return decodeURIComponent(value.join('=')); } catch { return ''; }
    }
  }
  return '';
}

function returnUrl(
  returnTo: string,
  flag: 'googleDriveConnected' | 'googleDriveError',
  connectionId?: string,
): string {
  const target = new URL(returnTo);
  target.searchParams.set(flag, '1');
  if (connectionId) target.searchParams.set('googleDriveConnectionId', connectionId);
  return target.toString();
}

router.get('/start', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }

  try {
    const callbackOrigin = new URL(baseUrl(req)).origin;
    const request = await StorageServiceFacade.execute('createGoogleDriveAuthorizationRequest', {
      userId,
      returnTo: String(req.query.returnTo || `${callbackOrigin}/`),
      callbackOrigin,
      env: SERVICE_ENV(),
    }) as { authorizationUrl: string; nonce: string; expiresAt: string };

    res.cookie('srkl_google_oauth_nonce', request.nonce, {
      httpOnly: true,
      secure: callbackOrigin.startsWith('https:'),
      sameSite: 'lax',
      path: '/api/workspaces/storage/google/callback',
      maxAge: 10 * 60_000,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    if (req.query.response === 'json') {
      res.json({ success: true, authorizationUrl: request.authorizationUrl, expiresAt: request.expiresAt });
      return;
    }
    res.redirect(request.authorizationUrl);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Drive authorization is unavailable.',
    });
  }
});

router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const callbackOrigin = new URL(baseUrl(req)).origin;
  const state = String(req.query.state || '');
  const nonceCookie = readCookie(req, 'srkl_google_oauth_nonce');
  res.clearCookie('srkl_google_oauth_nonce', { path: '/api/workspaces/storage/google/callback' });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  let authorizationState: { userId: string; returnTo: string };
  try {
    authorizationState = await StorageServiceFacade.execute('verifyGoogleDriveAuthorizationState', {
      state,
      nonceCookie,
      callbackOrigin,
      env: SERVICE_ENV(),
    }) as { userId: string; returnTo: string };
  } catch (error) {
    res.status(400).send(error instanceof Error ? error.message : 'Google Drive authorization state is invalid.');
    return;
  }

  if (req.query.error) {
    res.redirect(returnUrl(authorizationState.returnTo, 'googleDriveError'));
    return;
  }

  const code = String(req.query.code || '');
  if (!code) {
    res.redirect(returnUrl(authorizationState.returnTo, 'googleDriveError'));
    return;
  }

  try {
    // Kloks performs the token exchange and persists tokens only into the
    // authenticated user's private storage connection record.
    const connection = await StorageServiceFacade.execute('completeGoogleDriveAuthorization', {
      userId: authorizationState.userId,
      code,
      env: SERVICE_ENV(),
    }) as { id?: string };
    if (!connection?.id) throw new Error('Kloks did not return a Google Drive storage connection.');
    res.redirect(returnUrl(authorizationState.returnTo, 'googleDriveConnected', connection.id));
  } catch (error) {
    const target = new URL(authorizationState.returnTo);
    target.searchParams.set('googleDriveError', '1');
    target.searchParams.set(
      'googleDriveErrorCode',
      error instanceof Error && /OAuth system configuration/i.test(error.message)
        ? 'configuration'
        : 'authorization',
    );
    res.redirect(target.toString());
  }
});

router.get('/connections', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  try {
    const connections = await StorageServiceFacade.execute('getConnections', {
      userId,
      env: SERVICE_ENV(),
    }) as Array<Record<string, any>>;
    res.setHeader('Cache-Control', 'no-store');
    // Explicit browser-safe projection: never forward Kloks' hydrated records.
    res.json({
      success: true,
      connections: connections
        .filter((connection) => connection.provider === 'google_drive')
        .map((connection) => ({
          id: connection.id,
          provider: 'google_drive',
          label: connection.label,
          googleEmail: connection.googleEmail,
          googleRootFolderId: connection.googleRootFolderId,
          googleRootFolderName: connection.googleRootFolderName,
          enabled: connection.enabled,
        })),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Drive connections are unavailable.',
    });
  }
});

router.post('/folders', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId : '';
  const parentFolderId = typeof req.body?.parentFolderId === 'string' ? req.body.parentFolderId : undefined;
  if (!connectionId) {
    res.status(400).json({ success: false, error: 'A Google Drive connection is required.' });
    return;
  }

  try {
    const folders = await StorageServiceFacade.execute('listGoogleDriveFolders', {
      userId,
      connectionId,
      parentFolderId,
      env: SERVICE_ENV(),
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, folders });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Drive access has expired or is unavailable.',
      code: 'GOOGLE_DRIVE_AUTH_UNAVAILABLE',
    });
  }
});

router.post('/identity', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
  if (!connectionId) {
    res.status(400).json({ success: false, error: 'A Google Drive connection is required.' });
    return;
  }
  try {
    const identity = await StorageServiceFacade.execute('getGoogleDriveAccountIdentity', {
      userId,
      connectionId,
      env: SERVICE_ENV(),
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, identity });
  } catch {
    res.status(400).json({ success: false, error: 'Google Drive account identity could not be verified.' });
  }
});

router.post('/select-root', async (req: Request, res: Response): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'A verified Luth session is required.' });
    return;
  }
  const connectionId = typeof req.body?.connectionId === 'string' ? req.body.connectionId : '';
  const folderId = typeof req.body?.folderId === 'string' ? req.body.folderId : '';
  if (!connectionId || !folderId) {
    res.status(400).json({ success: false, error: 'A Google Drive connection and folder are required.' });
    return;
  }
  try {
    const folder = await StorageServiceFacade.execute('selectGoogleDriveRootFolder', {
      userId,
      connectionId,
      folderId,
      env: SERVICE_ENV(),
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, folder });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Google Drive folder selection failed.',
    });
  }
});

export default router;
