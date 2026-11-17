import { authenticateLuthRequest } from '../auth/luthSession.js';
import { fetch as universalFetch } from '../../app.js';
import { AppBackend } from '../AppBackend.js';

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: unknown;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors },
});
const notFound = (path: string) => json({ error: 'Not Found', path }, 404);

export async function fetchHandler(request: Request, env: Env = {}): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/auth(?=\/)/, '/api');

  if (env.ASSETS && typeof env.ASSETS.fetch === 'function' &&
      !url.pathname.startsWith('/api/') && url.pathname !== '/health' && url.pathname !== '/mcp') {
    return env.ASSETS.fetch(request);
  }

  if (path === '/api/health' || path === '/health') {
    return json({ status: 'ok', service: 'skipo-application' });
  }

  const sharedResponse = await universalFetch(request, env);
  if (sharedResponse.status !== 404) return sharedResponse;

  const auth = await authenticateLuthRequest(request);
  if (auth.status) return json({ error: auth.error || 'Authentication required.' }, auth.status);
  request = auth.request || request;

  const userId = request.headers.get('x-user-id');
  const services = AppBackend.services as any;

  if (path === '/api/workspaces') {
    if (!userId) return json({ error: 'Authenticated user identity is required.' }, 401);
    if (request.method === 'GET') return json(await services.workspace.getWorkspaces(userId, env));
    if (request.method === 'POST') {
      const input = await request.json();
      return json(await services.workspace.createWorkspace(userId, input, env), 201);
    }
  }

  if (path === '/api/storage/connections') {
    if (!userId) return json({ error: 'Authenticated user identity is required.' }, 401);
    if (request.method === 'GET') return json(await services.storage.getStorageConnections(userId, env));
    if (request.method === 'POST') {
      const input = await request.json();
      return json(await services.storage.saveStorageConnection(userId, input, env));
    }
  }

  if (path === '/api/storage/test' && request.method === 'POST') {
    const input = await request.json();
    return json(await services.storage.testStorageConnection(input, env));
  }

  return notFound(url.pathname);
}

export default { fetch: fetchHandler };
