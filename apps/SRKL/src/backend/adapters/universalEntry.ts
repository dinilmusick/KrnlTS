/**
 * @file universalEntry.ts
 * @description Single Universal Backend Entrypoint for SRKL.
 * Canonical Web-standard Fetch application running on Cloudflare Workers and serverless runtimes.
 */

import { fetchHandler, Env } from './httpsAdapter';

export function normalizeEnv(env: Env = {}, requestUrl?: string): Env {
  // The Fetch entrypoint consumes only platform-provided bindings. Node
  // adapters pass their environment object explicitly; Workers pass
  // platform bindings. No implicit runtime-global fallback exists here.
  const appUrl = typeof env.APP_URL === 'string' && env.APP_URL.trim()
    ? env.APP_URL.trim()
    : (requestUrl ? new URL(requestUrl).origin : undefined);
  return {
    ...env,
    SYSTEM_DATABASE_URL: env.SYSTEM_DATABASE_URL,
    SYSTEM_DATABASE_URL_2: env.SYSTEM_DATABASE_URL_2,
    SYSTEM_DATABASE_URL_3: env.SYSTEM_DATABASE_URL_3,
    APP_URL: appUrl,
  };
}

export default {
  async fetch(request: Request, env: Env = {}, ctx?: any): Promise<Response> {
    return fetchHandler(request, normalizeEnv(env, request.url));
  },
};

export { fetchHandler };
