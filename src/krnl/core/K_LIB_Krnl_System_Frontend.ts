import fs from 'fs';
import path from 'path';
import http from 'http';
import { KrnlFrontendOptions } from './types.js';

export class KrnlFrontend {
  system: any;
  options: KrnlFrontendOptions;
  frontendDir: string;
  subAppFrontendDirs: Map<string, string> = new Map();
  interactionsHistory: any[] = [];

  constructor(system: any, options: KrnlFrontendOptions = {}) {
    this.system = system;
    this.options = {
      title: system.entityName,
      theme: 'dark',
      enableMonitoringApi: true,
      ...options
    };
    this.frontendDir = options.frontendDir || path.join(system._entityDataDir, 'frontend');
  }

  registerSubAppFrontend(prefix: string, subFrontendDir: string): void {
    this.subAppFrontendDirs.set(prefix.toLowerCase(), subFrontendDir);
    console.log(`[KrnlFrontend] Registered sub-app frontend '${prefix}' -> ${subFrontendDir}`);
  }

  async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, subpath: string): Promise<void> {
    const rawPath = subpath.split('?')[0];
    const normalized = rawPath.replace(/\/$/, '') || '/';

    // 1. Root index.html
    if ((normalized === '/' || normalized === '/index.html') && req.method === 'GET') {
      let htmlPath = path.join(this.frontendDir, 'index.html');
      if (!fs.existsSync(htmlPath)) {
        // Trigger auto-skeleton ensure if missing
        try {
          const { KrnlFrontendGenerator } = require('./K_LIB_Krnl_Frontend_Generator.js');
          KrnlFrontendGenerator.ensureFrontendSkeleton(this.system, this.frontendDir);
        } catch (_) {}
      }
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(htmlPath));
        return;
      }
    }

    // 2. Main bundle JS
    if (normalized === '/bundle.js' && req.method === 'GET') {
      let bundlePath = path.join(this.frontendDir, 'dist', 'bundle.js');
      if (!fs.existsSync(bundlePath)) {
        try {
          const { KrnlFrontendGenerator } = require('./K_LIB_Krnl_Frontend_Generator.js');
          const { KrnlFrontendBuilder } = require('./K_LIB_Krnl_Frontend_Builder.js');
          KrnlFrontendGenerator.generate(this.system, this.frontendDir);
          KrnlFrontendBuilder.build(this.frontendDir);
        } catch (e) {
          console.error('[KrnlFrontend] On-demand bundle build error:', e);
        }
      }
      if (fs.existsSync(bundlePath)) {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync(bundlePath));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/javascript' });
      res.end('/* bundle.js not found. Ensure frontend component generation & build completed. */');
      return;
    }

    // 3. Central Parent Stylesheet (Styles trickle down to sub-apps from here)
    if ((normalized === '/styles.css' || normalized === '/index.css') && req.method === 'GET') {
      const cssPath = path.join(this.frontendDir, 'index.css');
      if (fs.existsSync(cssPath)) {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(fs.readFileSync(cssPath));
        return;
      }

      // Built-in library fallback CSS authority
      const libCssCandidates = [
        path.resolve(process.cwd(), 'dist/frontend/index.css'),
        path.resolve(process.cwd(), 'src/krnl/frontend/index.css'),
        path.resolve(process.cwd(), 'node_modules/krnlts/dist/frontend/index.css'),
        path.resolve(process.cwd(), 'node_modules/krnlts/src/krnl/frontend/index.css')
      ];
      const fallbackCssPath = libCssCandidates.find(c => fs.existsSync(c));
      if (fallbackCssPath) {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(fs.readFileSync(fallbackCssPath));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/css' });
      res.end('/* styles.css / index.css not found */');
      return;
    }

    // 4. Sub-App static frontend file routing (/subapps/<prefix>/...)
    if (normalized.startsWith('/subapps/')) {
      const parts = normalized.split('/').filter(Boolean); // ['subapps', prefix, ...]
      const prefix = parts[1]?.toLowerCase();
      let subDir = prefix ? this.subAppFrontendDirs.get(prefix) : undefined;
      if (!subDir && prefix) {
        const candidate1 = path.join(this.system._entityDataDir || '.', 'subapps', prefix, 'frontend');
        const candidate2 = path.join(process.cwd(), 'subapps', prefix, 'frontend');
        if (fs.existsSync(candidate1)) subDir = candidate1;
        else if (fs.existsSync(candidate2)) subDir = candidate2;
      }

      if (subDir && fs.existsSync(subDir)) {
        const fileRel = parts.slice(2).join('/'); // '', 'bundle.js', etc.

        // Sub-app styles load parent's stylesheet (trickle-down style authority)
        if (fileRel === 'styles.css') {
          const cssPath = path.join(this.frontendDir, 'index.css');
          if (fs.existsSync(cssPath)) {
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(fs.readFileSync(cssPath));
            return;
          }
        }

        if (!fileRel || fileRel === 'index.html') {
          const subHtml = path.join(subDir, 'index.html');
          if (fs.existsSync(subHtml)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(subHtml));
            return;
          }
        }

        if (fileRel === 'bundle.js') {
          const subBundle = path.join(subDir, 'dist', 'bundle.js');
          if (fs.existsSync(subBundle)) {
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(fs.readFileSync(subBundle));
            return;
          }
        }

        // Generic static asset fallback inside sub-app frontend
        const assetPath = path.join(subDir, fileRel);
        if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
          res.writeHead(200);
          res.end(fs.readFileSync(assetPath));
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: `Sub-app frontend asset '${normalized}' not found.` }));
      return;
    }

    // 5. In-process API endpoint invocation (/api/<fid>)
    if (normalized.startsWith('/api/')) {
      const parts = normalized.split('/');
      const fid = parts[2];
      if (!fid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Missing functionality ID' }));
        return;
      }

      const functionality = this.system.resolveLocalFunctionality
        ? this.system.resolveLocalFunctionality(fid)
        : this.system.localFunctionalities.get(fid);

      if (!functionality) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: `Functionality ${fid} not found` }));
        return;
      }

      let body = {};
      if (req.method === 'POST') {
        body = await this._readJsonBody(req);
      } else if (req.method === 'GET') {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        body = Object.fromEntries(url.searchParams.entries());
      }

      try {
        const result = await this.system.call(fid, body, {
          unwrap: false,
          callerPort: req.socket?.remotePort,
          accessKey: req.headers['x-krnl-access-key'] as string | undefined,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'error',
          message: e.message,
          errorDocumentation: e.errorDocumentation || null
        }));
      }
      return;
    }

    // 6. SSE Event Streams (/sse/<fid>)
    if (normalized.startsWith('/sse/')) {
      const parts = normalized.split('/');
      const fid = parts[2];
      if (!fid) {
        res.writeHead(400);
        res.end('Missing functionality ID');
        return;
      }

      const functionality = this.system.resolveLocalFunctionality
        ? this.system.resolveLocalFunctionality(fid)
        : this.system.localFunctionalities.get(fid);

      if (!functionality) {
        res.writeHead(404);
        res.end('Functionality not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const stateEmitter = functionality.emitters?.get('state:changed');
      const unsubscribe = stateEmitter?.subscribe((msg: any) => {
        res.write(`data: ${JSON.stringify(msg.data || msg)}\n\n`);
      });

      const interval = setInterval(() => {
        if (res.writable) {
          res.write(': keepalive\n\n');
        }
      }, 15000);

      req.on('close', () => {
        if (unsubscribe) unsubscribe();
        clearInterval(interval);
        res.end();
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: `Frontend route '${subpath}' not found` }));
  }

  private _readJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk.toString(); });
      req.on('end', () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON body'));
        }
      });
    });
  }
}
