import fs from 'fs';
import path from 'path';
import http from 'http';
import net from 'net';
import { krnlSystemEntityBase } from './K_ENT_Krnl_System_Entity_Base.js';
import { KrnlShell } from '../tools/KrnlShell.js';

export class KrnlNonKrnlAppAdapter extends krnlSystemEntityBase {
  childProcess: any = null;
  appPort: number = -1;
  appPath: string;

  constructor(name: string, appPath: string) {
    // Non-Krnl app runs locally under a custom dynamic port, but exposes no external OS port
    super(name, null, -1, '127.0.0.1', { Singleton: true });
    this.appPath = appPath;
    this._isIngressNetworkMember = true;

    // Override the unified HTTP adapter handleRequest to act as a reverse proxy
    this.unifiedHttpAdapter._handleRequest = async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await this.proxyRequest(req, res, req.url || '/');
    };
  }

  async startApp(): Promise<void> {
    // 1. Find a dynamic local port to run the sub-app on
    this.appPort = await this._probeAvailablePort(11000, '127.0.0.1');

    // 2. Resolve start command
    let command = 'node';
    let args: string[] = ['.'];
    try {
      const pkgPath = path.join(this.appPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (packageJson.scripts?.start) {
          command = 'npm';
          args = ['run', 'start'];
        } else if (packageJson.main) {
          args = [packageJson.main];
        }
      }
    } catch (_) {}

    // 3. Spawn process with injected local PORT env var
    const env = {
      ...process.env,
      PORT: this.appPort.toString()
    };

    console.log(`[AppAdapter] Spawning non-Krnl app '${this.entityName}' in background (Port: ${this.appPort})...`);
    this.childProcess = KrnlShell.spawn(command, args, {
      cwd: this.appPath,
      env,
      stdio: 'inherit'
    });

    // 4. Probe port until it starts responding
    let ready = false;
    const timeout = 15000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      ready = await new Promise<boolean>((resolve) => {
        const socket = net.connect(this.appPort, '127.0.0.1');
        socket.on('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.on('error', () => resolve(false));
      });
      if (ready) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    if (!ready) {
      throw new Error(`[AppAdapter] Non-Krnl app '${this.entityName}' failed to boot on port ${this.appPort} within 15s.`);
    }
    console.log(`[AppAdapter] Non-Krnl app '${this.entityName}' successfully booted.`);
  }

  async proxyRequest(req: http.IncomingMessage, res: http.ServerResponse, subPath: string): Promise<void> {
    if (this.appPort === -1) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'Service Temporarily Unavailable: Sub-app not running.' }));
      return;
    }

    // Set up request options to forward to local child process
    const options = {
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
    if (this.childProcess) {
      console.log(`[AppAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
      this.childProcess.kill('SIGTERM');
      this.childProcess = null;
    }
    super.dispose();
  }
}
