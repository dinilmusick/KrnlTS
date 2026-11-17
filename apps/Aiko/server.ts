import 'dotenv/config';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { workingWorkspaceService } from '@ultrst-armada/kloks/backend/workspace/node';
import { configureNodeWorkspaceService } from './src/backend/storage/workspaceStorage.js';
import { configureStorageNodeWorkspaceService } from './src/backend/adapters/storageFetchHandler.js';
import { resolveRequestOrigin } from './src/backend/adapters/requestOrigin.js';
import { adaptNodeRequest } from './src/backend/adapters/nodeBridge.js';
import universalEntry from './src/backend/adapters/universalEntry.js';

function resolvePort(): number {
  if (process.env.APP_URL) {
    try {
      const parsed = new URL(process.env.APP_URL).port;
      if (parsed) return Number(parsed);
    } catch {}
  }
  return 3000;
}

const PORT = resolvePort();

function getGatewayDomain(req: http.IncomingMessage): string {
  return resolveRequestOrigin(
    { remoteAddress: req.socket.remoteAddress, forwardedHost: req.headers['x-forwarded-host'], forwardedProto: req.headers['x-forwarded-proto'] },
    process.env.APP_URL
  );
}

async function startServer() {
  const isProd = !process.argv[1]?.endsWith('.ts');
  let vite: any = null;

  // Keep the Node-only Kloks service injected at the Node bootstrap boundary.
  configureNodeWorkspaceService(workingWorkspaceService);
  configureStorageNodeWorkspaceService(workingWorkspaceService as any);

  if (!isProd) {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/.skipo/**', '**/.aiko_vault/**', '**/data/**', '**/*.log', '**/*.json', '**/tmp/**'],
        },
      },
      appType: 'custom',
    });
  }

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    // 1. API, Health, and MCP routes -> pure Web-standard Fetch application
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/health') || url === '/mcp') {
      return adaptNodeRequest(req, res, universalEntry.fetch, process.env);
    }

    // 2. Vite Dev Middleware / SPA serving
    if (!isProd && vite) {
      vite.middlewares(req, res, async () => {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          const envScript = `<script>window.__AIKO_ENV__ = ${JSON.stringify({
            AIKO_GATEWAY_DOMAIN: getGatewayDomain(req),
          })};</script>`;
          template = template.replace('</head>', `${envScript}</head>`);
          template = await vite.transformIndexHtml(url, template);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e as Error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(e.stack || e.message);
        }
      });
      return;
    }

    // 3. Production static asset serving
    const distPath = path.join(process.cwd(), 'dist');
    const filePath = path.join(distPath, url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.wasm': 'application/wasm',
      };
      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback
    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      let template = fs.readFileSync(indexFile, 'utf-8');
      const envScript = `<script>window.__AIKO_ENV__ = ${JSON.stringify({
        AIKO_GATEWAY_DOMAIN: getGatewayDomain(req),
      })};</script>`;
      template = template.replace('</head>', `${envScript}</head>`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(template);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aiko Server] Multi-Vendor AI Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Aiko Server] Failed to start server:', err);
  process.exit(1);
});
