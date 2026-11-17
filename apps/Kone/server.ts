/**
 * @file server.ts
 * @description Universal dev and production server using native Node HTTP.
 * Delegates API routes to the universal HTTPS adapter and serves the Vite application.
 */

import 'dotenv/config';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { adaptNodeRequest } from './src/backend/adapters/nodeBridge';
import { normalizeEnv } from './src/backend/adapters/universalEntry';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const runtimeGlobal = globalThis as typeof globalThis & {
    window?: { location?: { origin?: string }; addEventListener?: (...args: any[]) => void; removeEventListener?: (...args: any[]) => void };
    localStorage?: Storage;
    sessionStorage?: Storage;
  };
  const createMemoryStorage = (): Storage => {
    const values = new Map<string, string>();
    return {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => { values.delete(key); },
      setItem: (key, value) => { values.set(key, String(value)); },
    };
  };
  if (!runtimeGlobal.localStorage) runtimeGlobal.localStorage = createMemoryStorage();
  if (!runtimeGlobal.sessionStorage) runtimeGlobal.sessionStorage = createMemoryStorage();
  if (!runtimeGlobal.window) runtimeGlobal.window = {
    location: { origin: `http://localhost:${process.env.PORT || '3000'}` },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  
  (globalThis as any).AudioContext = class {
    constructor() {}
    close() {}
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { connect: () => {}, gain: { value: 1 } }; }
    get destination() { return {}; }
  };
  (globalThis as any).webkitAudioContext = (globalThis as any).AudioContext;

  const { fetchHandler } = await import('./src/backend/adapters/httpsAdapter');
  const isProd = process.env.NODE_ENV === 'production';
  let vite: any = null;
  if (!isProd) vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/health')) {
      return adaptNodeRequest(req, res, (request: Request) =>
        fetchHandler(request, normalizeEnv(process.env as unknown as Parameters<typeof fetchHandler>[1], request.url))
      );
    }

    if (!isProd && vite) {
      vite.middlewares(req, res, async () => {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(template);
        } catch (error: any) {
          vite.ssrFixStacktrace(error as Error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(error.stack || error.message);
        }
      });
      return;
    }

    const distPath = path.join(process.cwd(), 'dist');
    const filePath = path.join(distPath, url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime: Record<string, string> = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.wasm': 'application/wasm',
      };
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexFile, 'utf-8'));
      return;
    }
    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kone] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Kone] Failed to start server:', error);
  process.exit(1);
});