import {
  KrnlNonKrnlAppAdapter
} from "./chunk-UW4IG4ON.js";
import {
  KrnlMagneticLoader,
  magneticStorage,
  subappLocalStorage
} from "./chunk-TATVB3KM.js";
import {
  CUSTOM_ERROR_CODE,
  KrnlApplicationOrchestrator,
  KrnlEndpointAgent,
  KrnlEndpointScheduler,
  KrnlFrontend,
  KrnlFrontendAdapter,
  KrnlIngressNetwork,
  KrnlPlannerAgent,
  KrnlRuntimeStore,
  KrnlTaskList,
  KrnlTaskRunner,
  KrnlWatchVariablesTracker,
  MemoryTransportAdapter,
  WebSocketTransportAdapter,
  krnl,
  krnlCollector,
  krnlEmitter,
  krnlEntityBase,
  krnlEntityCompositionalHierarchyManager,
  krnlError,
  krnlErrorCodes,
  krnlErrorMessages,
  krnlGlobalEmitterAddress,
  krnlInterface,
  krnlLocalEmitterAddress,
  krnlLocalFunctionality,
  krnlMessage,
  krnlRemoteFunctionality,
  krnlSystemCommComponent,
  krnlSystemEntityBase,
  krnlTransportAdapter
} from "./chunk-EZLSQBY2.js";
import {
  AsyncKit,
  CacheKit,
  FileCache,
  FileLock,
  GitManager,
  KrnlAikoClient,
  KrnlEnv,
  KrnlFS,
  KrnlHTTP,
  KrnlShell,
  LRUCache,
  ObjectKit,
  StringKit,
  TTLCache
} from "./chunk-7Q2FYUWU.js";
import "./chunk-GL3WC255.js";
import {
  telemetry
} from "./chunk-AHWZBXWV.js";
import {
  KrnlAcpProtocol,
  KrnlMcpProtocol,
  krnlUnifiedHttpAdapter
} from "./chunk-U3F3QDHN.js";
import {
  KrnlRegistryClient
} from "./chunk-4MELRUJ6.js";
import {
  KrnlPolicy,
  Logger,
  createEnum,
  defaultConnectionBehaviour,
  krnlData,
  krnlDataFactory,
  krnlPrimitiveDataTypes,
  krnlServiceSuitePorts,
  krnlServiceSuites,
  krnlSystemTypes
} from "./chunk-43SQEXFM.js";

// src/krnl/core/K_ENT_Krnl_Sub_System_Orchestrator_Base.ts
var krnlSubSystemOrchestratorBase = class extends krnlEntityBase {
  constructor(name, owner) {
    if (!owner) {
      throw new Error("A sub-system orchestrator must be owned by a parent entity.");
    }
    super(name, owner);
    this.systemType = "SubSystemOrchestrator";
  }
};

// src/krnl/core/K_ENT_Krnl_Network_Orchestrator_Entity_Base.ts
var krnlNetworkOrchestratorEntityBase = class extends krnlSystemEntityBase {
  constructor(name = "KrnlNetworkOrchestrator", owner = null, commPort = 10110, host = "0.0.0.0") {
    super(name, owner, commPort, host);
    this.systemType = "NetworkOrchestrator";
  }
  async getPeerManifest(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    return await this.commComponent.callWsRpc(peer.address, "get-manifest", {});
  }
  async listPeerRoutes(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    return await this.commComponent.callWsRpc(peer.address, "list-routes", {});
  }
  /**
   * Connects source system emitter -> target system collector.
   */
  async connectSystems(sourcePeerId, targetPeerId, options) {
    const source = this.peers.get(sourcePeerId);
    const target = this.peers.get(targetPeerId);
    if (!source) throw new Error(`Source peer ${sourcePeerId} not discovered.`);
    if (!target) throw new Error(`Target peer ${targetPeerId} not discovered.`);
    if (source.busy && source.reservedBy !== this.entityName) {
      throw new Error(`Source peer ${sourcePeerId} is reserved by ${source.reservedBy || "another service"}.`);
    }
    if (target.busy && target.reservedBy !== this.entityName) {
      throw new Error(`Target peer ${targetPeerId} is reserved by ${target.reservedBy || "another service"}.`);
    }
    const {
      sourceEmitter,
      targetCollector,
      externallyMutable = true,
      metadata = {}
    } = options;
    return await this.commComponent.callWsRpc(source.address, "connect-to-target", {
      sourceEmitter,
      targetAddress: target.address,
      targetCollector,
      targetName: target.name,
      requester: this.entityName,
      connectionPolicy: {
        managedBy: this.entityName,
        externallyMutable,
        metadata
      }
    });
  }
  async disconnectPeerRoute(peerId, routeId, options = {}) {
    const peer = this.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not discovered.`);
    const { force = false } = options;
    return await this.commComponent.callWsRpc(peer.address, "disconnect-route", {
      routeId,
      force,
      requester: this.entityName
    });
  }
};

// src/krnl/core/K_LIB_Krnl_Block_Container_Adapter.ts
import fs from "fs";
import path from "path";
var KrnlBlockContainerAdapter = class extends KrnlFrontendAdapter {
  blocksDir;
  discoveredBlocks = /* @__PURE__ */ new Map();
  blockWatcher = null;
  constructor(name, containerRoot, options = {}) {
    const appPath = fs.existsSync(path.join(containerRoot, "app")) ? path.join(containerRoot, "app") : containerRoot;
    super(name, appPath, options);
    this.blocksDir = path.join(containerRoot, "nextjs-blocks");
    const parentHandleRequest = this.unifiedHttpAdapter._handleRequest.bind(this.unifiedHttpAdapter);
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;
      if (pathname === "/api/blocks" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(this.getBlocksManifest()));
        return;
      }
      if (pathname.startsWith("/api/blocks/") && req.method === "GET") {
        const parts = pathname.split("/");
        const blockId = parts[3];
        const block = this.discoveredBlocks.get(blockId);
        if (!block) {
          res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ status: "error", message: `Block ${blockId} not found` }));
          return;
        }
        if (parts[4] === "routes") {
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(block.routes));
          return;
        }
        if (parts[4] === "apis") {
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify(block.apis));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(block));
        return;
      }
      if (pathname === "/api/routes" && req.method === "GET") {
        const allRoutes = this.getBlocksManifest().flatMap((b) => b.routes.map((r) => ({ ...r, blockId: b.id })));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(allRoutes));
        return;
      }
      if (pathname === "/api/apis" && req.method === "GET") {
        const allApis = this.getBlocksManifest().flatMap((b) => b.apis.map((a) => ({ ...a, blockId: b.id })));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(allApis));
        return;
      }
      if (pathname === "/api/manifests" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({
          containerName: this.entityName,
          blocks: this.getBlocksManifest()
        }));
        return;
      }
      await parentHandleRequest(req, res);
    };
  }
  async startApp() {
    await this.loadBlocks();
    this.setupBlockWatcher();
    await super.startApp();
  }
  async loadBlocks() {
    if (!fs.existsSync(this.blocksDir)) {
      fs.mkdirSync(this.blocksDir, { recursive: true });
    }
    const entries = fs.readdirSync(this.blocksDir, { withFileTypes: true });
    const newDiscovered = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const blockId = entry.name;
        const blockPath = path.join(this.blocksDir, blockId);
        try {
          const desc = await this.scanBlock(blockId, blockPath);
          newDiscovered.set(blockId, desc);
        } catch (err) {
          console.error(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to scan block ${blockId}:`, err.message);
        }
      }
    }
    this.discoveredBlocks = newDiscovered;
    console.log(`[KrnlBlockContainerAdapter:${this.entityName}] Discovered ${this.discoveredBlocks.size} blocks.`);
  }
  setupBlockWatcher() {
    if (this.options.mode === "prod") return;
    try {
      this.blockWatcher = fs.watch(this.blocksDir, { recursive: false }, () => {
        this.loadBlocks().catch(console.error);
      });
    } catch (err) {
      console.warn(`[KrnlBlockContainerAdapter:${this.entityName}] Failed to start block directory watcher:`, err.message);
    }
  }
  async scanBlock(blockId, blockPath) {
    let name = blockId;
    let version = "1.0.0";
    const pkgPath = path.join(blockPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        name = pkg.displayName || pkg.name || blockId;
        version = pkg.version || "1.0.0";
      } catch (_) {
      }
    }
    const blockTsPath = path.join(blockPath, "block.ts");
    const blockJsPath = path.join(blockPath, "block.js");
    if (fs.existsSync(blockTsPath) || fs.existsSync(blockJsPath)) {
      try {
        const imported = await (fs.existsSync(blockTsPath) ? import(blockTsPath) : import(blockJsPath));
        if (imported.block) {
          name = imported.block.name || name;
          version = imported.block.version || version;
        }
      } catch (_) {
      }
    }
    const routes = [];
    const apis = [];
    const pagesDir = path.join(blockPath, "pages");
    const appDir = path.join(blockPath, "app");
    if (fs.existsSync(pagesDir)) {
      this._findPagesRoutesRecursive(pagesDir, pagesDir, routes, apis);
    }
    if (fs.existsSync(appDir)) {
      this._findAppRoutesRecursive(appDir, appDir, routes, apis);
    }
    return {
      id: blockId,
      name,
      version,
      routes,
      apis
    };
  }
  _findPagesRoutesRecursive(dir, baseDir, routes, apis) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findPagesRoutesRecursive(fullPath, baseDir, routes, apis);
      } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const rel = path.relative(baseDir, fullPath);
        const withoutExt = rel.substring(0, rel.lastIndexOf("."));
        const routePath = withoutExt.replace(/\\/g, "/");
        if (file.startsWith("_app.") || file.startsWith("_document.") || file.startsWith("_error.")) {
          continue;
        }
        if (routePath.startsWith("api/")) {
          apis.push({
            path: `/${routePath}`,
            methods: ["GET", "POST", "PUT", "DELETE"]
          });
          routes.push({
            path: `/${routePath}`,
            type: "api"
          });
        } else {
          routes.push({
            path: routePath === "index" ? "/" : `/${routePath}`,
            type: "page"
          });
        }
      }
    }
  }
  _findAppRoutesRecursive(dir, baseDir, routes, apis) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._findAppRoutesRecursive(fullPath, baseDir, routes, apis);
      } else if (file.endsWith(".ts") || file.endsWith(".js") || file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const isRouteFile = file === "route.ts" || file === "route.js";
        const isPageFile = file === "page.tsx" || file === "page.ts" || file === "page.js";
        const isLayoutFile = file === "layout.tsx" || file === "layout.ts" || file === "layout.js";
        if (isRouteFile || isPageFile || isLayoutFile) {
          const dirIndex = dir.indexOf("app");
          let routePath = dir.substring(dirIndex + 3).replace(/\\/g, "/");
          if (!routePath.startsWith("/")) {
            routePath = "/" + routePath;
          }
          if (routePath === "") routePath = "/";
          if (isRouteFile) {
            apis.push({
              path: routePath,
              methods: ["GET", "POST", "PUT", "DELETE"]
            });
            routes.push({
              path: routePath,
              type: "api"
            });
          } else if (isPageFile) {
            routes.push({
              path: routePath,
              type: "page"
            });
          } else if (isLayoutFile) {
            routes.push({
              path: routePath,
              type: "layout"
            });
          }
        }
      }
    }
  }
  getBlocksManifest() {
    return Array.from(this.discoveredBlocks.values());
  }
  dispose() {
    if (this.blockWatcher) {
      this.blockWatcher.close();
      this.blockWatcher = null;
    }
    super.dispose();
  }
};

// src/krnl/core/K_LIB_Krnl_Intention_Types.ts
function buildEntityIntention(entity) {
  const functionalities = [];
  if (entity.localFunctionalities) {
    for (const func of entity.localFunctionalities.values()) {
      if (func.intention) {
        functionalities.push(func.intention);
      }
    }
  }
  const componentEntities = [];
  if (entity.hierarchyManager && entity.hierarchyManager.ownedComponents) {
    for (const child of entity.hierarchyManager.ownedComponents.values()) {
      componentEntities.push(buildEntityIntention(child));
    }
  }
  return {
    purpose: entity.intention?.purpose || entity.description || "",
    functionalities,
    componentEntities
  };
}

// src/krnl/extensions/K_LIB_Krnl_Backend_Visual_Functionality_APIs.js
function setBrndaComponentApi(entity) {
  return (config = {}) => {
    entity.brndaConfig = { ...entity.brndaConfig, ...config };
    console.log(`[${entity.entityName}] Brnda config updated:`, entity.brndaConfig);
    return entity.brndaConfig;
  };
}
function setWeprComponentApi(entity) {
  return (config = {}) => {
    entity.weprConfig = { ...entity.weprConfig, ...config };
    console.log(`[${entity.entityName}] Wepr config updated:`, entity.weprConfig);
    return entity.weprConfig;
  };
}
function setVisualCoreApi(entity) {
  return (patch = {}) => {
    entity.visualCore = {
      ...entity.visualCore,
      ...patch,
      position: { ...entity.visualCore.position, ...patch.position },
      rotation: { ...entity.visualCore.rotation, ...patch.rotation },
      scale: { ...entity.visualCore.scale, ...patch.scale }
    };
    return entity.visualCore;
  };
}
function getVisualSnapshotApi(entity) {
  return () => entity.visualCore;
}
function syncAllFrontendsApi(entity) {
  return async () => {
    console.log(`[${entity.entityName}] Syncing all frontends...`);
    return { status: "synced", timestamp: Date.now() };
  };
}

// src/krnl/extensions/K_ENT_Krnl_Backend_Visual_Entity_Base.js
var krnlBackendVisualEntityBase = class extends krnlEntityBase {
  constructor(name, owner = null) {
    super(name, owner);
    this.visualCore = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      color: "#ffffff"
    };
    this._setupVisualFunctionalities();
  }
  _setupVisualFunctionalities() {
    this.addLocal({
      id: "setBrndaComponent",
      api: setBrndaComponentApi(this)
    });
    this.addLocal({
      id: "setWeprComponent",
      api: setWeprComponentApi(this)
    });
    this.addLocal({
      id: "setVisualCore",
      api: setVisualCoreApi(this)
    });
    this.addLocal({
      id: "getVisualSnapshot",
      api: getVisualSnapshotApi(this)
    });
    this.addLocal({
      id: "syncAllFrontends",
      api: syncAllFrontendsApi(this)
    });
  }
  getVisualSnapshot() {
    return { ...this.visualCore };
  }
};

// src/krnl/extensions/K_LIB_Dasy_JS.js
var DasyJS = class {
  constructor(rootName = "dasy-root") {
    this.rootName = rootName;
    this.rootDir = null;
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// INITIALIZATION AND PATH RESOLUTION ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**
   * Initializes the file system access.
   */
  async init() {
    const storageRoot = await navigator.storage.getDirectory();
    this.rootDir = await storageRoot.getDirectoryHandle(this.rootName, {
      create: true
    });
  }
  /**
   * Resolves a user path into normalized parts.
   * @param {string} userPath 
   * @returns {string[]}
   */
  resolve(userPath) {
    const trimmed = (userPath || "").trim();
    if (!trimmed) throw new Error("invalid path");
    const relative = trimmed.replace(/^\/+/, "");
    const normalized = relative.replace(/\\/g, "/");
    if (normalized.includes("..")) {
      throw new Error("invalid path");
    }
    return normalized.split("/").filter(Boolean);
  }
  /**
   * Internal helper to get a file handle.
   */
  async getFileHandle(pathParts, create = false) {
    let current = this.rootDir;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = await current.getDirectoryHandle(pathParts[i], { create });
    }
    return current.getFileHandle(pathParts.at(-1), { create });
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////// FILE OPERATIONS //////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  async createFile(filePath) {
    const parts = this.resolve(filePath);
    await this.getFileHandle(parts, true);
  }
  async deleteFile(filePath) {
    const parts = this.resolve(filePath);
    let current = this.rootDir;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i]);
    }
    try {
      await current.removeEntry(parts.at(-1));
    } catch (err) {
      if (err.name !== "NotFoundError") throw err;
    }
  }
  async duplicateFile(source, destination) {
    const data = await this.readBytes(source);
    await this.writeBytes(destination, data);
  }
  async writeText(filePath, data) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts, true);
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
  async readText(filePath) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts);
    const file = await handle.getFile();
    return file.text();
  }
  async writeBytes(filePath, data) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts, true);
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
  async readBytes(filePath) {
    const parts = this.resolve(filePath);
    const handle = await this.getFileHandle(parts);
    const file = await handle.getFile();
    return file.arrayBuffer();
  }
};

// src/krnl/core/K_LIB_Pocer_Block.ts
import http from "http";
import net from "net";
import { execSync, exec, spawn } from "child_process";
import { promisify } from "util";
import fs2 from "fs";
import path2 from "path";
var execAsync = promisify(exec);
var PocerBlock = class extends krnlSystemEntityBase {
  blockConfig;
  _containerReady = false;
  _startedByUs = false;
  _dockerProvider = null;
  constructor(name, blockConfig) {
    super(name, null, -1, "127.0.0.1", { Singleton: true, _skipMagneticLoading: true });
    this.blockConfig = blockConfig;
    this._isIngressNetworkMember = true;
    this.unifiedHttpAdapter._handleRequest = async (req, res) => {
      await this.proxyRequest(req, res, req.url || "/");
    };
  }
  async startApp() {
    const { containerName, image, hostPort, containerPort, environment } = this.blockConfig;
    console.log(`[PocerBlock:${this.entityName}] Booting container '${containerName}'...`);
    await this.ensureDockerEngine();
    await this.loadLocalImageArchive(image);
    const isAlreadyRunning = await this._isContainerRunning(containerName);
    if (isAlreadyRunning) {
      console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is already running.`);
    } else {
      const exists = await this._containerExists(containerName);
      if (exists) {
        console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' exists but is stopped. Starting...`);
        await execAsync(`docker start ${containerName}`);
      } else {
        console.log(`[PocerBlock:${this.entityName}] Creating and starting container '${containerName}'...`);
        const envArgs = Object.entries(environment ?? {}).map(([k, v]) => `-e "${k}=${v}"`).join(" ");
        const cmd = [
          "docker run -d",
          `--name ${containerName}`,
          `-p ${hostPort}:${containerPort}`,
          envArgs,
          image
        ].filter(Boolean).join(" ");
        await execAsync(cmd);
      }
    }
    await this._waitForPort(hostPort, 2e4);
    this._containerReady = true;
    console.log(`[PocerBlock:${this.entityName}] Container '${containerName}' is ready on host port ${hostPort}.`);
  }
  async proxyRequest(req, res, subPath) {
    if (!this._containerReady || this.blockConfig.hostPort === -1) {
      res.writeHead(533, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Container not ready.` }));
      return;
    }
    const options = {
      hostname: "127.0.0.1",
      port: this.blockConfig.hostPort,
      path: subPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${this.blockConfig.hostPort}`
      }
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "error", message: `[PocerBlock:${this.entityName}] Bad Gateway: ${err.message}` }));
    });
    req.pipe(proxyReq, { end: true });
  }
  getManifest() {
    const base = super.getManifest();
    return {
      ...base,
      pocerBlock: {
        image: this.blockConfig.image,
        containerName: this.blockConfig.containerName,
        hostPort: this.blockConfig.hostPort,
        containerPort: this.blockConfig.containerPort,
        protocol: this.blockConfig.protocol,
        ready: this._containerReady
      }
    };
  }
  dispose() {
    if (this.blockConfig.stopOnDispose) {
      try {
        console.log(`[PocerBlock:${this.entityName}] Stopping container '${this.blockConfig.containerName}'...`);
        execSync(`docker stop ${this.blockConfig.containerName}`, { stdio: "ignore" });
      } catch (_) {
      }
    }
    if (this._startedByUs) {
      try {
        if (this._dockerProvider === "colima") {
          console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Colima VM...`);
          execSync("colima stop", { stdio: "ignore" });
        } else if (this._dockerProvider === "docker-desktop") {
          console.log(`[PocerBlock:${this.entityName}] Stopping block-initiated Docker Desktop...`);
          execSync(`osascript -e 'quit app "Docker"'`, { stdio: "ignore" });
        }
      } catch (_) {
      }
    }
    super.dispose();
  }
  // ─── Self-Containing Infrastructure (VM & Docker Engine Setup) ─────────────
  async ensureDockerEngine() {
    try {
      await execAsync("docker ps");
      return;
    } catch (_) {
    }
    console.log(`[PocerBlock:${this.entityName}] Docker not running. Attempting to start virtualization engine...`);
    const colimaPath = await this._locateBinary("colima");
    if (colimaPath) {
      console.log(`[PocerBlock:${this.entityName}] Found Colima binary. Starting VM...`);
      const proc = spawn("colima", ["start", "--runtime", "docker"], { stdio: "ignore", detached: true });
      proc.unref();
      this._dockerProvider = "colima";
      this._startedByUs = true;
    } else {
      console.log(`[PocerBlock:${this.entityName}] Colima not found. Attempting to launch Docker Desktop...`);
      const proc = spawn("open", ["-g", "-a", "Docker"], { stdio: "ignore", detached: true });
      proc.unref();
      this._dockerProvider = "docker-desktop";
      this._startedByUs = true;
    }
    const deadline = Date.now() + 6e4;
    while (Date.now() < deadline) {
      try {
        const { stdout } = await execAsync("docker ps");
        if (stdout.includes("CONTAINER ID")) {
          console.log(`[PocerBlock:${this.entityName}] Virtualization engine online.`);
          return;
        }
      } catch (_) {
      }
      await new Promise((r) => setTimeout(r, 2e3));
    }
    throw new Error(`[PocerBlock:${this.entityName}] Failed to start or connect to virtualization engine.`);
  }
  async loadLocalImageArchive(image) {
    const localImagesDir = path2.join(process.cwd(), "subapps", this.entityName, "images");
    const safeImageName = image.replace(/[^a-zA-Z0-9]/g, "_");
    const archivePath = path2.join(localImagesDir, `${safeImageName}.tar`);
    if (fs2.existsSync(archivePath)) {
      try {
        const { stdout } = await execAsync(`docker images -q ${image}`);
        if (stdout.trim().length > 0) {
          console.log(`[PocerBlock:${this.entityName}] Image '${image}' already cached in Docker daemon.`);
          return;
        }
      } catch (_) {
      }
      console.log(`[PocerBlock:${this.entityName}] Loading image archive from local block repository: ${archivePath}`);
      await execAsync(`docker load -i "${archivePath}"`);
    } else {
      console.log(`[PocerBlock:${this.entityName}] No local image archive found at: ${archivePath}. Pulling from remote registry...`);
      await execAsync(`docker pull ${image}`);
    }
  }
  // ─── Private Helpers ───────────────────────────────────────────────────────
  async _locateBinary(name) {
    try {
      const { stdout } = await execAsync(`which ${name}`);
      return stdout.trim();
    } catch {
      return null;
    }
  }
  async _isContainerRunning(name) {
    try {
      const { stdout } = await execAsync(`docker inspect --format "{{.State.Running}}" ${name} 2>/dev/null`);
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }
  async _containerExists(name) {
    try {
      await execAsync(`docker inspect --format "{{.State.Status}}" ${name} 2>/dev/null`);
      return true;
    } catch {
      return false;
    }
  }
  async _waitForPort(port, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const open = await new Promise((resolve) => {
        const socket = net.connect(port, "127.0.0.1");
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("error", () => resolve(false));
      });
      if (open) return;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error(`[PocerBlock:${this.entityName}] Timed out waiting for container port ${port} after ${timeoutMs}ms.`);
  }
};
export {
  AsyncKit,
  CUSTOM_ERROR_CODE,
  CacheKit,
  DasyJS,
  FileCache,
  FileLock,
  GitManager,
  KrnlAcpProtocol,
  KrnlAikoClient,
  KrnlApplicationOrchestrator,
  KrnlBlockContainerAdapter,
  KrnlEndpointAgent,
  KrnlEndpointScheduler,
  KrnlEnv,
  KrnlFS,
  KrnlFrontend,
  KrnlFrontendAdapter,
  KrnlHTTP,
  KrnlIngressNetwork,
  KrnlMagneticLoader,
  KrnlMcpProtocol,
  KrnlNonKrnlAppAdapter,
  KrnlPlannerAgent,
  KrnlPolicy,
  KrnlRegistryClient,
  KrnlRuntimeStore,
  KrnlShell,
  KrnlTaskList,
  KrnlTaskRunner,
  KrnlWatchVariablesTracker,
  LRUCache,
  Logger,
  MemoryTransportAdapter,
  ObjectKit,
  PocerBlock,
  StringKit,
  TTLCache,
  WebSocketTransportAdapter,
  buildEntityIntention,
  createEnum,
  defaultConnectionBehaviour,
  krnlBackendVisualEntityBase,
  krnlCollector,
  krnlData,
  krnlDataFactory,
  krnlEmitter,
  krnlEntityBase,
  krnlEntityCompositionalHierarchyManager,
  krnlError,
  krnlErrorCodes,
  krnlErrorMessages,
  krnlGlobalEmitterAddress,
  krnlInterface,
  krnlLocalEmitterAddress,
  krnlLocalFunctionality,
  krnlMessage,
  krnlNetworkOrchestratorEntityBase,
  krnlPrimitiveDataTypes,
  krnl as krnlProto,
  krnlRemoteFunctionality,
  krnlServiceSuitePorts,
  krnlServiceSuites,
  krnlSubSystemOrchestratorBase,
  krnlSystemCommComponent,
  krnlSystemEntityBase,
  krnlSystemTypes,
  krnlTransportAdapter,
  krnlUnifiedHttpAdapter,
  magneticStorage,
  subappLocalStorage,
  telemetry
};
