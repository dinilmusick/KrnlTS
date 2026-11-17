import { fetchHandler } from '../backend/adapters/httpsAdapter.js';

/** Cloudflare Worker adapter; all routes share the Web-standard Fetch handler. */
export default {
  fetch(request: Request, env: any, _ctx: ExecutionContext) {
    return fetchHandler(request, env);
  },
};
