/**
 * @file httpsAdapter.ts
 * @description Protocol Adapter converting Universal SrklBackend into a Web Standard Fetch HTTP Server asset.
 * Deployed to Cloudflare Workers / Universal API targets. Conforms to Laws L8, L9 (< 200 lines).
 */

import { SrklBackend } from '../SrklBackend';
import { handleAikoRoutes } from './aikoRoutes';
import { handleFodRoutes } from './fodRoutes';
import { DEFAULT_LUTH_URL } from '@ultrst-armada/kloks/auth';

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  SYSTEM_DATABASE_URL?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
  APP_URL?: string;
  [key: string]: unknown;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Workspace-Id, X-Requested-With',
};

function jsonRes(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

async function parseBody(req: Request): Promise<any> {
  try { return await req.json(); } catch { return {}; }
}

/** Extract identity from verified Luth session; never from caller-supplied headers or query params. */
function getUserId(req: Request, _url?: URL): string {
  const authorization = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match ? match[1].split('.')[1] || '' : '';
}

interface LuthPrincipal { id: string; email: string; }

/** Verify the request against the canonical Luth session authority. */
async function authenticateRequest(request: Request): Promise<LuthPrincipal | Response> {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/i.test(authorization.trim())) {
    return jsonRes({ success: false, error: 'A verified Luth session is required.' }, 401);
  }
  try {
    const res = await fetch(`${DEFAULT_LUTH_URL}/api/session`, {
      headers: { authorization, 'x-app-id': 'srkl', 'cache-control': 'no-store' },
    });
    if (!res.ok) return jsonRes({ success: false, error: 'The Luth session is invalid or expired.' }, 401);
    const payload = await res.json() as { authenticated?: boolean; user?: { id?: string; email?: string } };
    if (payload.authenticated !== true || !payload.user?.id || !payload.user?.email) {
      return jsonRes({ success: false, error: 'The Luth session is invalid or expired.' }, 401);
    }
    return { id: String(payload.user.id), email: String(payload.user.email) };
  } catch {
    return jsonRes({ success: false, error: 'Canonical Luth authentication service unavailable.' }, 503);
  }
}

export async function fetchHandler(request: Request, env: Env = {}): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;

  // 1. CORS preflight — never reaches auth or route handlers
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  // 1.5 Transparent WASM sidecar decompression (Cloudflare 25 MiB asset limit)
  if (method === 'GET' && pathname.endsWith('.wasm') && env.ASSETS) {
    const gzRes = await env.ASSETS.fetch(new Request(`${url.origin}${pathname}.gz`, request));
    if (gzRes.ok) {
      const h = new Headers(gzRes.headers);
      h.set('Content-Type', 'application/wasm');
      h.set('Cache-Control', 'public, max-age=31536000, immutable');
      h.delete('Content-Encoding');
      h.delete('Content-Length');
      return new Response(gzRes.body?.pipeThrough(new DecompressionStream('gzip')), { status: 200, headers: h });
    }
  }

  // 2. Non-API asset passthrough (Cloudflare Workers ASSETS binding)
  //    Excludes /health and /api/* so probes and API calls are not intercepted.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function' && !pathname.startsWith('/api/') && pathname !== '/health') {
    return await env.ASSETS.fetch(request);
  }

  // 3. Health probe — public, no auth required
  if (pathname === '/api/health' || pathname === '/health') {
    return jsonRes({ status: 'ok', runtime: 'cloudflare-worker', timestamp: new Date().toISOString() });
  }

  // 4. Deployment self-registration (side effect only; response continues)
  const deploymentCandidate = typeof env.APP_URL === 'string' && env.APP_URL.trim()
    ? env.APP_URL.trim() : url.origin;
  if (deploymentCandidate && !deploymentCandidate.includes('localhost') && !deploymentCandidate.includes('127.0.0.1')) {
    try {
      const { registerSrklDeployment } = await import('../registry/SrklDeploymentRegistry');
      await registerSrklDeployment(env, deploymentCandidate);
    } catch {}
  }

  // 5. Public deployment registry API
  if (pathname === '/api/registry/deployments') {
    const { getRegisteredSrklDeployments } = await import('../registry/SrklDeploymentRegistry');
    const deployments = await getRegisteredSrklDeployments(env);
    return jsonRes({ ok: true, deployments });
  }

  // 6. Canonical Luth authentication gate — all protected routes below require a valid principal
  const luthPrincipal = await authenticateRequest(request);
  if (luthPrincipal instanceof Response) return luthPrincipal;

  try {
    // 7. Delegated route handlers (Aiko / FOD) — always after the Luth boundary
    const aikoRes = await handleAikoRoutes(request);
    if (aikoRes) return aikoRes;
    const fodRes = await handleFodRoutes(request);
    if (fodRes) return fodRes;

    // 8. SRKL business services
    if (pathname === '/api/backblaze/buckets' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.listB2Buckets(b.keyId, b.applicationKey, b.bucketId));
    }
    if (pathname === '/api/backblaze/files' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.listB2Files(b.keyId, b.applicationKey, b.bucketId, b.prefix, b.delimiter, b.maxFileCount));
    }
    if (pathname === '/api/backblaze/create-bucket' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.createB2Bucket(b.keyId, b.applicationKey, b.bucketName, b.bucketType));
    }
    if (pathname === '/api/backblaze/delete-bucket' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.deleteB2Bucket(b.keyId, b.applicationKey, b.bucketId));
    }
    if (pathname === '/api/backblaze/upload' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.uploadB2File(b.keyId, b.applicationKey, b.bucketId, b.fileName, b.fileBase64, b.contentType, b.sha1));
    }
    if (pathname === '/api/backblaze/delete-file' && method === 'POST') {
      const b = await parseBody(request);
      return jsonRes(await SrklBackend.services.coreBackblaze.deleteB2FileVersion(b.keyId, b.applicationKey, b.fileName, b.fileId));
    }

    if (pathname === '/api/workspaces') {
      const uId = getUserId(request, url);
      if (method === 'GET') return jsonRes(await SrklBackend.services.coreWorkspaces.getWorkspaces(uId, env));
      if (method === 'POST') return jsonRes(await SrklBackend.services.coreWorkspaces.createWorkspace(uId, await parseBody(request), env));
    }
    if (pathname === '/api/workspaces/storage-connections') {
      const uId = getUserId(request, url);
      if (method === 'POST') return jsonRes(await SrklBackend.services.coreWorkspaces.saveStorageConnection(uId, await parseBody(request), env));
      if (method === 'DELETE') {
        const b = await parseBody(request);
        const cId = b.id || url.searchParams.get('id') || '';
        return jsonRes(await SrklBackend.services.coreWorkspaces.deleteStorageConnection(uId, cId, env));
      }
    }

    if (pathname === '/api/ecosystem/health') return jsonRes(SrklBackend.services.coreEcosystem.getEcosystemHealth());
    if (pathname === '/api/ecosystem/apps') return jsonRes(await SrklBackend.services.coreEcosystem.getEcosystemApps(env));
    if (pathname === '/api/ecosystem/services') return jsonRes(await SrklBackend.services.coreEcosystem.getEcosystemServices(getUserId(request, url), env));

    if (pathname === '/api/services/sync') {
      const uId = getUserId(request, url) || 'guest';
      return jsonRes({ success: true, ...(await SrklBackend.orchestrations.serviceSyncOrchestration(uId)) });
    }
    if (pathname === '/api/cluster/scan') {
      const targetIp = request.headers.get('x-target-ip') || '127.0.0.1';
      return jsonRes({ success: true, cluster: await SrklBackend.orchestrations.clusterScanOrchestration(targetIp) });
    }

    // 9. Unknown protected-route fallback
    return jsonRes({ success: false, error: 'Not Found', target: 'SrklBackend-HTTPS-Adapter', path: pathname }, 404);
  } catch (err: any) {
    return jsonRes({ success: false, error: err.message || 'Internal Server Error' }, 500);
  }
}

export default { fetch: fetchHandler };
