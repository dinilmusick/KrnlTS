import { resolveRequestOrigin } from './requestOrigin.js';

/**
 * @file nodeBridge.ts
 * @description Bridges Node.js IncomingMessage / ServerResponse to Web Standard fetch.
 * Enables identical execution in Node.js (local dev) and Cloudflare Workers (< 100 lines).
 */

export async function adaptNodeRequest(
  req: any,
  res: any,
  fetchHandler: (req: Request, env?: any) => Promise<Response>,
  env?: any
) {
  if (req instanceof Request) {
    return fetchHandler(req, env);
  }

  const runtimeEnv = env || process.env;
  const origin = resolveRequestOrigin({ remoteAddress: req.socket?.remoteAddress, forwardedHost: req.headers['x-forwarded-host'], forwardedProto: req.headers['x-forwarded-proto'] }, runtimeEnv.APP_URL || process.env.APP_URL);
  const requestPath = typeof req.url === 'string' && req.url.startsWith('/') ? req.url : '/';
  const url = new URL(requestPath, origin);

  let body: any = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body && typeof req.body === 'object') {
      body = JSON.stringify(req.body);
    } else if (typeof req.body === 'string') {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString();
    }
  }

  const webReq = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: body && body.length > 0 ? body : undefined,
  });

  const webRes = await fetchHandler(webReq, runtimeEnv);

  res.statusCode = webRes.status;
  const setCookies = (webRes.headers as any).getSetCookie?.();
  if (Array.isArray(setCookies) && setCookies.length > 0) {
    res.setHeader('set-cookie', setCookies);
  }
  webRes.headers.forEach((val, key) => {
    if (key.toLowerCase() === 'set-cookie' && Array.isArray(setCookies) && setCookies.length > 0) return;
    res.setHeader(key, val);
  });
  const buffer = Buffer.from(await webRes.arrayBuffer());
  res.end(buffer);
}
