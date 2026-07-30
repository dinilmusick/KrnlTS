import {
  KrnlFrontendGenerator
} from "./chunk-X7IZRTKR.js";
import {
  KrnlFrontendBuilder
} from "./chunk-3RGJWCHR.js";
import {
  KrnlRegistryClient
} from "./chunk-4MELRUJ6.js";
import {
  KrnlSubAppWorkerHost
} from "./chunk-UBJAGRZU.js";
import {
  KrnlSubAppLoader
} from "./chunk-G4JCVCPP.js";
import {
  KrnlMagneticLoader,
  magneticStorage,
  subappLocalStorage
} from "./chunk-FZHJ7KDK.js";
import {
  KrnlNonKrnlAppAdapter
} from "./chunk-XQITQOXQ.js";
import {
  CUSTOM_ERROR_CODE,
  KrnlApplicationOrchestrator,
  KrnlEndpointAgent,
  KrnlEndpointScheduler,
  KrnlFrontend,
  KrnlIngressNetwork,
  KrnlPlannerAgent,
  KrnlRuntimeStore,
  KrnlSiblingNetwork,
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
} from "./chunk-RUSOCNJW.js";
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
import "./chunk-SFVDKJHO.js";
import {
  telemetry
} from "./chunk-AHWZBXWV.js";
import {
  KrnlAcpProtocol,
  KrnlMcpProtocol,
  krnlUnifiedHttpAdapter
} from "./chunk-HYQVHWBJ.js";
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

// src/krnl/core/K_LIB_Pocer_Block.ts
import http from "http";
import net from "net";
import { execSync, exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
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
    const localImagesDir = path.join(process.cwd(), "subapps", this.entityName, "images");
    const safeImageName = image.replace(/[^a-zA-Z0-9]/g, "_");
    const archivePath = path.join(localImagesDir, `${safeImageName}.tar`);
    if (fs.existsSync(archivePath)) {
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
  FileCache,
  FileLock,
  GitManager,
  KrnlAcpProtocol,
  KrnlAikoClient,
  KrnlApplicationOrchestrator,
  KrnlEndpointAgent,
  KrnlEndpointScheduler,
  KrnlEnv,
  KrnlFS,
  KrnlFrontend,
  KrnlFrontendBuilder,
  KrnlFrontendGenerator,
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
  KrnlSiblingNetwork,
  KrnlSubAppLoader,
  KrnlSubAppWorkerHost,
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
