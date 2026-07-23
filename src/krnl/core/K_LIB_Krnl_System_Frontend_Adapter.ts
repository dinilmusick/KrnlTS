import fs from 'fs';
import path from 'path';
import http from 'http';
import net from 'net';
import { fileURLToPath } from 'url';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
import { KrnlShell } from '../tools/KrnlShell.js';
import { KrnlCustomFrontendOptions } from './types.js';

const _metaUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : null;
const _filename = _metaUrl ? fileURLToPath(_metaUrl) : '';
const _dirname = _metaUrl ? path.dirname(_filename) : '';

export class KrnlFrontendAdapter extends krnlSystemEntityBase {
  childProcess: any = null;
  appPort: number = -1;
  socketPath: string | null = null;
  appPath: string;
  options: KrnlCustomFrontendOptions;
  originalConfigName: string | null = null;
  patchedConfigName: string | null = null;

  registeredRoutes = new Set<string>();
  routeWatcher: any = null;

  constructor(name: string, appPath: string, options: KrnlCustomFrontendOptions = {}) {
    // Custom frontend runs locally as an internal worker (via Unix Socket or loopback)
    super(`frontend-${name}`, null, -1, '127.0.0.1', { Singleton: true, _skipMagneticLoading: true });
    this.appPath = appPath;
    this.options = options;
    this._isIngressNetworkMember = true;

    // Override the unified HTTP adapter handleRequest to act as a reverse proxy
    this.unifiedHttpAdapter._handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (pathname.endsWith('/__krnl/config')) {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        // Normalise bind-all addresses — '::' and '0.0.0.0' are not valid browser-reachable hostnames.
        const rawHost = this.options.backendHost || '127.0.0.1';
        const host = (rawHost === '::' || rawHost === '0.0.0.0' || rawHost === '') ? 'localhost' : rawHost;
        const port = this.options.backendPort || 10099;
        const prefix = this.options.frontendPrefix || 'frontend';
        res.end(JSON.stringify({
          wsUrl: `ws://${host}:${port}/ws`,
          httpUrl: `http://${host}:${port}`,
          basePath: `/${prefix}/${this.entityName.replace(/^frontend-/, '').toLowerCase()}`,
          name: this.entityName.replace(/^frontend-/, '').toLowerCase()
        }));
        return;
      }

      if (pathname.endsWith('/__krnl/bridge.js')) {
        const candidatePaths = [
          path.resolve(_dirname, './K_LIB_Krnl_Frontend_Bridge_Bundle.global.js'),
          path.resolve(_dirname, './K_LIB_Krnl_Frontend_Bridge_Bundle.js'),
          path.resolve(_dirname, '../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.global.js'),
          path.resolve(_dirname, '../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.js'),
        ];
        const finalPath = candidatePaths.find(p => fs.existsSync(p));

        if (finalPath) {
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*' });
          res.end(fs.readFileSync(finalPath));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ status: 'error', message: `Bridge bundle not found. Tried paths: ${candidatePaths.join(', ')}` }));
        }
        return;
      }

      await this.proxyRequest(req, res, req.url || '/');
    };
  }

  async loadBridgesFromFolder(folderPath: string): Promise<void> {
    if (!fs.existsSync(folderPath)) return;
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (file.endsWith('.bridge.ts') || file.endsWith('.bridge.js')) {
        const fullPath = path.resolve(folderPath, file);
        try {
          const module = await import(fullPath);
          const bridgeDesc = module.bridge;
          if (bridgeDesc && bridgeDesc.name) {
            console.log(`[FrontendAdapter:${this.entityName}] Loaded bridge script: ${bridgeDesc.name}`);
            if (this.options.backendPort === undefined && bridgeDesc.backendPort !== undefined) {
              this.options.backendPort = bridgeDesc.backendPort;
            }
            if (this.options.backendHost === undefined && bridgeDesc.backendHost !== undefined) {
              this.options.backendHost = bridgeDesc.backendHost;
            }
          }
        } catch (err: any) {
          console.error(`[FrontendAdapter:${this.entityName}] Failed to load bridge script ${file}:`, err.message);
        }
      }
    }
  }

  async scanAndRegisterApiRoutes(): Promise<void> {
    const pagesApiDir = path.join(this.appPath, 'pages', 'api');
    const appDir = path.join(this.appPath, 'app');

    const foundRoutes: string[] = [];

    if (fs.existsSync(pagesApiDir)) {
      this._findPagesRoutes(pagesApiDir, pagesApiDir, foundRoutes);
    }
    if (fs.existsSync(appDir)) {
      this._findAppRoutes(appDir, appDir, foundRoutes);
    }

    for (const route of foundRoutes) {
      if (!this.registeredRoutes.has(route)) {
        this.registeredRoutes.add(route);
        this.addLocal({
          id: route,
          api: async (input: any) => {
            return new Promise((resolve, reject) => {
              const reqData = JSON.stringify(input || {});
              const reqOptions: http.RequestOptions = this.socketPath ? {
                socketPath: this.socketPath,
                path: `/${route}`,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(reqData)
                }
              } : {
                hostname: '127.0.0.1',
                port: this.appPort,
                path: `/${route}`,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(reqData)
                }
              };

              const req = http.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                  try {
                    resolve(JSON.parse(data));
                  } catch {
                    resolve({ status: 'success', raw: data });
                  }
                });
              });
              req.on('error', err => reject(err));
              req.write(reqData);
              req.end();
            });
          }
        });
        console.log(`[FrontendAdapter:${this.entityName}] Dynamically registered route endpoint: ${route}`);
      }
    }

    for (const route of Array.from(this.registeredRoutes)) {
      if (!foundRoutes.includes(route)) {
        this.localFunctionalities.delete(route);
        this.registeredRoutes.delete(route);
        console.log(`[FrontendAdapter:${this.entityName}] Dynamically removed route endpoint: ${route}`);
      }
    }
  }

  _findPagesRoutes(dir: string, baseDir: string, routes: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findPagesRoutes(fullPath, baseDir, routes);
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const rel = path.relative(baseDir, fullPath);
        const withoutExt = rel.substring(0, rel.lastIndexOf('.'));
        const routePath = `api/${withoutExt.replace(/\\/g, '/')}`;
        routes.push(routePath);
      }
    }
  }

  _findAppRoutes(dir: string, baseDir: string, routes: string[]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findAppRoutes(fullPath, baseDir, routes);
      } else if ((file === 'route.ts' || file === 'route.js') && dir.includes('api')) {
        const apiIndex = dir.indexOf('api');
        const routePath = dir.substring(apiIndex).replace(/\\/g, '/');
        routes.push(routePath);
      }
    }
  }

  setupApiRouteWatcher() {
    if (this.options.mode === 'prod') return;
    
    const pagesApiDir = path.join(this.appPath, 'pages', 'api');
    const appDir = path.join(this.appPath, 'app');

    const onChange = () => {
      this.scanAndRegisterApiRoutes().catch(console.error);
    };

    if (fs.existsSync(pagesApiDir)) {
      this.routeWatcher = fs.watch(pagesApiDir, { recursive: true }, onChange);
    } else if (fs.existsSync(appDir)) {
      this.routeWatcher = fs.watch(appDir, { recursive: true }, onChange);
    }
  }

  async startApp(): Promise<void> {
    // A. Discover bridges from wrapper directory and its 'bridges' subdirectory
    const wrapperDir = path.dirname(this.appPath);
    await this.loadBridgesFromFolder(wrapperDir);
    await this.loadBridgesFromFolder(path.join(wrapperDir, 'bridges'));

    // B. Scan and register API routes
    await this.scanAndRegisterApiRoutes();
    this.setupApiRouteWatcher();

    // 1. Detect framework from package.json
    let packageJson: any = {};
    const pkgPath = path.join(this.appPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch (_) {}
    }

    const isEsm = packageJson.type === 'module';
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let framework: 'nextjs' | 'vite' | 'generic' = 'generic';
    if (deps['next']) framework = 'nextjs';
    else if (deps['vite']) framework = 'vite';

    const cleanName = this.entityName.replace(/^frontend-/, '').toLowerCase();
    const prefix = this.options.frontendPrefix || 'frontend';
    const basePath = `/${prefix}/${cleanName}`;

    // 2. Setup Unix Domain Socket path & cleanup any leftover socket file
    const socketName = `krnl-frontend-${cleanName}.sock`;
    this.socketPath = path.join('/tmp', socketName);
    if (fs.existsSync(this.socketPath)) {
      try {
        fs.unlinkSync(this.socketPath);
      } catch (_) {}
    }

    // 3. Framework-specific programmatic configuration (basePath patching + self-healing check)
    if (framework === 'nextjs') {
      await this._patchNextConfig(basePath, isEsm);
    }

    const basePort = (this.options.backendPort && this.options.backendPort > 0)
      ? this.options.backendPort + 2000
      : 12000;

    // Clean up any stale worker process from a previous run occupying basePort
    try {
      const { execSync } = await import('child_process');
      const pids = execSync(`lsof -t -i :${basePort}`).toString().trim();
      if (pids) {
        execSync(`kill -9 ${pids.split(/\s+/).join(' ')} 2>/dev/null || true`);
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (_) {}

    this.appPort = await this._probeAvailablePort(basePort, '127.0.0.1');
    this.socketPath = null;

    let command = 'npx';
    let args: string[] = [];

    const nextBin = path.join(this.appPath, 'node_modules', '.bin', 'next');
    if (framework === 'nextjs') {
      if (fs.existsSync(nextBin)) {
        command = process.execPath;
        args = [nextBin, this.options.mode === 'prod' ? 'start' : 'dev', '-H', '127.0.0.1', '-p', this.appPort.toString()];
      } else {
        command = 'npx';
        args = ['next', this.options.mode === 'prod' ? 'start' : 'dev', '-H', '127.0.0.1', '-p', this.appPort.toString()];
      }
    } else if (framework === 'vite') {
      command = 'npx';
      args = ['vite', '--host', '127.0.0.1', '--port', this.appPort.toString(), '--strictPort', '--base', `${basePath}/`];
    } else {
      command = 'npm';
      args = ['run', this.options.mode === 'prod' ? 'start' : 'dev'];
    }

    // 5. Spawn process with injected env vars
    const host = this.options.backendHost || '127.0.0.1';
    const port = this.options.backendPort || 10099;
    const env = {
      ...process.env,
      ...(this.appPort > 0 ? { PORT: this.appPort.toString() } : {}),
      NEXT_PUBLIC_KRNL_BASE_PATH: basePath,
      NEXT_PUBLIC_KRNL_WS_URL: `ws://${host}:${port}/ws`,
      NEXT_PUBLIC_KRNL_HTTP_URL: `http://${host}:${port}`,
      ...this.options.env
    };

    const targetDesc = this.socketPath ? `Unix Socket: ${this.socketPath}` : `127.0.0.1:${this.appPort}`;
    console.log(`[FrontendAdapter] Spawning custom frontend '${this.entityName}' (${framework}) in background (${targetDesc})...`);
    this.childProcess = KrnlShell.spawn(command, args, {
      cwd: this.appPath,
      env,
      shell: true,
      stdio: 'inherit'
    });

    // 6. Probe socket or port until it starts responding
    let ready = false;
    const timeout = this.options.startupTimeoutMs ?? 60000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      ready = await new Promise<boolean>((resolve) => {
        if (this.socketPath) {
          if (!fs.existsSync(this.socketPath)) {
            resolve(false);
            return;
          }
          const socket = net.connect({ path: this.socketPath });
          socket.on('connect', () => {
            socket.destroy();
            resolve(true);
          });
          socket.on('error', () => resolve(false));
        } else {
          const socket = net.connect(this.appPort, '127.0.0.1');
          socket.on('connect', () => {
            socket.destroy();
            resolve(true);
          });
          socket.on('error', () => resolve(false));
        }
      });
      if (ready) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!ready) {
      throw new Error(`[FrontendAdapter] Custom frontend '${this.entityName}' failed to boot on ${targetDesc} within ${timeout / 1000}s.`);
    }
    console.log(`[FrontendAdapter] Custom frontend '${this.entityName}' successfully booted.`);
  }

  async _patchNextConfig(basePath: string, isEsm: boolean): Promise<void> {
    const configTs = path.join(this.appPath, 'next.config.ts');
    const configMjs = path.join(this.appPath, 'next.config.mjs');
    const configJs = path.join(this.appPath, 'next.config.js');

    // Self-healing check: if leftover .original exists from an ungraceful shutdown, restore it first
    this._restoreNextConfig();

    const targetConfig = fs.existsSync(configTs) ? configTs : fs.existsSync(configMjs) ? configMjs : fs.existsSync(configJs) ? configJs : null;

    if (targetConfig) {
      const content = fs.readFileSync(targetConfig, 'utf8');
      if (content.includes('NEXT_PUBLIC_KRNL_BASE_PATH')) {
        // App's config is already environment-aware; no runtime patching required
        return;
      }
      // Inject basePath safely before export default / module.exports if missing
      this.originalConfigName = path.basename(targetConfig) + '.bak';
      this.patchedConfigName = path.basename(targetConfig);
      fs.copyFileSync(targetConfig, path.join(this.appPath, this.originalConfigName));

      let updated = content;
      if (content.includes('const nextConfig') || content.includes('let nextConfig')) {
        updated = content.replace(/(const|let)\s+nextConfig\s*:\s*NextConfig\s*=\s*\{/, `$1 nextConfig: NextConfig = {\n  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
      } else if (content.includes('module.exports = {')) {
        updated = content.replace('module.exports = {', `module.exports = {\n  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
      } else if (content.includes('export default {')) {
        updated = content.replace('export default {', `export default {\n  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',`);
      } else {
        updated = content + `\n// KrnlTS injected basePath\nif (typeof module !== 'undefined' && module.exports) { module.exports.basePath = process.env.NEXT_PUBLIC_KRNL_BASE_PATH || ''; }\n`;
      }
      fs.writeFileSync(targetConfig, updated, 'utf8');
    } else {
      // Create a default next.config.ts
      this.patchedConfigName = 'next.config.ts';
      const newConfigContent = `import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {\n  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '',\n};\nexport default nextConfig;\n`;
      fs.writeFileSync(path.join(this.appPath, this.patchedConfigName), newConfigContent, 'utf8');
    }
  }

  _restoreNextConfig(): void {
    const checkAndRestore = (origName: string, patchedName: string) => {
      const origPath = path.join(this.appPath, origName);
      const patchedPath = path.join(this.appPath, patchedName);
      if (fs.existsSync(origPath)) {
        if (fs.existsSync(patchedPath)) {
          fs.unlinkSync(patchedPath);
        }
        fs.renameSync(origPath, patchedPath);
      }
    };

    checkAndRestore('next.config.original.ts', 'next.config.ts');
    checkAndRestore('next.config.original.mjs', 'next.config.mjs');
    checkAndRestore('next.config.original.js', 'next.config.js');

    this.originalConfigName = null;
    this.patchedConfigName = null;
  }

  async proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void> {
    if (!this.socketPath && this.appPort === -1) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Service Temporarily Unavailable: Frontend not running.' }));
      return;
    }

    const options: http.RequestOptions = this.socketPath ? {
      socketPath: this.socketPath,
      path: subPath,
      method: req.method,
      headers: req.headers
    } : {
      hostname: '127.0.0.1',
      port: this.appPort,
      path: subPath,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: `Bad Gateway: ${err.message}` }));
    });

    req.pipe(proxyReq);
  }

  dispose(): void {
    if (this.routeWatcher) {
      this.routeWatcher.close();
      this.routeWatcher = null;
    }
    if (this.childProcess) {
      console.log(`[FrontendAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
      this.childProcess.kill('SIGTERM');
      this.childProcess = null;
    }
    if (this.socketPath && fs.existsSync(this.socketPath)) {
      try {
        fs.unlinkSync(this.socketPath);
      } catch (_) {}
    }
    this._restoreNextConfig();
    super.dispose();
  }
}
