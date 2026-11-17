/**
 * Node-only local development server. Route behavior remains in the Web-standard Fetch app.
 */
import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { fetchHandler, type Env } from './src/backend/adapters/httpsAdapter.js';

const PORT = Number(process.env.PORT || 3000);

async function toWebRequest(req: http.IncomingMessage): Promise<Request> {
  const protocol = req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http');
  const host = req.headers.host || 'localhost';
  const chunks: Buffer[] = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  return new Request(`${protocol}://${host}${req.url || '/'}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
  });
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const vite = isProd ? null : await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/mcp') || url.startsWith('/health')) {
      try {
        const response = await fetchHandler(await toWebRequest(req), process.env as unknown as Env);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }));
      }
      return;
    }

    if (!isProd && vite) {
      vite.middlewares(req, res, async () => {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.writeHead(200, { 'content-type': 'text/html' });
          res.end(template);
        } catch (error) {
          vite.ssrFixStacktrace(error as Error);
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end(error instanceof Error ? error.stack || error.message : 'Internal Server Error');
        }
      });
      return;
    }

    const distPath = path.join(process.cwd(), 'dist/client');
    const filePath = path.join(distPath, url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime: Record<string, string> = {
        '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
        '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
        '.wasm': 'application/wasm',
      };
      res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
      return;
    }
    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(fs.readFileSync(indexFile));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, '0.0.0.0', () => console.log(`[Skipo] Local server listening on ${PORT}`));
}

startServer().catch((error) => {
  console.error('[Skipo] Failed to start local server:', error);
  process.exit(1);
});
