import {
  KrnlShell,
  krnlSystemEntityBase
} from "./chunk-COKO53B6.js";

// src/krnl/core/K_LIB_Krnl_System_Frontend_Adapter.ts
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
import { fileURLToPath } from "url";
var _metaUrl = typeof import.meta !== "undefined" && import.meta.url ? import.meta.url : null;
var _filename = _metaUrl ? fileURLToPath(_metaUrl) : "";
var _dirname = _metaUrl ? path.dirname(_filename) : "";
var KrnlFrontendAdapter = class extends krnlSystemEntityBase {
  childProcess = null;
  appPort = -1;
  appPath;
  options;
  originalConfigName = null;
  patchedConfigName = null;
  registeredRoutes = /* @__PURE__ */ new Set();
  routeWatcher = null;
  constructor(name, appPath, options = {}) {
    super(`frontend-${name}`, null, -1, "127.0.0.1", { Singleton: true, disableMagneticLoading: true });
    this.appPath = appPath;
    this.options = options;
    this._isIngressNetworkMember = true;
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;
      if (pathname.endsWith("/__krnl/config")) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        const host = this.options.backendHost || "127.0.0.1";
        const port = this.options.backendPort || 10099;
        res.end(JSON.stringify({
          wsUrl: `ws://${host}:${port}/ws`,
          httpUrl: `http://${host}:${port}`,
          basePath: `/frontend/${this.entityName.replace(/^frontend-/, "")}`,
          name: this.entityName.replace(/^frontend-/, "")
        }));
        return;
      }
      if (pathname.endsWith("/__krnl/bridge.js")) {
        const bridgePath = path.resolve(_dirname, "../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.global.js");
        const fallbackPath = path.resolve(_dirname, "../../dist/K_LIB_Krnl_Frontend_Bridge_Bundle.js");
        const finalPath = fs.existsSync(bridgePath) ? bridgePath : fallbackPath;
        if (fs.existsSync(finalPath)) {
          res.writeHead(200, { "Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*" });
          res.end(fs.readFileSync(finalPath));
        } else {
          res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ status: "error", message: `Bridge bundle not found. Checked: ${bridgePath} and ${fallbackPath}` }));
        }
        return;
      }
      await this.proxyRequest(req, res, req.url || "/");
    };
  }
  async loadBridgesFromFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return;
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      if (file.endsWith(".bridge.ts") || file.endsWith(".bridge.js")) {
        const fullPath = path.resolve(folderPath, file);
        try {
          const module = await import(fullPath);
          const bridgeDesc = module.bridge;
          if (bridgeDesc && bridgeDesc.name) {
            console.log(`[FrontendAdapter:${this.entityName}] Loaded bridge script: ${bridgeDesc.name}`);
            if (this.options.backendPort === void 0 && bridgeDesc.backendPort !== void 0) {
              this.options.backendPort = bridgeDesc.backendPort;
            }
            if (this.options.backendHost === void 0 && bridgeDesc.backendHost !== void 0) {
              this.options.backendHost = bridgeDesc.backendHost;
            }
          }
        } catch (err) {
          console.error(`[FrontendAdapter:${this.entityName}] Failed to load bridge script ${file}:`, err.message);
        }
      }
    }
  }
  async scanAndRegisterApiRoutes() {
    const pagesApiDir = path.join(this.appPath, "pages", "api");
    const appDir = path.join(this.appPath, "app");
    const foundRoutes = [];
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
          api: async (input) => {
            return new Promise((resolve, reject) => {
              const reqData = JSON.stringify(input || {});
              const req = http.request({
                hostname: "127.0.0.1",
                port: this.appPort,
                path: `/${route}`,
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(reqData)
                }
              }, (res) => {
                let data = "";
                res.on("data", (chunk) => data += chunk);
                res.on("end", () => {
                  try {
                    resolve(JSON.parse(data));
                  } catch {
                    resolve({ status: "success", raw: data });
                  }
                });
              });
              req.on("error", (err) => reject(err));
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
  _findPagesRoutes(dir, baseDir, routes) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findPagesRoutes(fullPath, baseDir, routes);
      } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const rel = path.relative(baseDir, fullPath);
        const withoutExt = rel.substring(0, rel.lastIndexOf("."));
        const routePath = `api/${withoutExt.replace(/\\/g, "/")}`;
        routes.push(routePath);
      }
    }
  }
  _findAppRoutes(dir, baseDir, routes) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findAppRoutes(fullPath, baseDir, routes);
      } else if ((file === "route.ts" || file === "route.js") && dir.includes("api")) {
        const apiIndex = dir.indexOf("api");
        const routePath = dir.substring(apiIndex).replace(/\\/g, "/");
        routes.push(routePath);
      }
    }
  }
  setupApiRouteWatcher() {
    if (this.options.mode === "prod") return;
    const pagesApiDir = path.join(this.appPath, "pages", "api");
    const appDir = path.join(this.appPath, "app");
    const onChange = () => {
      this.scanAndRegisterApiRoutes().catch(console.error);
    };
    if (fs.existsSync(pagesApiDir)) {
      this.routeWatcher = fs.watch(pagesApiDir, { recursive: true }, onChange);
    } else if (fs.existsSync(appDir)) {
      this.routeWatcher = fs.watch(appDir, { recursive: true }, onChange);
    }
  }
  async startApp() {
    const wrapperDir = path.dirname(this.appPath);
    await this.loadBridgesFromFolder(wrapperDir);
    await this.scanAndRegisterApiRoutes();
    this.setupApiRouteWatcher();
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
    const host = this.options.backendHost || "127.0.0.1";
    const port = this.options.backendPort || 10099;
    const env = {
      ...process.env,
      PORT: this.appPort.toString(),
      NEXT_PUBLIC_KRNL_BASE_PATH: basePath,
      NEXT_PUBLIC_KRNL_WS_URL: `ws://${host}:${port}/ws`,
      NEXT_PUBLIC_KRNL_HTTP_URL: `http://${host}:${port}`,
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
    if (this.routeWatcher) {
      this.routeWatcher.close();
      this.routeWatcher = null;
    }
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
