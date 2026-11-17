import { WorkspaceServiceFacade, SrklServiceFacade } from '@ultrst-armada/kloks/backend/krnl-services';
import { handleFodRoutes } from './fodRoutes.js';
import { handleAikoRoutes } from './aikoRoutes.js';
import { handleConversationRoutes } from './conversationRoutes.js';
import { handlePerformanceRoutes } from './performanceRoutes.js';
import { authenticateLuthRequest, proxyLuthAuthRequest } from '../auth/luthSession.js';
import { normalizeSystemEnvironment } from './systemEnvironment.js';

import { corsHeaders, jsonRes, parseBody } from './httpResponse.js';
import { handleStorageRoutes } from './storageRoutes.js';
import { handleGoogleDriveStorageRoutes } from './googleDriveStorageRoutes.js';

export interface Env {
  SYSTEM_DATABASE_URL?: string;
  SYSTEM_DATABASE_URL_2?: string;
  SYSTEM_DATABASE_URL_3?: string;
  APP_URL?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: unknown;
}

/**
 * Cloudflare static assets have a 25 MiB per-file upload limit. The build
 * emits WASM as .wasm.gz sidecars; restore the original URL and MIME type
 * here so browser consumers (including ONNX Runtime) remain unaware.
 */
async function serveCompressedWasm(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.endsWith('.wasm') || !env.ASSETS) return null;

  const compressedUrl = new URL(url);
  compressedUrl.pathname = `${compressedUrl.pathname}.gz`;
  const compressed = await env.ASSETS.fetch(new Request(compressedUrl, request));
  if (!compressed.ok) return null;

  const headers = new Headers(compressed.headers);
  headers.set('Content-Type', 'application/wasm');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');

  if (typeof DecompressionStream === 'undefined') {
    return new Response('WASM decompression is unavailable in this runtime.', { status: 500 });
  }
  const decompressed = compressed.body?.pipeThrough(new DecompressionStream('gzip'));
  if (!decompressed) return new Response(null, { status: 502 });
  return new Response(decompressed, { status: 200, headers });
}

function serviceEnv(env: Env, requestUrl: string): Record<string, unknown> {
  return normalizeSystemEnvironment({ ...env, WORKSPACE_APP_ID: 'kone' }, requestUrl);
}

export async function fetchHandler(request: Request, env: Env = {}): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const { method } = request;

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });

  if (method === 'GET') {
    const wasmResponse = await serveCompressedWasm(request, env);
    if (wasmResponse) return wasmResponse;
  }

  const proxied = await proxyLuthAuthRequest(request);
  if (proxied) {
    const h = new Headers(proxied.headers);
    Object.entries(corsHeaders(request)).forEach(([key, value]) => h.set(key, value));
    return new Response(proxied.body, { status: proxied.status, headers: h });
  }

  const auth = await authenticateLuthRequest(request);
  if (auth.status) return jsonRes(request, { success: false, error: auth.error }, auth.status);
  if (auth.request) request = auth.request;

  const userId = request.headers.get('x-user-id') || 'system';
  const envForServices = serviceEnv(env, request.url);

  // Exercise the same Kloks WorkspaceService -> queryUnifiedDb path used by
  // application workspace loading. This is authenticated and returns no data.
  if (pathname === '/api/health/database' && method === 'GET') {
    try {
      await WorkspaceServiceFacade.execute('listWorkspaces', { userId, env: envForServices });
      return jsonRes(request, { status: 'ok', service: 'kone', database: 'connected' });
    } catch {
      return jsonRes(request, {
        status: 'error',
        service: 'kone',
        database: 'unavailable',
        error: 'Canonical database query failed.',
      }, 503);
    }
  }

  const storageRoute = pathname.startsWith('/api/v1/') ? pathname.replace('/api/v1', '/api') : pathname;
  const storageResponse = await handleStorageRoutes(request, storageRoute, userId, envForServices)
    ?? await handleGoogleDriveStorageRoutes(request, storageRoute, userId, envForServices);
  if (storageResponse) return storageResponse;

  const performanceResponse = await handlePerformanceRoutes(request, userId, envForServices);
  if (performanceResponse) {
    const headers = new Headers(performanceResponse.headers);
    Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
    return new Response(performanceResponse.body, {
      status: performanceResponse.status,
      statusText: performanceResponse.statusText,
      headers,
    });
  }

  for (const handler of [handleFodRoutes, handleAikoRoutes, handleConversationRoutes]) {
    const response = await handler(request);
    if (response) {
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
  }

  if (pathname === '/api/health' || pathname === '/health') {
    return jsonRes(request, { status: 'ok', service: 'kone', timestamp: new Date().toISOString() });
  }

  if (pathname === '/api/auth/workspaces') {
    try {
      if (method === 'GET') {
        return jsonRes(request, await WorkspaceServiceFacade.execute('listWorkspaces', { userId, env: envForServices }));
      }

      if (method === 'POST') {
        const body = await parseBody(request) as any;
        const workspace = body.workspace ?? body;
        const result = await WorkspaceServiceFacade.execute('createWorkspace', { userId, workspace, env: envForServices });
        return jsonRes(request, result, 201);
      }

      if (method === 'PUT') {
        const body = await parseBody(request) as any;
        const result = await WorkspaceServiceFacade.execute('updateWorkspace', {
          userId,
          params: { action: body.action, workspaceId: body.workspaceId ?? body.id, updates: body.updates ?? body },
          env: envForServices,
        });
        return jsonRes(request, result);
      }

      if (method === 'DELETE') {
        const workspaceId = url.searchParams.get('workspaceId') || url.searchParams.get('id') || '';
        if (!workspaceId) return jsonRes(request, { success: false, error: 'workspaceId is required' }, 400);
        const result = await WorkspaceServiceFacade.execute('deleteWorkspace', { userId, workspaceId, env: envForServices });
        return jsonRes(request, result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonRes(request, { success: false, error: message }, /not found/i.test(message) ? 404 : 500);
    }
  }

  if (pathname === '/api/srkl/accounts' && method === 'GET') {
    try {
      const service = url.searchParams.get('service') || undefined;
      const result = await SrklServiceFacade.execute('getAccounts', { userId, service, env: envForServices });
      return jsonRes(request, result);
    } catch (error) {
      return jsonRes(request, { success: false, error: error instanceof Error ? error.message : String(error) }, 500);
    }
  }

  if (env.ASSETS && !pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  return jsonRes(request, { error: 'Not Found', path: pathname }, 404);
}
