/**
 * @file nodeBridge.ts
 * @description Bridges Node.js IncomingMessage / ServerResponse to Web Standard fetch.
 * Enables identical execution in Node.js (Vercel Serverless / local dev) and Cloudflare Workers (< 100 lines).
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

  const protocol = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');
  const host = req.headers.host || 'localhost:3000';
  const url = new URL(req.url || '/', `${protocol}://${host}`);

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

  const webRes = await fetchHandler(webReq, env || process.env);

  res.statusCode = webRes.status;
  webRes.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  const text = await webRes.text();
  res.end(text);
}
