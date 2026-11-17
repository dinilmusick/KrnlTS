/**
 * @file authFetchHandler.ts
 * @description Pure Fetch Luth auth and system database status handler.
 * Zero Express layers. Adheres to Law L8, L9, L22. (< 200 lines).
 */

import { createLuthAuthClient, DEFAULT_LUTH_URL } from '@dinilmusick/gutts/auth';
import { extractLuthToken } from '@ultrst-armada/kloks/auth';
import { resolveAikoLuthUser, listAikoWorkspaces } from './luthFetchAuth.js';
import { WorkspaceServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import type { Env } from './httpsAdapter.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workspace-Id, X-Requested-With',
};

function jsonRes(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function luthClient(token = '', appUrl?: string) {
  let val = token;
  const tokenStore = { get: () => val, set: (n: string) => { val = n; }, clear: () => { val = ''; } };
  return createLuthAuthClient({
    ecosystemId: 'ultrst-armada',
    applicationId: 'aiko',
    luthUrl: DEFAULT_LUTH_URL,
    origin: typeof appUrl === 'string' && appUrl.trim() ? appUrl.trim() : DEFAULT_LUTH_URL,
    autoRegister: false,
    tokenStore,
  });
}

function extractToken(request: Request): string {
  return extractLuthToken(request);
}

function isDbConfigured(env: Env): boolean {
  return Boolean(
    env.SYSTEM_DATABASE_URL || env.SYSTEM_DATABASE_URL_2 || env.SYSTEM_DATABASE_URL_3
  );
}

export async function handleAuthAndDatabaseRequest(
  request: Request,
  pathname: string,
  env: Env
): Promise<Response | null> {
  const method = request.method;
  const route = pathname.replace(/^\/api\/v1/, '/api');

  // Database status and test
  if (route === '/api/database/status' || route === '/api/auth/database/status') {
    return jsonRes({ success: true, cluster: { engine: 'canonical_system_database', role: 'primary', status: isDbConfigured(env) ? 'connected' : 'offline' } });
  }
  if ((route === '/api/database/test' || route === '/api/auth/database/test') && method === 'POST') {
    const configured = isDbConfigured(env);
    return jsonRes({ success: configured, message: configured ? 'System database configuration is present.' : 'System database URL is not configured.' });
  }

  // Canonical Luth login
  if (route.endsWith('/auth/login') && method === 'POST') {
    const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
    if (!body.email || !body.password) return jsonRes({ success: false, error: 'Email and password required.' }, 400);
    try {
      const client = luthClient('', env.APP_URL);
      await client.signInWithEmail({ email: String(body.email), password: String(body.password) });
      const session = await client.getSession();
      if (!session.authenticated || !session.user) return jsonRes({ success: false, error: 'Luth did not establish a session.' }, 401);
      const token = new Headers(client.getAuthHeaders()).get('authorization')?.replace(/^Bearer\s+/i, '') || '';
      const secure = String(env.APP_URL || '').startsWith('https://') ? '; Secure' : '';
      const cookie = `luth_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
      return jsonRes({ success: true, user: session.user, session: session.session, token, source: 'luth' }, 200, { 'Set-Cookie': cookie });
    } catch (err) {
      return jsonRes({ success: false, error: err instanceof Error ? err.message : 'Luth authentication unavailable.' }, 503);
    }
  }

  // Canonical Luth register
  if (route.endsWith('/auth/register') && method === 'POST') {
    const body = await request.json().catch(() => ({})) as { email?: string; password?: string; name?: string };
    if (!body.email || !body.password) return jsonRes({ success: false, error: 'Email and password required.' }, 400);
    try {
      const client = luthClient('', env.APP_URL);
      await client.signUpWithEmail({ email: String(body.email), password: String(body.password), name: String(body.name || '') });
      const session = await client.getSession();
      const token = new Headers(client.getAuthHeaders()).get('authorization')?.replace(/^Bearer\s+/i, '') || '';
      const secure = String(env.APP_URL || '').startsWith('https://') ? '; Secure' : '';
      const cookie = `luth_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
      return jsonRes({ success: session.authenticated, user: session.user, session: session.session, token, source: 'luth' }, 201, { 'Set-Cookie': cookie });
    } catch (err) {
      return jsonRes({ success: false, error: err instanceof Error ? err.message : 'Luth registration unavailable.' }, 503);
    }
  }

  // Canonical Luth logout
  if (route === '/api/auth/logout' && method === 'POST') {
    const token = extractToken(request);
    if (token) {
      try { await luthClient(token, env.APP_URL).signOut(); } catch {}
    }
    const clearCookie = 'luth_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
    return jsonRes({ success: true }, 200, { 'Set-Cookie': clearCookie });
  }

  // Current authenticated user
  if (route === '/api/auth/me' && method === 'GET') {
    const token = extractToken(request);
    if (!token) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);
    const user = await resolveAikoLuthUser(token, env);
    if (!user) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);
    const listing = await listAikoWorkspaces(user.id, { ...env, WORKSPACE_APP_ID: 'aiko' }).catch(() => ({ workspaces: [], activeWorkspaceId: null }));
    return jsonRes({
      success: true,
      user: {
        ...user,
        workspaces: listing.workspaces || [],
        activeWorkspaceId: listing.activeWorkspaceId || listing.workspaces[0]?.id || null,
      },
    });
  }

  // Workspaces CRUD
  if (route === '/api/auth/workspaces') {
    const token = extractToken(request);
    if (!token) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);
    const user = await resolveAikoLuthUser(token, env);
    if (!user) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);

    if (method === 'GET') {
      const listingResult = await WorkspaceServiceFacade.execute('listWorkspaces', {
        userId: user.id,
        env: { ...env, WORKSPACE_APP_ID: 'aiko' },
      });
      const listing = listingResult && typeof listingResult === 'object'
        ? listingResult as Record<string, unknown>
        : {};
      // User storage secrets and provider authorization state are never
      // serialized through the general workspace-list endpoint. The UI uses
      // the dedicated Kloks StorageService projection for connection metadata.
      return jsonRes({ ...listing, storage_connections: [] });
    }
    if (method === 'POST') {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return jsonRes({ success: false, error: 'Workspace name is required.' }, 400);
      }
      const suppliedOwner = body.userId ?? body.user_id ?? body.ownerId ?? body.owner_id;
      if (suppliedOwner !== undefined && suppliedOwner !== null && suppliedOwner !== '' && suppliedOwner !== user.id) {
        return jsonRes({ success: false, error: 'The supplied workspace owner does not match the verified Luth principal.' }, 403);
      }
      const workspaceInput = Object.fromEntries(
        Object.entries(body).filter(([key]) => !['userId', 'user_id', 'ownerId', 'owner_id'].includes(key)),
      );
      return jsonRes(await WorkspaceServiceFacade.execute('createWorkspace', {
        userId: user.id,
        workspace: workspaceInput,
        env: { ...env, WORKSPACE_APP_ID: 'aiko' },
      }));
    }
  }

  const wsDeleteMatch = route.match(/^\/api\/auth\/workspaces\/([^/]+)$/);
  if (wsDeleteMatch && method === 'DELETE') {
    const token = extractToken(request);
    if (!token) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);
    const user = await resolveAikoLuthUser(token, env);
    if (!user) return jsonRes({ success: false, error: 'Unauthenticated session' }, 401);
    return jsonRes(await WorkspaceServiceFacade.execute('deleteWorkspace', {
      userId: user.id,
      workspaceId: decodeURIComponent(wsDeleteMatch[1]),
      env: { ...env, WORKSPACE_APP_ID: 'aiko' },
    }));
  }

  return null;
}
