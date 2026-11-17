/**
 * @file universalEntry.ts
 * @description Single Universal Backend Entrypoint for Aiko.
 * Canonical Web-standard Fetch application running on Cloudflare Workers and serverless runtimes.
 */

import { fetchHandler, type Env } from './httpsAdapter.js';
import { normalizeSystemEnvironment } from '@ultrst-armada/kloks/backend/resolver';
import { handleRemoteMcp } from '../../mcp/remoteServer.js';

export function normalizeEnv(env: Env = {}, requestUrl?: string): Env {
  // One portable implementation owns URL normalization and APP_URL fallback.
  return normalizeSystemEnvironment(env, {}, requestUrl) as Env;
}

// Backwards-compatible alias for existing imports
export const normalizeSystemDatabaseEnv = normalizeEnv;

export async function routeRequest(request: Request, env: Env = {}): Promise<Response> {
  const normalizedEnv = normalizeEnv(env, request.url);
  return new URL(request.url).pathname === '/mcp'
    ? handleRemoteMcp(request, normalizedEnv)
    : fetchHandler(request, normalizedEnv);
}

export default {
  async fetch(request: Request, env: Env = {}, ctx?: any): Promise<Response> {
    return routeRequest(request, env);
  },
};

export { fetchHandler };
