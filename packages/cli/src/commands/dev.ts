/**
 * @file dev.ts
 * @description Local development server and continuous ambient declaration watcher.
 */

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { KrnlPackageReconciler } from '@ultrst-armada/krnl-core';
import { generateMagneticDeclarations } from './watch.js';

export interface DevOptions {
  port?: number;
  entity?: string;
  all?: boolean;
  dryRun?: boolean;
}

export interface DevServerInstance {
  server?: http.Server;
  close: () => Promise<void>;
  port: number;
}

export async function runDev(
  projectRoot: string = process.cwd(),
  options: DevOptions = {}
): Promise<DevServerInstance> {
  const port = options.port ?? 8080;

  // 1. Reconcile package dependencies from manifests
  KrnlPackageReconciler.reconcile(projectRoot, true);

  // 2. Generate ambient declarations
  generateMagneticDeclarations(projectRoot);

  if (options.dryRun) {
    console.log(`⚡ [Krnl Dev] Development environment verified on port ${port} (--dry-run).`);
    return {
      port,
      close: async () => {},
    };
  }

  // 3. Create active HTTP development server
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/' || url.pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', service: 'krnl-dev', port, uptime: process.uptime() }));
      return;
    }

    if (url.pathname === '/manifest') {
      const pkgPath = path.join(projectRoot, 'package.json');
      const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : {};
      res.writeHead(200);
      res.end(JSON.stringify({ name: pkg.name || 'krnl-app', version: pkg.version || '1.0.0' }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(port, () => resolve());
    server.on('error', reject);
  });

  console.log(`⚡ [Krnl Dev] Development server listening on http://localhost:${port}`);

  // 4. File watcher for hot declarations & manifests
  const watcher = fs.watch(projectRoot, { recursive: true }, (_evt, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.js')) && !filename.includes('krnl-magnetic.d.ts')) {
      try { generateMagneticDeclarations(projectRoot); } catch {}
    }
    if (filename && filename.endsWith('manifest.json')) {
      try { KrnlPackageReconciler.reconcile(projectRoot, true); } catch {}
    }
  });

  const close = async () => {
    watcher.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };

  return { server, close, port };
}
