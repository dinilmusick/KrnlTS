import { StorageServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { corsHeaders, jsonRes, parseBody } from './httpResponse.js';

function cookieValue(request: Request, name: string): string {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return '';
}

function clearGoogleDriveNonceCookie(): string {
  return 'kone_google_drive_nonce=; Path=/api/storage/connections/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export async function handleGoogleDriveStorageRoutes(request: Request, storageRoute: string, userId: string, envForServices: Record<string, unknown>): Promise<Response | undefined> {
  const { method } = request;
  const url = new URL(request.url);
  if (storageRoute === '/api/storage/connections/google/authorize' && method === 'GET') {
    try {
      const authorization = await StorageServiceFacade.execute('createGoogleDriveAuthorizationRequest', {
        userId,
        returnTo: url.searchParams.get('returnTo') || String(envForServices.APP_URL || url.origin),
        callbackOrigin: url.origin,
        env: envForServices,
      }) as { authorizationUrl: string; nonce: string; expiresAt: string };
      return new Response(JSON.stringify({ success: true, authorizationUrl: authorization.authorizationUrl, expiresAt: authorization.expiresAt }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
          'Set-Cookie': `kone_google_drive_nonce=${encodeURIComponent(authorization.nonce)}; Path=/api/storage/connections/google/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      return jsonRes(request, {
        success: false,
        error: error instanceof Error ? error.message : 'Google Drive authorization could not be started.',
      }, 503);
    }
  }

  if (storageRoute === '/api/storage/connections/google/callback' && method === 'GET') {
    try {
      const verified = await StorageServiceFacade.execute('verifyGoogleDriveAuthorizationState', {
        state: url.searchParams.get('state') || '',
        nonceCookie: cookieValue(request, 'kone_google_drive_nonce'),
        callbackOrigin: url.origin,
        env: envForServices,
      }) as { userId: string; returnTo: string };

      const returnTo = new URL(verified.returnTo);
      const googleError = url.searchParams.get('error');
      if (googleError) {
        returnTo.searchParams.set('storage_error', googleError);
      } else {
        const code = url.searchParams.get('code') || '';
        if (!code) throw new Error('Google Drive authorization callback did not include an authorization code.');
        await StorageServiceFacade.execute('completeGoogleDriveAuthorization', {
          userId: verified.userId,
          code,
          env: envForServices,
        });
        returnTo.searchParams.set('storage', 'google-drive-connected');
      }

      return new Response(null, {
        status: 303,
        headers: {
          Location: returnTo.toString(),
          'Set-Cookie': clearGoogleDriveNonceCookie(),
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Google Drive authorization could not be completed.',
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
          'Set-Cookie': clearGoogleDriveNonceCookie(),
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  if (storageRoute === '/api/storage/connections/google/identity' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const identity = await StorageServiceFacade.execute('getGoogleDriveAccountIdentity', {
        userId,
        connectionId: body.connectionId,
        env: envForServices,
      });
      return jsonRes(request, identity);
    } catch (error) {
      return jsonRes(request, {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to verify the Google Drive account identity.',
      }, 401);
    }
  }

  if (storageRoute === '/api/storage/connections/google/root' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const folder = await StorageServiceFacade.execute('selectGoogleDriveRootFolder', {
        userId,
        connectionId: body.connectionId,
        folderId: body.folderId,
        env: envForServices,
      });
      return jsonRes(request, { success: true, folder });
    } catch (error) {
      return jsonRes(request, {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to select Google Drive root folder.',
      }, 400);
    }
  }

  if (storageRoute === '/api/storage/connections/google/folders' && method === 'POST') {
    const body = await parseBody(request) as any;
    try {
      const folders = await StorageServiceFacade.execute('listGoogleDriveFolders', {
        userId,
        connectionId: body.connectionId,
        parentFolderId: body.parentFolderId,
        env: envForServices,
      });
      return jsonRes(request, { success: true, folders });
    } catch (error) {
      return jsonRes(request, {
        success: false,
        folders: [],
        error: error instanceof Error ? error.message : 'Unable to list Google Drive folders.',
      }, 401);
    }
  }
}
