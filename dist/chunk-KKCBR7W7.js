import {
  KrnlShell,
  krnlSystemEntityBase
} from "./chunk-COKO53B6.js";

// src/krnl/core/K_LIB_Krnl_System_App_Adapter.ts
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
var KrnlNonKrnlAppAdapter = class extends krnlSystemEntityBase {
  childProcess = null;
  appPort = -1;
  appPath;
  constructor(name, appPath) {
    super(name, null, -1, "127.0.0.1", { Singleton: true, disableMagneticLoading: true });
    this.appPath = appPath;
    this._isIngressNetworkMember = true;
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      await this.proxyRequest(req, res, req.url || "/");
    };
  }
  async startApp() {
    this.appPort = await this._probeAvailablePort(11e3, "127.0.0.1");
    let command = "node";
    let args = ["."];
    try {
      const pkgPath = path.join(this.appPath, "package.json");
      if (fs.existsSync(pkgPath)) {
        const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (packageJson.scripts?.start) {
          command = "npm";
          args = ["run", "start"];
        } else if (packageJson.main) {
          args = [packageJson.main];
        }
      }
    } catch (_) {
    }
    const env = {
      ...process.env,
      PORT: this.appPort.toString()
    };
    console.log(`[AppAdapter] Spawning non-Krnl app '${this.entityName}' in background (Port: ${this.appPort})...`);
    this.childProcess = KrnlShell.spawn(command, args, {
      cwd: this.appPath,
      env,
      stdio: "inherit"
    });
    let ready = false;
    const timeout = 15e3;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      ready = await new Promise((resolve) => {
        const socket = net.connect(this.appPort, "127.0.0.1");
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("error", () => resolve(false));
      });
      if (ready) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!ready) {
      throw new Error(`[AppAdapter] Non-Krnl app '${this.entityName}' failed to boot on port ${this.appPort} within 15s.`);
    }
    console.log(`[AppAdapter] Non-Krnl app '${this.entityName}' successfully booted.`);
  }
  async proxyRequest(req, res, subPath) {
    if (this.appPort === -1) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: "Service Temporarily Unavailable: Sub-app not running." }));
      return;
    }
    const options = {
      hostname: "127.0.0.1",
      port: this.appPort,
      path: subPath,
      method: req.method,
      headers: req.headers
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `Bad Gateway: ${err.message}` }));
    });
    req.pipe(proxyReq);
  }
  dispose() {
    if (this.childProcess) {
      console.log(`[AppAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
      this.childProcess.kill("SIGTERM");
      this.childProcess = null;
    }
    super.dispose();
  }
};

export {
  KrnlNonKrnlAppAdapter
};
