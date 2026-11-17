/**
 * @file universalEntry.ts
 * @description Single Universal Backend Entrypoint for Kone.
 * Canonical Web-standard Fetch application running on Cloudflare Workers and serverless runtimes.
 */

import { fetchHandler, Env } from './httpsAdapter';
import { normalizeSystemEnvironment } from './systemEnvironment.js';

export function normalizeEnv(env: Env = {}, requestUrl?: string): Env {
  // One portable implementation owns URL normalization and APP_URL fallback.
  return normalizeSystemEnvironment(env, requestUrl) as Env;
}

export default {
  async fetch(request: Request, env: Env = {}, ctx?: any): Promise<Response> {
    return fetchHandler(request, normalizeEnv(env, request.url));
  },
};

export { fetchHandler };