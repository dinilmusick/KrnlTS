import {
  KrnlShell,
  krnlSystemEntityBase
} from "./chunk-5NFZKYUR.js";

// src/krnl/core/K_LIB_Krnl_System_Frontend_Adapter.ts
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
var KrnlFrontendAdapter = class extends krnlSystemEntityBase {
  childProcess = null;
  appPort = -1;
  appPath;
  options;
  originalConfigName = null;
  patchedConfigName = null;
  constructor(name, appPath, options = {}) {
    super(`frontend-${name}`, null, -1, "127.0.0.1", { Singleton: true, disableMagneticLoading: true });
    this.appPath = appPath;
    this.options = options;
    this._isIngressNetworkMember = true;
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      await this.proxyRequest(req, res, req.url || "/");
    };
  }
  async startApp() {
    this.appPort = await this._probeAvailablePort(12e3, "127.0.0.1");
    let packageJson = {};
    const pkgPath = path.join(this.appPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      } catch (_) {
      }
    }
    const isEsm = packageJson.type === "module";
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let framework = "generic";
    if (deps["next"]) framework = "nextjs";
    else if (deps["vite"]) framework = "vite";
    const basePath = `/frontend/${this.entityName.replace(/^frontend-/, "")}`;
    if (framework === "nextjs") {
      await this._patchNextConfig(basePath, isEsm);
    }
    let command = "npm";
    let args = ["run", this.options.mode === "prod" ? "start" : "dev"];
    if (framework === "nextjs") {
      if (this.options.mode === "prod") {
        console.log(`[FrontendAdapter] Next.js production build starting for '${this.entityName}'...`);
        const buildProcess = KrnlShell.spawn("npx", ["next", "build"], {
          cwd: this.appPath,
          env: { ...process.env, NEXT_PUBLIC_KRNL_BASE_PATH: basePath },
          stdio: "inherit"
        });
        const { code } = await buildProcess.promise;
        if (code !== 0) {
          throw new Error(`Next.js build failed with code ${code}`);
        }
      }
      command = "npx";
      args = ["next", this.options.mode === "prod" ? "start" : "dev", "-p", this.appPort.toString()];
    } else if (framework === "vite") {
      command = "npx";
      args = ["vite", "--port", this.appPort.toString(), "--strictPort", "--base", `${basePath}/`];
    }
    const env = {
      ...process.env,
      PORT: this.appPort.toString(),
      NEXT_PUBLIC_KRNL_BASE_PATH: basePath,
      ...this.options.env
    };
    console.log(`[FrontendAdapter] Spawning custom frontend '${this.entityName}' (${framework}) in background (Port: ${this.appPort})...`);
    this.childProcess = KrnlShell.spawn(command, args, {
      cwd: this.appPath,
      env,
      stdio: "inherit"
    });
    let ready = false;
    const timeout = this.options.startupTimeoutMs ?? 6e4;
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
      throw new Error(`[FrontendAdapter] Custom frontend '${this.entityName}' failed to boot on port ${this.appPort} within ${timeout / 1e3}s.`);
    }
    console.log(`[FrontendAdapter] Custom frontend '${this.entityName}' successfully booted.`);
  }
  async _patchNextConfig(basePath, isEsm) {
    const configMjs = path.join(this.appPath, "next.config.mjs");
    const configJs = path.join(this.appPath, "next.config.js");
    if (fs.existsSync(configMjs)) {
      this.originalConfigName = "next.config.original.mjs";
      this.patchedConfigName = "next.config.mjs";
      fs.renameSync(configMjs, path.join(this.appPath, this.originalConfigName));
      const newConfigContent = `import original from './next.config.original.mjs';
const config = {
  ...original,
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || original.basePath || '',
};
export default config;
`;
      fs.writeFileSync(configMjs, newConfigContent, "utf8");
    } else if (fs.existsSync(configJs)) {
      this.originalConfigName = "next.config.original.js";
      this.patchedConfigName = "next.config.js";
      fs.renameSync(configJs, path.join(this.appPath, this.originalConfigName));
      let newConfigContent = "";
      if (isEsm) {
        newConfigContent = `import original from './next.config.original.js';
const config = {
  ...original,
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || original.basePath || '',
};
export default config;
`;
      } else {
        newConfigContent = `const original = require('./next.config.original.js');
module.exports = {
  ...original,
  basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || original.basePath || '',
};
`;
      }
      fs.writeFileSync(configJs, newConfigContent, "utf8");
    } else {
      this.patchedConfigName = isEsm ? "next.config.mjs" : "next.config.js";
      const newConfigContent = isEsm ? `export default { basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '' };
` : `module.exports = { basePath: process.env.NEXT_PUBLIC_KRNL_BASE_PATH || '' };
`;
      fs.writeFileSync(path.join(this.appPath, this.patchedConfigName), newConfigContent, "utf8");
    }
  }
  _restoreNextConfig() {
    if (this.patchedConfigName) {
      const patchedPath = path.join(this.appPath, this.patchedConfigName);
      if (fs.existsSync(patchedPath)) {
        fs.unlinkSync(patchedPath);
      }
      if (this.originalConfigName) {
        const originalPath = path.join(this.appPath, this.originalConfigName);
        if (fs.existsSync(originalPath)) {
          fs.renameSync(originalPath, patchedPath);
        }
      }
      this.originalConfigName = null;
      this.patchedConfigName = null;
    }
  }
  async proxyRequest(req, res, subPath) {
    if (this.appPort === -1) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: "Service Temporarily Unavailable: Frontend not running." }));
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
      console.log(`[FrontendAdapter] Killing child process (PID: ${this.childProcess.pid}) for '${this.entityName}'`);
      this.childProcess.kill("SIGTERM");
      this.childProcess = null;
    }
    this._restoreNextConfig();
    super.dispose();
  }
};

export {
  KrnlFrontendAdapter
};
