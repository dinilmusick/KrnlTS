#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../core/dist/chunk-HIMEZUU2.js
var init_chunk_HIMEZUU2 = __esm({
  "../core/dist/chunk-HIMEZUU2.js"() {
    "use strict";
  }
});

// ../core/dist/chunk-MLVWARD4.js
var init_chunk_MLVWARD4 = __esm({
  "../core/dist/chunk-MLVWARD4.js"() {
    "use strict";
  }
});

// ../core/dist/chunk-DI27MOR7.js
var KrnlTelemetry, telemetry;
var init_chunk_DI27MOR7 = __esm({
  "../core/dist/chunk-DI27MOR7.js"() {
    "use strict";
    KrnlTelemetry = class {
      metrics;
      callLogs;
      libraryUsage;
      dataUsage;
      enabled;
      ringBufferSize;
      aiTraces;
      totalAiCalls;
      totalAiRetries;
      avgAiLatencyMs;
      runtimeStore = null;
      constructor() {
        this.metrics = /* @__PURE__ */ new Map();
        this.callLogs = /* @__PURE__ */ new Map();
        this.libraryUsage = /* @__PURE__ */ new Map();
        this.dataUsage = /* @__PURE__ */ new Map();
        this.enabled = false;
        this.ringBufferSize = 100;
        this.aiTraces = [];
        this.totalAiCalls = 0;
        this.totalAiRetries = 0;
        this.avgAiLatencyMs = 0;
      }
      setRuntimeStore(store) {
        this.runtimeStore = store;
      }
      recordAiTrace(trace) {
        if (this.aiTraces.length >= this.ringBufferSize) {
          this.aiTraces.shift();
        }
        this.aiTraces.push(trace);
        this.totalAiCalls++;
        this.totalAiRetries += trace.retryCount || 0;
        this.avgAiLatencyMs = (this.avgAiLatencyMs * (this.totalAiCalls - 1) + trace.latencyMs) / this.totalAiCalls;
        if (this.runtimeStore) {
          this.runtimeStore.appendTelemetry({
            type: "ai_trace",
            endpointId: trace.endpointId,
            timestamp: trace.timestamp,
            latencyMs: trace.latencyMs,
            retryCount: trace.retryCount,
            success: !trace.failureReason,
            failures: trace.validationFailures
          }).catch(() => {
          });
        }
      }
      /**
       * Starts a telemetry trace for a specific functionality.
       * @param fid 
       * @returns Trace data
       */
      startTrace(fid) {
        return {
          startTime: process.hrtime.bigint(),
          startMemory: process.memoryUsage ? process.memoryUsage().heapUsed : 0
        };
      }
      /**
       * Ends a telemetry trace and updates aggregated metrics.
       * @param fid 
       * @param trace 
       */
      endTrace(fid, trace, success = true) {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        const latencyNs = Number(endTime - trace.startTime);
        const memoryDelta = endMemory - trace.startMemory;
        const latencyMs = latencyNs / 1e6;
        let stats = this.metrics.get(fid);
        if (!stats) {
          stats = {
            calls: 0,
            errors: 0,
            totalLatencyNs: 0,
            avgLatencyMs: 0,
            peakLatencyMs: 0,
            totalMemoryDelta: 0,
            avgMemoryDelta: 0,
            lastUpdated: 0
          };
          this.metrics.set(fid, stats);
        }
        stats.calls++;
        if (!success) stats.errors++;
        stats.totalLatencyNs += latencyNs;
        stats.totalMemoryDelta += memoryDelta;
        stats.avgLatencyMs = stats.totalLatencyNs / stats.calls / 1e6;
        stats.avgMemoryDelta = stats.totalMemoryDelta / stats.calls;
        if (latencyMs > stats.peakLatencyMs) stats.peakLatencyMs = latencyMs;
        stats.lastUpdated = Date.now();
        if (this.enabled) {
          let logs = this.callLogs.get(fid);
          if (!logs) {
            logs = [];
            this.callLogs.set(fid, logs);
          }
          logs.push({
            timestamp: Date.now(),
            durationMs: latencyMs,
            success
          });
          if (logs.length > this.ringBufferSize) {
            logs.shift();
          }
        }
        if (this.runtimeStore) {
          this.runtimeStore.appendTelemetry({
            type: "standard_call",
            endpointId: fid,
            timestamp: Date.now(),
            durationMs: latencyMs,
            success
          }).catch(() => {
          });
        }
      }
      /**
       * Record library usage (functions/helpers).
       */
      recordLibraryCall(libraryId, durationMs) {
        if (!this.enabled) return;
        let stats = this.libraryUsage.get(libraryId);
        if (!stats) {
          stats = { calls: 0, totalDurationMs: 0, avgDurationMs: 0 };
          this.libraryUsage.set(libraryId, stats);
        }
        stats.calls++;
        stats.totalDurationMs += durationMs;
        stats.avgDurationMs = stats.totalDurationMs / stats.calls;
      }
      /**
       * Record library data access.
       */
      recordDataAccess(dataKey, type = "read") {
        if (!this.enabled) return;
        let stats = this.dataUsage.get(dataKey);
        if (!stats) {
          stats = { reads: 0, writes: 0 };
          this.dataUsage.set(dataKey, stats);
        }
        if (type === "read") stats.reads++;
        else stats.writes++;
      }
      /**
       * Returns a snapshot of all metrics.
       */
      getSummary() {
        return {
          metrics: Object.fromEntries(this.metrics),
          callLogs: Object.fromEntries(this.callLogs),
          libraryUsage: Object.fromEntries(this.libraryUsage),
          dataUsage: Object.fromEntries(this.dataUsage)
        };
      }
      /**
       * Clears all collected metrics.
       */
      reset() {
        this.metrics.clear();
        this.callLogs.clear();
        this.libraryUsage.clear();
        this.dataUsage.clear();
      }
    };
    telemetry = new KrnlTelemetry();
  }
});

// ../core/dist/chunk-XSCKNRCZ.js
function calculateContentHash(data) {
  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return import_crypto.default.createHash("sha256").update(buffer).digest("hex");
}
function normalizeWorkspacePath(pathStr) {
  if (!pathStr || pathStr === "." || pathStr === "/") return "";
  let clean = pathStr.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  clean = clean.replace(/\/+/g, "/");
  return clean;
}
var import_crypto, import_promises, import_path, import_promises2, import_path2, import_os, krnlErrorCodes, krnlErrorMessages, BaseWorkspaceStorageAdapter, LocalStorageAdapter, ICloudStorageAdapter, GoogleDriveStorageAdapter, OneDriveStorageAdapter, SupabaseStorageAdapter, FirebaseStorageAdapter, StorageAdapterFactory;
var init_chunk_XSCKNRCZ = __esm({
  "../core/dist/chunk-XSCKNRCZ.js"() {
    "use strict";
    init_chunk_MLVWARD4();
    init_chunk_DI27MOR7();
    import_crypto = __toESM(require("crypto"), 1);
    import_promises = __toESM(require("fs/promises"), 1);
    import_path = __toESM(require("path"), 1);
    import_promises2 = __toESM(require("fs/promises"), 1);
    import_path2 = __toESM(require("path"), 1);
    import_os = __toESM(require("os"), 1);
    krnlErrorCodes = Object.freeze({
      // Enum errors (0-99)
      ENUM_ID_NOT_FOUND: -1,
      // State errors (100-199)
      STATE_NOT_FOUND: 100,
      STATE_DUPLICATE_NAME: 101,
      STATE_INDEX_OUT_OF_RANGE: 102,
      // Functionality errors (200-299)
      FUNCTIONALITY_NOT_DEFINED: 200,
      FUNCTIONALITY_ALREADY_DEFINED: 201,
      FUNCTIONALITY_INSTANCE_NOT_FOUND: 202,
      REMOTE_EXECUTION_FAILED: 203,
      // Interface errors (300-399)
      EMITTER_NOT_FOUND: 300,
      COLLECTOR_NOT_FOUND: 301,
      COLLECTOR_NOT_SUBSCRIBED: 302,
      // Hierarchy errors (400-499)
      ENTITY_NOT_FOUND: 400,
      // Networking/RPC errors (500-599)
      ERR_NET_RPC_TIMEOUT_EXCEEDED: 500,
      ERR_NET_RPC_NETWORK_ERROR: 501,
      ERR_NET_RPC_INTERNAL_SERVER_ERROR: 502,
      ERR_SYS_ENTITY_BUSY_RESERVED: 503,
      ERR_COM_INGRESS_ROUTE_NOT_FOUND: 504,
      ERR_KRNL_UNRESOLVED_REMOTE_TARGET: 505
    });
    krnlErrorMessages = Object.freeze({
      // Enum
      [krnlErrorCodes.ENUM_ID_NOT_FOUND]: "ERR_LIB_ENUM_ID_NOT_FOUND",
      // State
      [krnlErrorCodes.STATE_NOT_FOUND]: "ERR_LIB_STATE_NOT_FOUND",
      [krnlErrorCodes.STATE_DUPLICATE_NAME]: "ERR_LIB_STATE_DUPLICATE_NAME",
      [krnlErrorCodes.STATE_INDEX_OUT_OF_RANGE]: "ERR_LIB_STATE_INDEX_OUT_OF_RANGE",
      // Functionality
      [krnlErrorCodes.FUNCTIONALITY_NOT_DEFINED]: "ERR_LIB_FUNCTIONALITY_NOT_DEFINED",
      [krnlErrorCodes.FUNCTIONALITY_ALREADY_DEFINED]: "ERR_LIB_FUNCTIONALITY_ALREADY_DEFINED",
      [krnlErrorCodes.FUNCTIONALITY_INSTANCE_NOT_FOUND]: "ERR_LIB_FUNCTIONALITY_INSTANCE_NOT_FOUND",
      [krnlErrorCodes.REMOTE_EXECUTION_FAILED]: "ERR_LIB_REMOTE_EXECUTION_FAILED",
      // Interface
      [krnlErrorCodes.EMITTER_NOT_FOUND]: "ERR_INT_EMITTER_NOT_FOUND",
      [krnlErrorCodes.COLLECTOR_NOT_FOUND]: "ERR_INT_COLLECTOR_NOT_FOUND",
      [krnlErrorCodes.COLLECTOR_NOT_SUBSCRIBED]: "ERR_INT_COLLECTOR_NOT_SUBSCRIBED",
      // Hierarchy
      [krnlErrorCodes.ENTITY_NOT_FOUND]: "ERR_SYS_ENTITY_NOT_FOUND",
      // Networking/RPC
      [krnlErrorCodes.ERR_NET_RPC_TIMEOUT_EXCEEDED]: "ERR_NET_RPC_TIMEOUT_EXCEEDED",
      [krnlErrorCodes.ERR_NET_RPC_NETWORK_ERROR]: "ERR_NET_RPC_NETWORK_ERROR",
      [krnlErrorCodes.ERR_NET_RPC_INTERNAL_SERVER_ERROR]: "ERR_NET_RPC_INTERNAL_SERVER_ERROR",
      [krnlErrorCodes.ERR_SYS_ENTITY_BUSY_RESERVED]: "ERR_SYS_ENTITY_BUSY_RESERVED",
      [krnlErrorCodes.ERR_COM_INGRESS_ROUTE_NOT_FOUND]: "ERR_COM_INGRESS_ROUTE_NOT_FOUND",
      [krnlErrorCodes.ERR_KRNL_UNRESOLVED_REMOTE_TARGET]: "ERR_KRNL_UNRESOLVED_REMOTE_TARGET"
    });
    BaseWorkspaceStorageAdapter = class {
      watchers = /* @__PURE__ */ new Map();
      isInitialized = false;
      watch(pathStr, callback) {
        const norm = normalizeWorkspacePath(pathStr);
        if (!this.watchers.has(norm)) {
          this.watchers.set(norm, /* @__PURE__ */ new Set());
        }
        this.watchers.get(norm).add(callback);
        return () => {
          const set = this.watchers.get(norm);
          if (set) {
            set.delete(callback);
            if (set.size === 0) {
              this.watchers.delete(norm);
            }
          }
        };
      }
      notifyWatchers(event) {
        const norm = normalizeWorkspacePath(event.path);
        const directSet = this.watchers.get(norm);
        if (directSet) {
          for (const cb of directSet) {
            try {
              cb(event);
            } catch {
            }
          }
        }
        const rootSet = this.watchers.get("");
        if (rootSet && norm !== "") {
          for (const cb of rootSet) {
            try {
              cb(event);
            } catch {
            }
          }
        }
      }
      async disconnect() {
        this.watchers.clear();
        this.isInitialized = false;
      }
    };
    LocalStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "local";
      endpointId;
      basePath;
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        this.basePath = import_path.default.resolve(config.basePath || "./storage");
      }
      getFullPath(relPath) {
        const norm = normalizeWorkspacePath(relPath);
        return import_path.default.join(this.basePath, norm);
      }
      async initialize() {
        if (this.isInitialized) return;
        await import_promises.default.mkdir(this.basePath, { recursive: true });
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const full = this.getFullPath(pathStr);
        try {
          await import_promises.default.access(full);
          return true;
        } catch {
          return false;
        }
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(pathStr);
        const st = await import_promises.default.stat(full);
        let contentHash;
        if (!st.isDirectory()) {
          const data = await import_promises.default.readFile(full);
          contentHash = calculateContentHash(data);
        }
        return {
          path: norm,
          type: st.isDirectory() ? "directory" : "file",
          size: st.size,
          modifiedAt: Math.floor(st.mtimeMs),
          contentHash,
          revision: String(Math.floor(st.mtimeMs))
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        const entries = [];
        const scanDir = async (dirFull, prefix) => {
          let items = [];
          try {
            items = await import_promises.default.readdir(dirFull);
          } catch {
            return;
          }
          for (const item of items) {
            const itemFull = import_path.default.join(dirFull, item);
            const itemRel = prefix ? `${prefix}/${item}` : item;
            try {
              const st = await import_promises.default.stat(itemFull);
              if (st.isDirectory()) {
                entries.push({
                  path: itemRel,
                  name: item,
                  type: "directory",
                  size: 0,
                  modifiedAt: Math.floor(st.mtimeMs)
                });
                await scanDir(itemFull, itemRel);
              } else {
                entries.push({
                  path: itemRel,
                  name: item,
                  type: "file",
                  size: st.size,
                  modifiedAt: Math.floor(st.mtimeMs)
                });
              }
            } catch {
            }
          }
        };
        await scanDir(full, norm);
        return entries;
      }
      async read(pathStr) {
        await this.initialize();
        const full = this.getFullPath(pathStr);
        const buffer = await import_promises.default.readFile(full);
        return new Uint8Array(buffer);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        await import_promises.default.mkdir(import_path.default.dirname(full), { recursive: true });
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        await import_promises.default.writeFile(full, buffer);
        const hash = calculateContentHash(buffer);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: buffer.length,
            modifiedAt: Date.now(),
            contentHash: hash,
            revision: String(Date.now())
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        await import_promises.default.mkdir(full, { recursive: true });
        this.notifyWatchers({
          type: "create",
          path: norm,
          metadata: {
            path: norm,
            type: "directory",
            size: 0,
            modifiedAt: Date.now()
          }
        });
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        try {
          const st = await import_promises.default.stat(full);
          if (st.isDirectory()) {
            await import_promises.default.rm(full, { recursive: true, force: true });
          } else {
            await import_promises.default.unlink(full);
          }
          this.notifyWatchers({ type: "delete", path: norm });
        } catch {
        }
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const srcFull = this.getFullPath(srcNorm);
        const destFull = this.getFullPath(destNorm);
        await import_promises.default.mkdir(import_path.default.dirname(destFull), { recursive: true });
        await import_promises.default.rename(srcFull, destFull);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const srcFull = this.getFullPath(srcNorm);
        const destFull = this.getFullPath(destNorm);
        await import_promises.default.mkdir(import_path.default.dirname(destFull), { recursive: true });
        await import_promises.default.copyFile(srcFull, destFull);
        const st = await import_promises.default.stat(destFull);
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: "file",
            size: st.size,
            modifiedAt: Math.floor(st.mtimeMs)
          }
        });
      }
    };
    ICloudStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "icloud";
      endpointId;
      basePath;
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        if (config.basePath) {
          this.basePath = import_path2.default.resolve(config.basePath);
        } else {
          const home = import_os.default.homedir();
          const container = config.containerId ? `iCloud~${config.containerId}` : "com~apple~CloudDocs";
          this.basePath = import_path2.default.join(home, "Library", "Mobile Documents", container, "Workspaces");
        }
      }
      getFullPath(relPath) {
        const norm = normalizeWorkspacePath(relPath);
        return import_path2.default.join(this.basePath, norm);
      }
      async initialize() {
        if (this.isInitialized) return;
        try {
          await import_promises2.default.mkdir(this.basePath, { recursive: true });
        } catch {
          const fallback = import_path2.default.resolve("./.icloud_sandbox");
          await import_promises2.default.mkdir(fallback, { recursive: true });
          this.basePath = fallback;
        }
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const full = this.getFullPath(pathStr);
        try {
          await import_promises2.default.access(full);
          return true;
        } catch {
          return false;
        }
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(pathStr);
        const st = await import_promises2.default.stat(full);
        let contentHash;
        if (!st.isDirectory()) {
          const data = await import_promises2.default.readFile(full);
          contentHash = calculateContentHash(data);
        }
        return {
          path: norm,
          type: st.isDirectory() ? "directory" : "file",
          size: st.size,
          modifiedAt: Math.floor(st.mtimeMs),
          contentHash,
          revision: String(Math.floor(st.mtimeMs))
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        const entries = [];
        const scanDir = async (dirFull, prefix) => {
          let items = [];
          try {
            items = await import_promises2.default.readdir(dirFull);
          } catch {
            return;
          }
          for (const item of items) {
            if (item.startsWith(".")) continue;
            const itemFull = import_path2.default.join(dirFull, item);
            const itemRel = prefix ? `${prefix}/${item}` : item;
            try {
              const st = await import_promises2.default.stat(itemFull);
              if (st.isDirectory()) {
                entries.push({
                  path: itemRel,
                  name: item,
                  type: "directory",
                  size: 0,
                  modifiedAt: Math.floor(st.mtimeMs)
                });
                await scanDir(itemFull, itemRel);
              } else {
                entries.push({
                  path: itemRel,
                  name: item,
                  type: "file",
                  size: st.size,
                  modifiedAt: Math.floor(st.mtimeMs)
                });
              }
            } catch {
            }
          }
        };
        await scanDir(full, norm);
        return entries;
      }
      async read(pathStr) {
        await this.initialize();
        const full = this.getFullPath(pathStr);
        const buffer = await import_promises2.default.readFile(full);
        return new Uint8Array(buffer);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        await import_promises2.default.mkdir(import_path2.default.dirname(full), { recursive: true });
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        await import_promises2.default.writeFile(full, buffer);
        const hash = calculateContentHash(buffer);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: buffer.length,
            modifiedAt: Date.now(),
            contentHash: hash,
            revision: String(Date.now())
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        await import_promises2.default.mkdir(full, { recursive: true });
        this.notifyWatchers({
          type: "create",
          path: norm,
          metadata: { path: norm, type: "directory", size: 0, modifiedAt: Date.now() }
        });
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const full = this.getFullPath(norm);
        try {
          const st = await import_promises2.default.stat(full);
          if (st.isDirectory()) {
            await import_promises2.default.rm(full, { recursive: true, force: true });
          } else {
            await import_promises2.default.unlink(full);
          }
          this.notifyWatchers({ type: "delete", path: norm });
        } catch {
        }
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const srcFull = this.getFullPath(srcNorm);
        const destFull = this.getFullPath(destNorm);
        await import_promises2.default.mkdir(import_path2.default.dirname(destFull), { recursive: true });
        await import_promises2.default.rename(srcFull, destFull);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const srcFull = this.getFullPath(srcNorm);
        const destFull = this.getFullPath(destNorm);
        await import_promises2.default.mkdir(import_path2.default.dirname(destFull), { recursive: true });
        await import_promises2.default.copyFile(srcFull, destFull);
        const st = await import_promises2.default.stat(destFull);
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: "file",
            size: st.size,
            modifiedAt: Math.floor(st.mtimeMs)
          }
        });
      }
    };
    GoogleDriveStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "google_drive";
      endpointId;
      rootFolderId;
      accountId;
      virtualDrive = /* @__PURE__ */ new Map();
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        this.rootFolderId = config.rootFolderId || "root";
        this.accountId = config.accountId || "default";
      }
      async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return true;
        return this.virtualDrive.has(norm);
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) {
          return {
            path: "",
            type: "directory",
            size: 0,
            modifiedAt: Date.now()
          };
        }
        const node = this.virtualDrive.get(norm);
        if (!node) {
          throw new Error(`[GoogleDrive] File not found: ${pathStr}`);
        }
        return {
          path: norm,
          type: node.type,
          size: node.size,
          modifiedAt: node.modifiedAt,
          contentHash: node.contentHash,
          revision: node.revision
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const results = [];
        for (const [key, node] of this.virtualDrive.entries()) {
          if (norm === "" || key.startsWith(`${norm}/`)) {
            const rel = norm === "" ? key : key.slice(norm.length + 1);
            results.push({
              path: key,
              name: node.name,
              type: node.type,
              size: node.size,
              modifiedAt: node.modifiedAt
            });
          }
        }
        return results;
      }
      async read(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const node = this.virtualDrive.get(norm);
        if (!node || node.type !== "file") {
          throw new Error(`[GoogleDrive] File not found or is a directory: ${pathStr}`);
        }
        return node.content || new Uint8Array(0);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        const content = new Uint8Array(buffer);
        const hash = calculateContentHash(buffer);
        const now = Date.now();
        const name = norm.split("/").pop() || norm;
        const parts = norm.split("/");
        for (let i = 1; i < parts.length; i++) {
          const parentPath = parts.slice(0, i).join("/");
          if (!this.virtualDrive.has(parentPath)) {
            this.virtualDrive.set(parentPath, {
              id: `gdir_${Date.now()}_${i}`,
              name: parts[i - 1],
              type: "directory",
              size: 0,
              modifiedAt: now,
              revision: String(now)
            });
          }
        }
        const node = {
          id: `gfile_${Date.now()}`,
          name,
          type: "file",
          content,
          size: content.length,
          modifiedAt: now,
          contentHash: hash,
          revision: String(now)
        };
        this.virtualDrive.set(norm, node);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: content.length,
            modifiedAt: now,
            contentHash: hash,
            revision: String(now)
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return;
        const now = Date.now();
        const name = norm.split("/").pop() || norm;
        this.virtualDrive.set(norm, {
          id: `gdir_${Date.now()}`,
          name,
          type: "directory",
          size: 0,
          modifiedAt: now,
          revision: String(now)
        });
        this.notifyWatchers({
          type: "create",
          path: norm,
          metadata: {
            path: norm,
            type: "directory",
            size: 0,
            modifiedAt: now
          }
        });
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        for (const key of Array.from(this.virtualDrive.keys())) {
          if (key === norm || key.startsWith(`${norm}/`)) {
            this.virtualDrive.delete(key);
          }
        }
        this.notifyWatchers({ type: "delete", path: norm });
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const node = this.virtualDrive.get(srcNorm);
        if (!node) throw new Error(`[GoogleDrive] Source not found: ${source}`);
        this.virtualDrive.delete(srcNorm);
        node.name = destNorm.split("/").pop() || destNorm;
        this.virtualDrive.set(destNorm, node);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const node = this.virtualDrive.get(srcNorm);
        if (!node) throw new Error(`[GoogleDrive] Source not found: ${source}`);
        const now = Date.now();
        this.virtualDrive.set(destNorm, {
          ...node,
          id: `gfile_${Date.now()}`,
          name: destNorm.split("/").pop() || destNorm,
          modifiedAt: now,
          revision: String(now)
        });
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: node.type,
            size: node.size,
            modifiedAt: now,
            contentHash: node.contentHash
          }
        });
      }
    };
    OneDriveStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "onedrive";
      endpointId;
      accountId;
      rootFolderId;
      items = /* @__PURE__ */ new Map();
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        this.accountId = config.accountId || "default";
        this.rootFolderId = config.rootFolderId || "root";
      }
      async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return true;
        return this.items.has(norm);
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) {
          return {
            path: "",
            type: "directory",
            size: 0,
            modifiedAt: Date.now()
          };
        }
        const item = this.items.get(norm);
        if (!item) {
          throw new Error(`[OneDrive] Item not found: ${pathStr}`);
        }
        return {
          path: norm,
          type: item.type,
          size: item.size,
          modifiedAt: item.modifiedAt,
          contentHash: item.contentHash,
          revision: item.eTag
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const results = [];
        for (const [key, item] of this.items.entries()) {
          if (norm === "" || key.startsWith(`${norm}/`)) {
            results.push({
              path: key,
              name: item.name,
              type: item.type,
              size: item.size,
              modifiedAt: item.modifiedAt
            });
          }
        }
        return results;
      }
      async read(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const item = this.items.get(norm);
        if (!item || item.type !== "file") {
          throw new Error(`[OneDrive] File not found: ${pathStr}`);
        }
        return item.content || new Uint8Array(0);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        const content = new Uint8Array(buffer);
        const hash = calculateContentHash(buffer);
        const now = Date.now();
        const name = norm.split("/").pop() || norm;
        const parts = norm.split("/");
        for (let i = 1; i < parts.length; i++) {
          const parent = parts.slice(0, i).join("/");
          if (!this.items.has(parent)) {
            this.items.set(parent, {
              id: `onedrive_dir_${now}_${i}`,
              name: parts[i - 1],
              type: "directory",
              size: 0,
              modifiedAt: now,
              eTag: `"{etag_${now}}"`
            });
          }
        }
        const item = {
          id: `onedrive_file_${now}`,
          name,
          type: "file",
          content,
          size: content.length,
          modifiedAt: now,
          contentHash: hash,
          eTag: `"{etag_${now}_${hash.slice(0, 8)}}"`
        };
        this.items.set(norm, item);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: content.length,
            modifiedAt: now,
            contentHash: hash,
            revision: item.eTag
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return;
        const now = Date.now();
        this.items.set(norm, {
          id: `onedrive_dir_${now}`,
          name: norm.split("/").pop() || norm,
          type: "directory",
          size: 0,
          modifiedAt: now,
          eTag: `"{etag_${now}}"`
        });
        this.notifyWatchers({
          type: "create",
          path: norm,
          metadata: { path: norm, type: "directory", size: 0, modifiedAt: now }
        });
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        for (const key of Array.from(this.items.keys())) {
          if (key === norm || key.startsWith(`${norm}/`)) {
            this.items.delete(key);
          }
        }
        this.notifyWatchers({ type: "delete", path: norm });
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const item = this.items.get(srcNorm);
        if (!item) throw new Error(`[OneDrive] Source not found: ${source}`);
        this.items.delete(srcNorm);
        item.name = destNorm.split("/").pop() || destNorm;
        this.items.set(destNorm, item);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const item = this.items.get(srcNorm);
        if (!item) throw new Error(`[OneDrive] Source not found: ${source}`);
        const now = Date.now();
        this.items.set(destNorm, {
          ...item,
          id: `onedrive_file_${now}`,
          name: destNorm.split("/").pop() || destNorm,
          modifiedAt: now,
          eTag: `"{etag_${now}}"`
        });
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: item.type,
            size: item.size,
            modifiedAt: now,
            contentHash: item.contentHash
          }
        });
      }
    };
    SupabaseStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "supabase_storage";
      endpointId;
      projectUrl;
      bucket;
      objects = /* @__PURE__ */ new Map();
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        this.projectUrl = config.projectUrl || "https://supabase.co";
        this.bucket = config.bucket || "workspace";
      }
      async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return true;
        return this.objects.has(norm);
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) {
          return { path: "", type: "directory", size: 0, modifiedAt: Date.now() };
        }
        const obj = this.objects.get(norm);
        if (!obj) {
          throw new Error(`[SupabaseStorage] Object not found in bucket '${this.bucket}': ${pathStr}`);
        }
        return {
          path: norm,
          type: "file",
          size: obj.size,
          modifiedAt: obj.updatedAt,
          contentHash: obj.contentHash,
          revision: String(obj.updatedAt)
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const results = [];
        for (const [key, obj] of this.objects.entries()) {
          if (norm === "" || key.startsWith(`${norm}/`)) {
            results.push({
              path: key,
              name: obj.name,
              type: "file",
              size: obj.size,
              modifiedAt: obj.updatedAt
            });
          }
        }
        return results;
      }
      async read(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const obj = this.objects.get(norm);
        if (!obj) {
          throw new Error(`[SupabaseStorage] Object not found: ${pathStr}`);
        }
        return obj.content || new Uint8Array(0);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        const content = new Uint8Array(buffer);
        const hash = calculateContentHash(buffer);
        const now = Date.now();
        const name = norm.split("/").pop() || norm;
        const obj = {
          name,
          id: `sb_obj_${now}_${Math.random().toString(36).substring(2, 7)}`,
          bucketId: this.bucket,
          content,
          size: content.length,
          updatedAt: now,
          contentHash: hash
        };
        this.objects.set(norm, obj);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: content.length,
            modifiedAt: now,
            contentHash: hash,
            revision: String(now)
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        for (const key of Array.from(this.objects.keys())) {
          if (key === norm || key.startsWith(`${norm}/`)) {
            this.objects.delete(key);
          }
        }
        this.notifyWatchers({ type: "delete", path: norm });
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const obj = this.objects.get(srcNorm);
        if (!obj) throw new Error(`[SupabaseStorage] Source not found: ${source}`);
        this.objects.delete(srcNorm);
        obj.name = destNorm.split("/").pop() || destNorm;
        this.objects.set(destNorm, obj);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const obj = this.objects.get(srcNorm);
        if (!obj) throw new Error(`[SupabaseStorage] Source not found: ${source}`);
        const now = Date.now();
        this.objects.set(destNorm, {
          ...obj,
          id: `sb_obj_${now}`,
          name: destNorm.split("/").pop() || destNorm,
          updatedAt: now
        });
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: "file",
            size: obj.size,
            modifiedAt: now,
            contentHash: obj.contentHash
          }
        });
      }
    };
    FirebaseStorageAdapter = class extends BaseWorkspaceStorageAdapter {
      provider = "firebase_storage";
      endpointId;
      projectId;
      bucket;
      blobs = /* @__PURE__ */ new Map();
      constructor(endpointId, config) {
        super();
        this.endpointId = endpointId;
        this.projectId = config.projectId || "default-project";
        this.bucket = config.bucket || `${this.projectId}.appspot.com`;
      }
      async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
      }
      async exists(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) return true;
        return this.blobs.has(norm);
      }
      async stat(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        if (!norm) {
          return { path: "", type: "directory", size: 0, modifiedAt: Date.now() };
        }
        const blob = this.blobs.get(norm);
        if (!blob) {
          throw new Error(`[FirebaseStorage] Blob not found in bucket '${this.bucket}': ${pathStr}`);
        }
        return {
          path: norm,
          type: "file",
          size: blob.size,
          modifiedAt: blob.updated,
          contentHash: blob.contentHash,
          revision: blob.generation
        };
      }
      async list(pathStr = "") {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const results = [];
        for (const [key, blob] of this.blobs.entries()) {
          if (norm === "" || key.startsWith(`${norm}/`)) {
            results.push({
              path: key,
              name: blob.name,
              type: "file",
              size: blob.size,
              modifiedAt: blob.updated
            });
          }
        }
        return results;
      }
      async read(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const blob = this.blobs.get(norm);
        if (!blob) {
          throw new Error(`[FirebaseStorage] Blob not found: ${pathStr}`);
        }
        return blob.content || new Uint8Array(0);
      }
      async write(pathStr, data) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
        const content = new Uint8Array(buffer);
        const hash = calculateContentHash(buffer);
        const now = Date.now();
        const name = norm.split("/").pop() || norm;
        const blob = {
          name,
          bucket: this.bucket,
          content,
          size: content.length,
          timeCreated: now,
          updated: now,
          contentHash: hash,
          generation: String(now)
        };
        this.blobs.set(norm, blob);
        this.notifyWatchers({
          type: "update",
          path: norm,
          metadata: {
            path: norm,
            type: "file",
            size: content.length,
            modifiedAt: now,
            contentHash: hash,
            revision: blob.generation
          }
        });
      }
      async mkdir(pathStr) {
        await this.initialize();
      }
      async delete(pathStr) {
        await this.initialize();
        const norm = normalizeWorkspacePath(pathStr);
        for (const key of Array.from(this.blobs.keys())) {
          if (key === norm || key.startsWith(`${norm}/`)) {
            this.blobs.delete(key);
          }
        }
        this.notifyWatchers({ type: "delete", path: norm });
      }
      async move(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const blob = this.blobs.get(srcNorm);
        if (!blob) throw new Error(`[FirebaseStorage] Source not found: ${source}`);
        this.blobs.delete(srcNorm);
        blob.name = destNorm.split("/").pop() || destNorm;
        this.blobs.set(destNorm, blob);
        this.notifyWatchers({ type: "delete", path: srcNorm });
        this.notifyWatchers({ type: "create", path: destNorm });
      }
      async copy(source, destination) {
        await this.initialize();
        const srcNorm = normalizeWorkspacePath(source);
        const destNorm = normalizeWorkspacePath(destination);
        const blob = this.blobs.get(srcNorm);
        if (!blob) throw new Error(`[FirebaseStorage] Source not found: ${source}`);
        const now = Date.now();
        this.blobs.set(destNorm, {
          ...blob,
          name: destNorm.split("/").pop() || destNorm,
          updated: now,
          generation: String(now)
        });
        this.notifyWatchers({
          type: "create",
          path: destNorm,
          metadata: {
            path: destNorm,
            type: "file",
            size: blob.size,
            modifiedAt: now,
            contentHash: blob.contentHash
          }
        });
      }
    };
    StorageAdapterFactory = class {
      static registry = /* @__PURE__ */ new Map();
      static instanceCache = /* @__PURE__ */ new Map();
      static {
        this.register("local", LocalStorageAdapter);
        this.register("icloud", ICloudStorageAdapter);
        this.register("google_drive", GoogleDriveStorageAdapter);
        this.register("onedrive", OneDriveStorageAdapter);
        this.register("supabase_storage", SupabaseStorageAdapter);
        this.register("firebase_storage", FirebaseStorageAdapter);
        this.register("s3", SupabaseStorageAdapter);
      }
      static register(provider, adapterClass) {
        this.registry.set(provider, adapterClass);
      }
      static create(endpoint) {
        const cacheKey = `${endpoint.id}::${endpoint.provider}`;
        if (this.instanceCache.has(cacheKey)) {
          return this.instanceCache.get(cacheKey);
        }
        const AdapterClass = this.registry.get(endpoint.provider);
        if (!AdapterClass) {
          throw new Error(`[StorageAdapterFactory] Unsupported storage provider: '${endpoint.provider}'`);
        }
        const adapter = new AdapterClass(endpoint.id, endpoint.configuration);
        this.instanceCache.set(cacheKey, adapter);
        return adapter;
      }
      static clearCache() {
        this.instanceCache.clear();
      }
    };
  }
});

// ../core/dist/chunk-K54K2KZW.js
function createEnum(typeNames) {
  const enumObj = Object.create(EnumTemplate);
  enumObj.types = typeNames;
  typeNames.forEach((name, index) => {
    enumObj[name] = index;
  });
  return Object.freeze(enumObj);
}
var EnumTemplate, krnlSystemTypes, krnlServiceSuites, defaultConnectionBehaviour, krnlServiceSuitePorts, krnlPrimitiveDataTypes;
var init_chunk_K54K2KZW = __esm({
  "../core/dist/chunk-K54K2KZW.js"() {
    "use strict";
    EnumTemplate = {
      types: [],
      listTypes() {
        return Object.freeze([...this.types]);
      },
      getTypeID(typeName) {
        return this[typeName] !== void 0 ? this[typeName] : -1;
      }
    };
    krnlSystemTypes = createEnum(["qwnsr", "brnda", "symba", "mosy"]);
    krnlServiceSuites = createEnum(["UNIFIED_HTTP"]);
    defaultConnectionBehaviour = createEnum([
      "allow_unlisted",
      "ask_key_unlisted",
      "forbid_unlisted"
    ]);
    krnlServiceSuitePorts = Object.freeze({
      UNIFIED_HTTP: 1
    });
    krnlPrimitiveDataTypes = createEnum(["audio", "control-signal", "video", "MIDI", "OSC", "text", "trigger"]);
  }
});

// ../core/dist/chunk-OEINUDSE.js
var init_chunk_OEINUDSE = __esm({
  "../core/dist/chunk-OEINUDSE.js"() {
    "use strict";
    init_chunk_K54K2KZW();
  }
});

// ../core/dist/chunk-V2DX7YIU.js
var init_chunk_V2DX7YIU = __esm({
  "../core/dist/chunk-V2DX7YIU.js"() {
    "use strict";
    init_chunk_HIMEZUU2();
    init_chunk_XSCKNRCZ();
    init_chunk_MLVWARD4();
    init_chunk_OEINUDSE();
  }
});

// ../core/dist/chunk-6ULMHNXR.js
var init_chunk_6ULMHNXR = __esm({
  "../core/dist/chunk-6ULMHNXR.js"() {
    "use strict";
    init_chunk_K54K2KZW();
  }
});

// ../core/dist/chunk-7WUETJEV.js
var import_url, import_path3, import_meta, __filename, __dirname2;
var init_chunk_7WUETJEV = __esm({
  "../core/dist/chunk-7WUETJEV.js"() {
    "use strict";
    import_url = require("url");
    import_path3 = __toESM(require("path"), 1);
    import_meta = {};
    __filename = (0, import_url.fileURLToPath)(import_meta.url);
    __dirname2 = import_path3.default.dirname(__filename);
  }
});

// ../core/dist/chunk-KFQGP6VL.js
var __defProp2, __getOwnPropNames2, __require, __esm2, __export;
var init_chunk_KFQGP6VL = __esm({
  "../core/dist/chunk-KFQGP6VL.js"() {
    "use strict";
    __defProp2 = Object.defineProperty;
    __getOwnPropNames2 = Object.getOwnPropertyNames;
    __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
      get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
    }) : x)(function(x) {
      if (typeof require !== "undefined") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + x + '" is not supported');
    });
    __esm2 = (fn, res) => function __init() {
      return fn && (res = (0, fn[__getOwnPropNames2(fn)[0]])(fn = 0)), res;
    };
    __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
  }
});

// ../core/dist/chunk-6QCYRS5L.js
var import_fs, import_path4, K_LIB_Krnl_Frontend_Builder_exports, KrnlFrontendBuilder, init_K_LIB_Krnl_Frontend_Builder;
var init_chunk_6QCYRS5L = __esm({
  "../core/dist/chunk-6QCYRS5L.js"() {
    "use strict";
    init_chunk_KFQGP6VL();
    import_fs = __toESM(require("fs"), 1);
    import_path4 = __toESM(require("path"), 1);
    K_LIB_Krnl_Frontend_Builder_exports = {};
    __export(K_LIB_Krnl_Frontend_Builder_exports, {
      KrnlFrontendBuilder: () => KrnlFrontendBuilder
    });
    init_K_LIB_Krnl_Frontend_Builder = __esm2({
      "src/core/K_LIB_Krnl_Frontend_Builder.ts"() {
        KrnlFrontendBuilder = class {
          static activeContexts = /* @__PURE__ */ new Map();
          /**
           * Bundles frontend/src/index.ts -> frontend/dist/bundle.js
           */
          static async build(frontendDir) {
            const entryFileTs = import_path4.default.join(frontendDir, "src", "index.ts");
            const entryFileTsx = import_path4.default.join(frontendDir, "src", "index.tsx");
            const entryFile = import_fs.default.existsSync(entryFileTs) ? entryFileTs : entryFileTsx;
            if (!import_fs.default.existsSync(entryFile)) {
              return false;
            }
            const distDir = import_path4.default.join(frontendDir, "dist");
            import_fs.default.mkdirSync(distDir, { recursive: true });
            try {
              const candidates = [
                // When running from inside KrnlTS dist (relative to __dirname)
                import_path4.default.resolve(__dirname, "..", "..", "frontend", "atoms"),
                import_path4.default.resolve(__dirname, "..", "frontend", "atoms"),
                // Scoped package (@dinilmusick/krnlts) installed in consuming app
                import_path4.default.resolve(process.cwd(), "node_modules", "@dinilmusick", "krnlts", "dist", "frontend", "atoms"),
                import_path4.default.resolve(process.cwd(), "node_modules", "@dinilmusick", "krnlts", "src", "krnl", "frontend", "atoms"),
                // Unscoped fallback (krnlts)
                import_path4.default.resolve(process.cwd(), "node_modules", "krnlts", "dist", "frontend", "atoms"),
                import_path4.default.resolve(process.cwd(), "node_modules", "krnlts", "src", "krnl", "frontend", "atoms")
              ];
              const nodeModulesAtoms = candidates.find((c) => import_fs.default.existsSync(c));
              const srcAtoms = import_path4.default.join(frontendDir, "src", "atoms");
              if (nodeModulesAtoms) {
                import_fs.default.mkdirSync(srcAtoms, { recursive: true });
                import_fs.default.cpSync(nodeModulesAtoms, srcAtoms, { recursive: true, force: true });
                console.log(`[KrnlFrontendBuilder] Atoms synced from ${nodeModulesAtoms}`);
              } else {
                console.warn(`[KrnlFrontendBuilder] No atoms source found in any candidate path.`);
              }
            } catch (e) {
            }
            try {
              const esbuild2 = await import("esbuild");
              console.log(`[KrnlFrontendBuilder] Bundling ${entryFile} -> ${distDir}/bundle.js...`);
              await esbuild2.build({
                entryPoints: [entryFile],
                bundle: true,
                outfile: import_path4.default.join(distDir, "bundle.js"),
                loader: {
                  ".css": "css",
                  ".ts": "ts",
                  ".js": "js"
                },
                sourcemap: process.env.NODE_ENV !== "production",
                minify: process.env.NODE_ENV === "production",
                logLevel: "warning"
              });
              console.log(`[KrnlFrontendBuilder] Bundle build successful.`);
              return true;
            } catch (err) {
              if (err.code === "ERR_MODULE_NOT_FOUND" || err.message?.includes("Cannot find module")) {
                console.warn(`[KrnlFrontendBuilder] esbuild peer dependency not found. Skipping build. Run 'npm i esbuild' to enable in-process UI compilation.`);
              } else {
                console.error(`[KrnlFrontendBuilder] Build failed:`, err.message || err);
              }
              return false;
            }
          }
          /**
           * Starts esbuild watch mode for live updates during development
           */
          static async watch(frontendDir) {
            if (this.activeContexts.has(frontendDir)) {
              return;
            }
            const entryFileTs = import_path4.default.join(frontendDir, "src", "index.ts");
            const entryFileTsx = import_path4.default.join(frontendDir, "src", "index.tsx");
            const entryFile = import_fs.default.existsSync(entryFileTs) ? entryFileTs : entryFileTsx;
            if (!import_fs.default.existsSync(entryFile)) {
              return;
            }
            try {
              const esbuild2 = await import("esbuild");
              const ctx = await esbuild2.context({
                entryPoints: [entryFile],
                bundle: true,
                outfile: import_path4.default.join(frontendDir, "dist", "bundle.js"),
                loader: {
                  ".css": "css",
                  ".ts": "ts",
                  ".js": "js"
                },
                logLevel: "warning"
              });
              await ctx.watch();
              this.activeContexts.set(frontendDir, ctx);
              console.log(`[KrnlFrontendBuilder] esbuild watching ${frontendDir}/src for changes.`);
            } catch (err) {
            }
          }
          static stop(frontendDir) {
            const ctx = this.activeContexts.get(frontendDir);
            if (ctx) {
              ctx.dispose();
              this.activeContexts.delete(frontendDir);
            }
          }
        };
      }
    });
  }
});

// ../core/dist/chunk-GADIRLRS.js
var init_chunk_GADIRLRS = __esm({
  "../core/dist/chunk-GADIRLRS.js"() {
    "use strict";
    init_chunk_MLVWARD4();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js
var init_Options = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Options.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js
var init_Refs = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/Refs.js"() {
    "use strict";
    init_Options();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js
var init_errorMessages = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/errorMessages.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js
var init_any = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/any.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js
var init_array = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/array.js"() {
    "use strict";
    init_errorMessages();
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
var init_bigint = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js"() {
    "use strict";
    init_errorMessages();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
var init_boolean = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
var init_branded = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/branded.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var init_catch = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/catch.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js
var init_date = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/date.js"() {
    "use strict";
    init_errorMessages();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js
var init_default = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/default.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
var init_effects = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/effects.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
var init_enum = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/enum.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var init_intersection = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
var init_literal = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/literal.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC;
var init_string = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/string.js"() {
    "use strict";
    init_errorMessages();
    ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js
var init_record = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/record.js"() {
    "use strict";
    init_parseDef();
    init_string();
    init_branded();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js
var init_map = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/map.js"() {
    "use strict";
    init_parseDef();
    init_record();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
var init_nativeEnum = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js
var init_never = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/never.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js
var init_null = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/null.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var init_union = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/union.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
var init_nullable = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js"() {
    "use strict";
    init_parseDef();
    init_union();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js
var init_number = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/number.js"() {
    "use strict";
    init_errorMessages();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js
var init_object = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/object.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var init_optional = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/optional.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var init_pipeline = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
var init_promise = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/promise.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js
var init_set = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/set.js"() {
    "use strict";
    init_errorMessages();
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
var init_tuple = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
var init_undefined = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
var init_unknown = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js"() {
    "use strict";
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var init_readonly = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js"() {
    "use strict";
    init_parseDef();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js
var init_parseDef = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/parseDef.js"() {
    "use strict";
    init_any();
    init_array();
    init_bigint();
    init_boolean();
    init_branded();
    init_catch();
    init_date();
    init_default();
    init_effects();
    init_enum();
    init_intersection();
    init_literal();
    init_map();
    init_nativeEnum();
    init_never();
    init_null();
    init_nullable();
    init_number();
    init_object();
    init_optional();
    init_pipeline();
    init_promise();
    init_record();
    init_set();
    init_string();
    init_tuple();
    init_undefined();
    init_union();
    init_unknown();
    init_readonly();
    init_Options();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var init_zodToJsonSchema = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js"() {
    "use strict";
    init_parseDef();
    init_Refs();
  }
});

// ../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js
var init_esm = __esm({
  "../../node_modules/.pnpm/zod-to-json-schema@3.24.1_zod@3.24.1/node_modules/zod-to-json-schema/dist/esm/index.js"() {
    "use strict";
    init_Options();
    init_Refs();
    init_errorMessages();
    init_parseDef();
    init_any();
    init_array();
    init_bigint();
    init_boolean();
    init_branded();
    init_catch();
    init_date();
    init_default();
    init_effects();
    init_enum();
    init_intersection();
    init_literal();
    init_map();
    init_nativeEnum();
    init_never();
    init_null();
    init_nullable();
    init_number();
    init_object();
    init_optional();
    init_pipeline();
    init_promise();
    init_readonly();
    init_record();
    init_set();
    init_string();
    init_tuple();
    init_undefined();
    init_union();
    init_unknown();
    init_zodToJsonSchema();
    init_zodToJsonSchema();
  }
});

// ../core/dist/chunk-P6XEM2LA.js
var init_chunk_P6XEM2LA = __esm({
  "../core/dist/chunk-P6XEM2LA.js"() {
    "use strict";
    init_chunk_DI27MOR7();
    init_esm();
  }
});

// ../core/dist/chunk-3ES4K2ZP.js
var import_ws;
var init_chunk_3ES4K2ZP = __esm({
  "../core/dist/chunk-3ES4K2ZP.js"() {
    "use strict";
    init_chunk_K54K2KZW();
    import_ws = require("ws");
  }
});

// ../core/dist/chunk-YXGL3ZEU.js
var import_fs2, import_path5, import_url2, import_meta2, K_LIB_Krnl_Frontend_Generator_exports, _metaUrl, _filename, _dirname, KrnlFrontendGenerator, init_K_LIB_Krnl_Frontend_Generator;
var init_chunk_YXGL3ZEU = __esm({
  "../core/dist/chunk-YXGL3ZEU.js"() {
    "use strict";
    init_chunk_KFQGP6VL();
    import_fs2 = __toESM(require("fs"), 1);
    import_path5 = __toESM(require("path"), 1);
    import_url2 = require("url");
    import_meta2 = {};
    K_LIB_Krnl_Frontend_Generator_exports = {};
    __export(K_LIB_Krnl_Frontend_Generator_exports, {
      KrnlFrontendGenerator: () => KrnlFrontendGenerator
    });
    init_K_LIB_Krnl_Frontend_Generator = __esm2({
      "src/core/K_LIB_Krnl_Frontend_Generator.ts"() {
        _metaUrl = typeof import_meta2 !== "undefined" && import_meta2.url ? import_meta2.url : null;
        _filename = _metaUrl ? (0, import_url2.fileURLToPath)(_metaUrl) : "";
        _dirname = _metaUrl ? import_path5.default.dirname(_filename) : "";
        KrnlFrontendGenerator = class {
          /**
           * Main entrypoint: ensures skeleton exists, generates React components & index.tsx
           */
          static async generate(entity, frontendDir) {
            this.ensureFrontendSkeleton(entity, frontendDir);
            const uiAllowlist = entity._frontend?.options?.uiEndpoints;
            const uiEndpointsMap = /* @__PURE__ */ new Map();
            const collectEndpoints = (ent) => {
              const funcs = [
                ...ent.localFunctionalities?.values() || [],
                ...ent.remoteFunctionalities?.values() || []
              ];
              for (const fn of funcs) {
                if (uiAllowlist && !uiAllowlist.includes(fn.id)) {
                  continue;
                }
                const uiSpec = fn.uiSpec || fn.ui_spec;
                if (!uiSpec) {
                  continue;
                }
                if (uiSpec && uiSpec.ui_component_enabled) {
                  if (!uiEndpointsMap.has(fn.id)) {
                    uiEndpointsMap.set(fn.id, { id: fn.id, uiSpec, schema: fn.schema });
                  }
                }
              }
              const children = ent.hierarchyManager?.ownedComponents || ent.components;
              if (children && typeof children.values === "function") {
                for (const child of children.values()) {
                  collectEndpoints(child);
                }
              }
            };
            collectEndpoints(entity);
            const uiEndpoints = Array.from(uiEndpointsMap.values());
            if (uiEndpoints.length > 0) {
              this.checkReactDependencies(frontendDir);
              const contractVal = this.validateExecutionContract(entity, uiEndpoints);
              if (!contractVal.valid) {
                console.error(`[KrnlFrontendGenerator] Execution Contract Validation Failed:
${contractVal.errors.map((e) => ` - ${e}`).join("\n")}`);
                throw new Error(`[KrnlExecutionContractError] ${contractVal.errors.join("; ")}`);
              }
            }
            this.generateAtoms(frontendDir);
            const componentsDir = import_path5.default.join(frontendDir, "src", "components");
            import_fs2.default.mkdirSync(componentsDir, { recursive: true });
            for (const ep of uiEndpoints) {
              const epDir = import_path5.default.join(componentsDir, ep.id);
              import_fs2.default.mkdirSync(epDir, { recursive: true });
              const compSource = this.generateComponentSource(ep.id, ep.uiSpec, ep.schema);
              import_fs2.default.writeFileSync(import_path5.default.join(epDir, "index.ts"), compSource, "utf-8");
            }
            const subAppPrefixesSet = new Set(entity._subAppRegistry?.keys() || []);
            if (entity.hierarchyManager?.ownedComponents) {
              for (const [childId, childEntity] of entity.hierarchyManager.ownedComponents.entries()) {
                if (childEntity && childEntity._frontend) {
                  subAppPrefixesSet.add(childId.toLowerCase());
                }
              }
            }
            const subAppPrefixes = Array.from(subAppPrefixesSet);
            const indexSource = this.generateIndexSource(entity.entityName, uiEndpoints, subAppPrefixes);
            import_fs2.default.writeFileSync(import_path5.default.join(frontendDir, "src", "index.ts"), indexSource, "utf-8");
          }
          /**
           * Ensures essential files (package.json, index.html, index.css, atoms/) exist in frontendDir
           */
          static ensureFrontendSkeleton(entity, frontendDir) {
            const srcDir = import_path5.default.join(frontendDir, "src");
            const atomsDir = import_path5.default.join(srcDir, "atoms");
            import_fs2.default.mkdirSync(atomsDir, { recursive: true });
            const candidates = [
              import_path5.default.resolve(_dirname, "../src/krnl/frontend/atoms"),
              import_path5.default.resolve(_dirname, "../../src/krnl/frontend/atoms"),
              import_path5.default.resolve(_dirname, "../frontend/atoms"),
              import_path5.default.resolve(process.cwd(), "node_modules/krnlts/src/krnl/frontend/atoms"),
              import_path5.default.resolve(process.cwd(), "node_modules/krnlts/dist/frontend/atoms")
            ];
            const libAtomsDir = candidates.find((c) => import_fs2.default.existsSync(c));
            if (libAtomsDir && import_fs2.default.existsSync(libAtomsDir)) {
              const files = import_fs2.default.readdirSync(libAtomsDir);
              for (const file of files) {
                const srcFile = import_path5.default.join(libAtomsDir, file);
                const destFile = import_path5.default.join(atomsDir, file);
                import_fs2.default.copyFileSync(srcFile, destFile);
              }
            }
            const pkgPath = import_path5.default.join(frontendDir, "package.json");
            if (!import_fs2.default.existsSync(pkgPath)) {
              const pkgContent = {
                name: `${entity.entityName.toLowerCase()}-frontend`,
                version: "1.0.0",
                type: "module",
                dependencies: {
                  react: "^18.2.0",
                  "react-dom": "^18.2.0"
                },
                devDependencies: {
                  "@types/react": "^18.2.0",
                  "@types/react-dom": "^18.2.0"
                }
              };
              import_fs2.default.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2), "utf-8");
            }
            const htmlPath = import_path5.default.join(frontendDir, "index.html");
            if (!import_fs2.default.existsSync(htmlPath)) {
              const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="glass-brutalism">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${entity.entityName} Frontend</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="/frontend/index.css">
</head>
<body>
  <div class="krnl-sphere krnl-sphere-accent"></div>
  <div class="krnl-sphere krnl-sphere-neutral"></div>
  <div id="root"></div>
  <script src="bundle.js"></script>
</body>
</html>`;
              import_fs2.default.writeFileSync(htmlPath, htmlContent, "utf-8");
            }
            const cssPath = import_path5.default.join(frontendDir, "index.css");
            if (!import_fs2.default.existsSync(cssPath)) {
              const defaultCss = `/* =============================================================
   KRNL Glass-Brutalism Fallback Design System
   Apple precision + glassmorphism depth + neo-brutalist structure
   Override any --krnl-* token in your own index.css to restyle.
   ============================================================= */

/* \u2500\u2500 Google Fonts fallback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* \u2500\u2500 Design Tokens \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
:root {
  /* Typography */
  --krnl-font: 'Inter', -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
  --krnl-font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;

  /* Page base \u2014 Pastel Matte Black */
  --krnl-bg: #16181d;
  --krnl-text: #f1f5f9;
  --krnl-text-muted: #8e95a5;

  /* Matte glass \u2014 panels, cards, containers (recede back) */
  --krnl-matte-bg: rgba(26, 29, 36, 0.75);
  --krnl-matte-bg-hover: rgba(34, 38, 48, 0.88);
  --krnl-matte-blur: blur(24px);

  /* Gloss \u2014 buttons, focused inputs (float forward) */
  --krnl-gloss-bg: linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%);
  --krnl-gloss-shine: inset 0 1px 0 rgba(255,255,255,0.20);

  /* Neo-brutalist borders & shadows */
  --krnl-border: 2px solid rgba(255, 255, 255, 0.85);
  --krnl-border-input: 2px solid rgba(255, 255, 255, 0.85);
  --krnl-radius: 14px;
  --krnl-radius-sm: 8px;
  --krnl-shadow: 5px 5px 0px rgba(0, 0, 0, 0.90);
  --krnl-shadow-hover: 8px 8px 0px rgba(0, 0, 0, 0.95);
  --krnl-shadow-btn: 4px 4px 0px rgba(0, 0, 0, 0.90);
  --krnl-shadow-btn-hover: 6px 6px 0px rgba(0, 0, 0, 0.95);
  --krnl-shadow-btn-active: 2px 2px 0px rgba(0, 0, 0, 0.90);

  /* Semantic accents \u2014 desaturated glow pastels for dark bg */
  --krnl-accent:      #2b4c7e; /* Dark powder blue */
  --krnl-accent-fg:   #f1f5f9;
  --krnl-success:     #1f4d36; /* Dark mint */
  --krnl-success-fg:  #f1f5f9;
  --krnl-danger:      #5c2424; /* Dark blush red */
  --krnl-danger-fg:   #f1f5f9;
  --krnl-warning:     #5e4e19; /* Dark butter yellow */
  --krnl-warning-fg:  #f1f5f9;

  /* Phantom / live-mode indicator */
  --krnl-phantom-glow: 0 0 24px rgba(48, 209, 88, 0.50);
  --krnl-phantom-border: 2px solid #30d158;
}

/* \u2500\u2500 Reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--krnl-font);
  background-color: var(--krnl-bg);
  color: var(--krnl-text);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* \u2500\u2500 Ambient Sphere Orbs (hidden for solid pastel black theme) \u2500\u2500 */
.krnl-sphere { display: none; }

/* \u2500\u2500 App Shell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-app-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
}

/* \u2500\u2500 Header (matte glass) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem 2rem;
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border-bottom: var(--krnl-border);
  box-shadow: 0 3px 0px rgba(0, 0, 0, 0.90);
  letter-spacing: -0.02em;
  position: sticky;
  top: 0;
  z-index: 100;
}
.krnl-header h1 {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--krnl-text);
  text-align: center;
}

/* \u2500\u2500 Nav Tabs (matte glass bar, wrapping + icon-only) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-nav-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border-bottom: var(--krnl-border);
}

/* Tab buttons \u2014 icon-only by default, reveal label on hover */
.krnl-tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine);
  border: var(--krnl-border);
  color: var(--krnl-text);
  font-family: var(--krnl-font);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  /* Collapsed icon-only size */
  padding: 0.45rem 0.65rem;
  min-width: 2.4rem;
  max-width: 2.4rem;
  border-radius: var(--krnl-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: box-shadow 0.15s ease, transform 0.15s ease, max-width 0.25s ease, padding 0.25s ease, gap 0.25s ease;
}

/* Tab button label \u2014 hidden until hover */
.krnl-tab-btn .krnl-tab-label {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-width 0.25s ease, opacity 0.2s ease;
  white-space: nowrap;
  pointer-events: none;
}

/* Expand on hover */
.krnl-tab-btn:hover,
.krnl-tab-btn:focus-visible {
  max-width: 14rem;
  padding: 0.45rem 1rem;
  gap: 0.4rem;
  transform: translateY(-1px);
  box-shadow: var(--krnl-gloss-shine), 4px 4px 0px rgba(0, 0, 0, 0.95);
}
.krnl-tab-btn:hover .krnl-tab-label,
.krnl-tab-btn:focus-visible .krnl-tab-label {
  max-width: 10rem;
  opacity: 1;
}

/* Active tab \u2014 always show icon + label */
.krnl-tab-btn.active {
  background: var(--krnl-accent);
  color: var(--krnl-accent-fg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn);
  transform: translateY(-1px);
  max-width: 14rem;
  padding: 0.45rem 1rem;
  gap: 0.4rem;
}
.krnl-tab-btn.active .krnl-tab-label {
  max-width: 10rem;
  opacity: 1;
}

/* \u2500\u2500 Main Content Area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-main-body {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  overflow-y: auto;
}

/* \u2500\u2500 Endpoint Card (matte glass panel) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-endpoint-card {
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  -webkit-backdrop-filter: var(--krnl-matte-blur);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius);
  box-shadow: var(--krnl-shadow);
  padding: 1.75rem;
  min-width: 320px;
  max-width: 480px;
  width: 100%;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  position: relative;
  margin: 0 auto;
}
.krnl-endpoint-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--krnl-shadow-hover);
  background: var(--krnl-matte-bg-hover);
}
.krnl-endpoint-card.krnl-phantom-active {
  border: var(--krnl-phantom-border);
  box-shadow: var(--krnl-phantom-glow);
}

.krnl-endpoint-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--krnl-text-muted);
  margin-bottom: 1.25rem;
}

/* \u2500\u2500 Form Atoms (centered, icon-first, hover-reveal text) \u2500\u2500\u2500\u2500\u2500 */
.krnl-form-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.krnl-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--krnl-text-muted);
  text-align: center;
  opacity: 0;
  max-height: 0px;
  overflow: hidden;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, max-height 0.2s ease, transform 0.2s ease;
}

.krnl-form-group:hover .krnl-label,
.krnl-form-group:focus-within .krnl-label {
  opacity: 1;
  max-height: 30px;
  transform: translateY(0);
  margin-bottom: 0.2rem;
}

/* Inputs \u2014 gloss surface (floats above matte panel) */
.krnl-input,
.krnl-select,
.krnl-textarea {
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine);
  border: var(--krnl-border-input);
  border-radius: var(--krnl-radius-sm);
  color: var(--krnl-text);
  font-family: var(--krnl-font);
  font-size: 0.9rem;
  padding: 0.65rem 0.85rem;
  width: 100%;
  text-align: center;
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}
.krnl-input:focus,
.krnl-select:focus,
.krnl-textarea:focus {
  border-color: #1d1d1f;
  box-shadow: var(--krnl-gloss-shine), 0 0 0 3px rgba(200, 223, 245, 0.50);
}
.krnl-textarea { resize: vertical; min-height: 90px; text-align: left; }

.krnl-toggle-group {
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

/* \u2500\u2500 Buttons (gloss, centered icon-first, hover-to-reveal text) \u2500\u2500 */
.krnl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--krnl-font);
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  padding: 0.65rem 1rem;
  border-radius: var(--krnl-radius-sm);
  border: var(--krnl-border);
  cursor: pointer;
  user-select: none;
  margin: 0 auto;
  transition: box-shadow 0.15s ease, transform 0.15s ease, padding 0.2s ease;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn);
  color: var(--krnl-text);
}

.krnl-btn-icon {
  font-size: 1.1rem;
  filter: grayscale(100%);
  display: inline-block;
  line-height: 1;
}

.krnl-btn-label {
  display: inline-block;
  max-width: 0px;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}

.krnl-btn:hover .krnl-btn-label,
.krnl-btn:focus .krnl-btn-label,
.krnl-btn:disabled .krnl-btn-label {
  max-width: 200px;
  opacity: 1;
  margin-left: 0.25rem;
}

.krnl-btn:hover .krnl-btn-icon {
  filter: grayscale(0%);
}

.krnl-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn-hover);
  padding: 0.65rem 1.35rem;
}
.krnl-btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow-btn-active);
}
.krnl-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Semantic button variants */
.krnl-btn-primary  { background: var(--krnl-accent);  color: var(--krnl-accent-fg); }
.krnl-btn-success  { background: var(--krnl-success); color: var(--krnl-success-fg); }
.krnl-btn-danger   { background: var(--krnl-danger);  color: var(--krnl-danger-fg); }
.krnl-btn-warning  { background: var(--krnl-warning); color: var(--krnl-warning-fg); }

/* \u2500\u2500 JSON Viewer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-json-viewer {
  background: rgba(245, 245, 247, 0.30);
  backdrop-filter: blur(8px);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius-sm);
  padding: 1rem;
  margin-top: 0.5rem;
}
.krnl-json-code {
  font-family: var(--krnl-font-mono);
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--krnl-text);
  max-height: 320px;
  overflow-y: auto;
}

/* \u2500\u2500 Tile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-tile {
  background: var(--krnl-matte-bg);
  backdrop-filter: var(--krnl-matte-blur);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius);
  box-shadow: var(--krnl-shadow);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.krnl-tile-title  { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--krnl-text-muted); }
.krnl-tile-value  { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.04em; color: var(--krnl-text); }
.krnl-tile-subtitle { font-size: 0.75rem; color: var(--krnl-text-muted); }

/* \u2500\u2500 Carousel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
}
.krnl-carousel-item {
  scroll-snap-align: start;
  flex: 0 0 220px;
  background: var(--krnl-gloss-bg);
  box-shadow: var(--krnl-gloss-shine), var(--krnl-shadow);
  border: var(--krnl-border);
  border-radius: var(--krnl-radius-sm);
  padding: 1rem;
  font-size: 0.88rem;
}

/* \u2500\u2500 Phantom Badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-phantom-badge {
  position: absolute;
  top: -10px; right: -10px;
  background: #30d158;
  color: #fff;
  font-family: var(--krnl-font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 2px solid #1d1d1f;
  box-shadow: 2px 2px 0px #1d1d1f;
}

/* \u2500\u2500 JSON Builder Rows \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-json-rows { display: flex; flex-direction: column; gap: 0.5rem; }
.krnl-json-row  { display: flex; gap: 0.5rem; align-items: center; }
.krnl-json-key  { flex: 2; }
.krnl-json-type { flex: 1; }
.krnl-json-val  { flex: 3; }

/* \u2500\u2500 Empty State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.krnl-empty {
  color: var(--krnl-text-muted);
  font-size: 0.88rem;
  text-align: center;
  padding: 2rem;
}

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 768px) {
  .krnl-header, .krnl-nav-tabs { padding-left: 1rem; padding-right: 1rem; }
  .krnl-main-body { padding: 1rem; }
  .krnl-endpoint-card { max-width: 100%; min-width: 0; }
  .krnl-sphere-accent { width: 320px; height: 320px; }
  .krnl-sphere-neutral { width: 260px; height: 260px; }
}
`;
              import_fs2.default.writeFileSync(cssPath, defaultCss, "utf-8");
            }
          }
          /**
           * Verifies React dependencies are installed in frontend/
           */
          static checkReactDependencies(frontendDir) {
            const nodeModulesReact = import_path5.default.join(frontendDir, "node_modules", "react");
            const rootNodeModulesReact = import_path5.default.resolve(frontendDir, "../../node_modules/react");
            let hasReact = import_fs2.default.existsSync(nodeModulesReact) || import_fs2.default.existsSync(rootNodeModulesReact);
            if (!hasReact) {
              try {
                __require.resolve("react", { paths: [frontendDir, process.cwd()] });
                hasReact = true;
              } catch (_) {
              }
            }
            if (!hasReact) {
              console.error(`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 [KrnlFrontend] WARNING: UI components are enabled but React is missing! \u2502
\u2502 Please run inside your frontend/ directory:                             \u2502
\u2502   npm install react react-dom                                           \u2502
\u2502   npm install -D @types/react @types/react-dom                         \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
`);
            }
          }
          /**
           * Validates uiSpec definitions at build time to enforce protocol constraints and catch errors early
           */
          static validateUiSpec(fid, uiSpec) {
            const errors = [];
            const ALLOWED_INPUT_COMPONENTS = /* @__PURE__ */ new Set([
              "KrnlTextInput",
              "KrnlNumberInput",
              "KrnlToggle",
              "KrnlDropdown",
              "KrnlTextArea",
              "KrnlJsonInput"
            ]);
            const ALLOWED_OUTPUT_COMPONENTS = /* @__PURE__ */ new Set([
              "KrnlJsonViewer",
              "KrnlCarousel",
              "KrnlTile",
              "KrnlSSELog"
            ]);
            (uiSpec.inputs || []).forEach((spec) => {
              if (!spec.field || typeof spec.field !== "string") {
                errors.push(`[ERR_UISPEC_MISSING_FIELD] Endpoint '${fid}' input is missing required 'field' name.`);
              }
              if (spec.component && !ALLOWED_INPUT_COMPONENTS.has(spec.component)) {
                errors.push(`[ERR_UISPEC_INVALID_INPUT_COMPONENT] Endpoint '${fid}' input '${spec.field}' uses invalid component '${spec.component}'. Allowed input components: ${Array.from(ALLOWED_INPUT_COMPONENTS).join(", ")}`);
              }
              if (spec.sharedComponentId && typeof spec.sharedComponentId !== "string") {
                errors.push(`[ERR_UISPEC_INVALID_SLOT] Endpoint '${fid}' input '${spec.field}' sharedComponentId must be a string.`);
              }
              if (spec.sourceEndpointId && typeof spec.sourceEndpointId !== "string") {
                errors.push(`[ERR_UISPEC_INVALID_SOURCE_ENDPOINT] Endpoint '${fid}' input '${spec.field}' sourceEndpointId must be a string.`);
              }
              if (spec.sourceEndpointId && spec.component !== "KrnlDropdown") {
                errors.push(`[ERR_UISPEC_SOURCE_ENDPOINT_REQUIRES_DROPDOWN] Endpoint '${fid}' input '${spec.field}' sets sourceEndpointId='${spec.sourceEndpointId}' but uses component '${spec.component}'. Selection-source fields MUST use component 'KrnlDropdown'.`);
              }
              if (spec.component === "KrnlDropdown" && !spec.sharedComponentId && !spec.sourceEndpointId && (!spec.options || spec.options.length === 0)) {
                errors.push(`[ERR_UISPEC_DROPDOWN_MISSING_SOURCE] Endpoint '${fid}' input '${spec.field}' uses component 'KrnlDropdown' but provides no selection source. Must set 'sharedComponentId', 'sourceEndpointId', or static 'options'.`);
              }
              const SELECTION_FIELD_PATTERNS = ["provider", "model", "modelName", "model_name", "profile", "key_id", "keyId"];
              if (spec.component === "KrnlTextInput" && SELECTION_FIELD_PATTERNS.includes(spec.field)) {
                console.warn(`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510`);
                console.warn(`\u2502 [KrnlUiSpecValidator] SELECTION-SOURCE PATTERN WARNING:                \u2502`);
                console.warn(`\u2502 Endpoint '${fid}' input '${spec.field}' uses KrnlTextInput.                \u2502`);
                console.warn(`\u2502 Field '${spec.field}' is a finite-choice selection candidate.            \u2502`);
                console.warn(`\u2502 KRNL ARCHITECTURE RULE: Users MUST NOT type finite selections manually.  \u2502`);
                console.warn(`\u2502 FIX: Change component to 'KrnlDropdown' and specify 'sharedComponentId' \u2502`);
                console.warn(`\u2502      or 'sourceEndpointId' pointing to the options-providing endpoint.  \u2502`);
                console.warn(`\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
`);
              }
              if (spec.bindMode && spec.bindMode !== "selected" && spec.bindMode !== "all") {
                errors.push(`[ERR_UISPEC_INVALID_BINDMODE] Endpoint '${fid}' input '${spec.field}' bindMode '${spec.bindMode}' is invalid. Allowed: 'selected' | 'all'`);
              }
              if (spec.autoFetch) {
                errors.push(`[ERR_UISPEC_INVALID_AUTOFETCH] Endpoint '${fid}' input '${spec.field}' cannot use autoFetch. autoFetch is only allowed on output provider components.`);
              }
            });
            (uiSpec.outputs || []).forEach((spec) => {
              if (!spec.field || typeof spec.field !== "string") {
                errors.push(`[ERR_UISPEC_MISSING_FIELD] Endpoint '${fid}' output is missing required 'field' name.`);
              }
              if (spec.component && !ALLOWED_OUTPUT_COMPONENTS.has(spec.component)) {
                errors.push(`[ERR_UISPEC_INVALID_OUTPUT_COMPONENT] Endpoint '${fid}' output '${spec.field}' uses input component '${spec.component}'. Output fields must use display components: ${Array.from(ALLOWED_OUTPUT_COMPONENTS).join(", ")}.`);
              }
              if (spec.autoFetch && !spec.sharedComponentId) {
                errors.push(`[ERR_UISPEC_AUTOFETCH_MISSING_SLOT] Endpoint '${fid}' output '${spec.field}' sets autoFetch=true but lacks sharedComponentId.`);
              }
            });
            return {
              valid: errors.length === 0,
              errors
            };
          }
          /**
           * Validates that all UI components reference real registered endpoints on the entity.
           */
          static validateExecutionContract(entity, uiEndpoints) {
            const errors = [];
            const registeredFids = /* @__PURE__ */ new Set([
              ...entity.localFunctionalities?.keys() || [],
              ...entity.remoteFunctionalities?.keys() || []
            ]);
            for (const ep of uiEndpoints) {
              if (!registeredFids.has(ep.id)) {
                errors.push(`[ERR_UI_DEAD_FETCH] UI component generated for endpoint '${ep.id}', but no handler is registered on entity '${entity.entityName}'.`);
              }
              for (const input of ep.uiSpec.inputs || []) {
                if (input.sourceEndpointId && !registeredFids.has(input.sourceEndpointId)) {
                  errors.push(`[ERR_UI_STALE_ENDPOINT] Endpoint '${ep.id}' input '${input.field}' references sourceEndpointId '${input.sourceEndpointId}', which is not a registered endpoint.`);
                }
              }
            }
            return { valid: errors.length === 0, errors };
          }
          /**
           * Generates TS source code for a single endpoint UI component using VanJS
           */
          static generateComponentSource(fid, uiSpec, schema) {
            const validation = this.validateUiSpec(fid, uiSpec);
            if (!validation.valid) {
              console.error(`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 [KrnlUiSpecValidator] BUILD ERROR IN ENDPOINT '${fid}':
${validation.errors.map((e) => `\u2502  - ${e}`).join("\n")}
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
`);
              throw new Error(`[KrnlUiSpecValidationError] Invalid uiSpec in endpoint '${fid}': ${validation.errors.join("; ")}`);
            }
            let inputs = uiSpec.inputs || [];
            const outputs = uiSpec.outputs || [];
            if (inputs.length === 0 && schema && schema.input) {
              try {
                let shape = {};
                if (typeof schema.input._def?.shape === "function") {
                  shape = schema.input._def.shape();
                } else if (schema.input.shape) {
                  shape = schema.input.shape;
                }
                inputs = Object.keys(shape).map((field) => ({
                  field,
                  label: field,
                  component: "KrnlTextInput",
                  placeholder: `Enter ${field}`
                }));
              } catch (e) {
                console.warn(`[KrnlFrontendGenerator] Could not infer input fields for '${fid}':`, e);
              }
            }
            const sharedInputIds = inputs.filter((i) => i.sharedComponentId).map((i) => i.sharedComponentId);
            const sharedOutputIds = outputs.filter((o) => o.sharedComponentId).map((o) => o.sharedComponentId);
            const allSharedIds = Array.from(/* @__PURE__ */ new Set([...sharedInputIds, ...sharedOutputIds]));
            const sourceEndpointInputs = inputs.filter((i) => i.sourceEndpointId);
            const autoFetchOutput = outputs.find((o) => o.autoFetch && o.sharedComponentId);
            return `import van from 'vanjs-core';
import { KrnlButton, KrnlTextInput, KrnlDropdown, KrnlTextArea, KrnlJsonViewer, KrnlTile, getSharedSlot, KrnlAgentBridge } from '../../atoms/index.js';

const { div, h3, h4, form } = van.tags;

export default function Endpoint_${fid.replace(/[^a-zA-Z0-9]/g, "_")}() {
  const formData = van.state<Record<string, any>>({});
  const response = van.state<any>(null);
  const loading = van.state(false);
  const error = van.state<string | null>(null);
  const phantomActive = van.state(false);

  ${allSharedIds.map(
              (id) => `const slot_${id.replace(/[^a-zA-Z0-9]/g, "_")} = getSharedSlot('${id}');`
            ).join("\n  ")}

  KrnlAgentBridge.register('${fid}', {
    trigger: async (overrideInput?: Record<string, any>, ticketId?: string) => {
      return await executeRequest(overrideInput, ticketId);
    }
  });

  const handleInputChange = (field: string, val: any) => {
    formData.val = { ...formData.val, [field]: val };
    KrnlAgentBridge.setState('${fid}', {
      fid: '${fid}',
      formData: formData.val,
      response: response.val,
      loading: false,
      error: null,
      lastUpdated: Date.now()
    });
  };

  const executeRequest = async (overrideData?: Record<string, any>, ticketId?: string) => {
    loading.val = true;
    error.val = null;
    if (ticketId || overrideData) {
      phantomActive.val = true;
    }
    const activeInput = overrideData || formData.val;
    if (overrideData) formData.val = { ...formData.val, ...overrideData };

    try {
      const res = await fetch('/frontend/api/${fid}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeInput),
      });
      const data = await res.json();
      const payload = data.payload !== undefined ? data.payload : data;
      response.val = payload;

      if (payload && (payload.status === 'error' || payload.message)) {
        if (payload.status === 'error') error.val = payload.message || 'Request failed';
      }

      ${outputs.filter((o) => o.sharedComponentId).map((o) => {
              const varName = `slot_${o.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
              const fieldKey = o.field;
              const dataPath = o.dataPath;
              return `
      let extracted: any = null;
      if (payload && typeof payload === 'object') {
        ${dataPath ? `extracted = payload['${dataPath}'];` : `extracted = payload['${fieldKey}'] !== undefined ? payload['${fieldKey}'] : payload;`}
      }
      if (extracted && typeof extracted === 'object' && !Array.isArray(extracted)) {
        if (extracted.status === 'success' && extracted.data) extracted = extracted.data;
        else if (extracted.providers && Array.isArray(extracted.providers)) extracted = extracted.providers;
        else if (extracted.models && Array.isArray(extracted.models)) extracted = extracted.models;
        else if (extracted.agents && Array.isArray(extracted.agents)) extracted = extracted.agents;
        else if (extracted.keys && typeof extracted.keys === 'object') {
          extracted = Object.keys(extracted).map(k => ({ id: k, name: k, value: k }));
        }
      }
      if (Array.isArray(extracted)) {
        ${varName}.options.val = extracted;
      }`;
            }).join("\n      ")}

      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, '${fid}', payload, undefined);
      return payload;
    } catch (err: any) {
      const errMsg = err.message || 'Request failed';
      error.val = errMsg;
      if (ticketId) KrnlAgentBridge.sendJobComplete(ticketId, '${fid}', null, errMsg);
    } finally {
      loading.val = false;
      if (ticketId || overrideData) {
        setTimeout(() => { phantomActive.val = false; }, 2000);
      }
    }
  };

  ${autoFetchOutput ? `executeRequest({});` : ""}
  ${sourceEndpointInputs.map(
              (i) => `
  fetch('/frontend/api/${i.sourceEndpointId}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    .then((r) => r.json())
    .then((d) => {
      const payload = d.payload !== undefined ? d.payload : d;
      let list = payload.${i.dataPath || i.field} || payload.data || payload.items || payload.providers || payload.models || payload.agents || payload;
      if (list && typeof list === 'object' && !Array.isArray(list)) list = Object.keys(list).map(k => ({ id: k, name: k, value: k }));
      if (Array.isArray(list) && ${i.sharedComponentId ? `slot_${i.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}` : "null"}) {
        slot_${i.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}.options.val = list;
      }
    })
    .catch(() => {});`
            ).join("\n  ")}

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await executeRequest();
  };

  return div(
    {
      className: () => \`krnl-endpoint-card \${phantomActive.val ? 'krnl-phantom-active' : ''}\`,
      style: () => \`
        background: var(--krnl-bg-surface);
        padding: 1.5rem;
        border-radius: 12px;
        border: \${phantomActive.val ? '2px solid var(--krnl-accent)' : '1px solid var(--krnl-border-color)'};
        transition: all 0.3s ease;
        position: relative;
      \`
    },
    () => (phantomActive.val ? div({ className: 'krnl-phantom-badge' }, '\u{1F916} Phantom Execution Active') : null),
    h3({ style: 'margin-bottom: 1rem; color: var(--krnl-primary);' }, 'Endpoint: ${fid}'),
    form(
      { onsubmit: handleSubmit },
      ${inputs.map((inSpec) => this.renderVanInputAtom(inSpec)).join(",\n      ")}${inputs.length > 0 ? "," : ""}
      KrnlButton({ type: 'submit', loading, disabled: loading, label: 'Execute ${fid}', icon: '\u26A1' })
    ),
    () => (error.val ? div({ style: 'color: var(--krnl-danger); margin-top: 1rem;' }, 'Error: ', error.val) : null),
    () =>
      response.val !== null
        ? div(
            { style: 'margin-top: 1.5rem; border-top: 1px solid var(--krnl-border-color); padding-top: 1rem;' },
            h4({ style: 'margin-bottom: 0.5rem; color: var(--krnl-accent);' }, 'Output Response'),
            ${outputs.length > 0 ? outputs.map((outSpec) => this.renderVanOutputAtom(outSpec)).join(",\n            ") : `KrnlJsonViewer({ data: response })`}
          )
        : null
  );
}
`;
          }
          static renderVanInputAtom(spec) {
            const label = spec.label || spec.field;
            if (spec.sharedComponentId) {
              const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
              const bindMode = spec.bindMode || "selected";
              return `KrnlDropdown({
        label: "${label}",
        value: van.derive(() => formData.val['${spec.field}'] !== undefined ? formData.val['${spec.field}'] : (${varName}.value.val || '')),
        options: ${varName}.options,
        onChange: (v) => {
          ${varName}.value.val = v;
          handleInputChange('${spec.field}', ${bindMode === "all" ? `${varName}.options.val` : "v"});
        }
      })`;
            }
            switch (spec.component) {
              case "KrnlTextInput":
                return `KrnlTextInput({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v), placeholder: "${spec.placeholder || ""}" })`;
              case "KrnlTextArea":
                return `KrnlTextArea({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v), placeholder: "${spec.placeholder || ""}" })`;
              case "KrnlDropdown":
                const opts = JSON.stringify(spec.options || []);
                return `KrnlDropdown({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), options: ${opts}, onChange: (v) => handleInputChange('${spec.field}', v) })`;
              default:
                return `KrnlTextInput({ label: "${label}", value: van.derive(() => formData.val['${spec.field}'] || ''), onChange: (v) => handleInputChange('${spec.field}', v) })`;
            }
          }
          static renderVanOutputAtom(spec) {
            const label = spec.label || spec.field;
            if (spec.sharedComponentId) {
              const varName = `slot_${spec.sharedComponentId.replace(/[^a-zA-Z0-9]/g, "_")}`;
              return `KrnlJsonViewer({ label: "${label}", data: ${varName}.options })`;
            }
            switch (spec.component) {
              case "KrnlTile":
                return `KrnlTile({ label: "${label}", value: van.derive(() => response.val ? (response.val['${spec.field}'] !== undefined ? response.val['${spec.field}'] : response.val) : '') })`;
              default:
                return `KrnlJsonViewer({ label: "${label}", data: van.derive(() => response.val ? (response.val['${spec.field}'] !== undefined ? response.val['${spec.field}'] : response.val) : response.val) })`;
            }
          }
          /**
           * Generates root index.ts aggregator using VanJS
           */
          static generateIndexSource(appName, uiEndpoints, subAppPrefixes) {
            const imports = uiEndpoints.map(
              (ep) => `import Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, "_")} from './components/${ep.id}/index.js';`
            ).join("\n");
            const initialTab = uiEndpoints.length > 0 ? uiEndpoints[0].id : subAppPrefixes.length > 0 ? subAppPrefixes[0] : "welcome";
            return `import van from 'vanjs-core';
${imports}

const { div, header, span, h1, button, main, iframe, h2, p } = van.tags;

function AppShell() {
  const activeTab = van.state<string>('${initialTab}');

  return div(
    { className: 'krnl-app-shell' },
    header(
      { className: 'krnl-header' },
      div(
        { style: 'display: flex; align-items: center; gap: 0.65rem;' },
        span({ style: 'font-size: 1.2rem; line-height: 1;' }, '\u2B21'),
        h1('${appName}')
      )
    ),
    div(
      { className: 'krnl-nav-tabs' },
      ${uiEndpoints.map(
              (ep) => `button({ className: () => \`krnl-tab-btn \${activeTab.val === '${ep.id}' ? 'active' : ''}\`, onclick: () => activeTab.val = '${ep.id}', title: '${ep.id}' }, span('\u2B21'), span({ className: 'krnl-tab-label' }, '${ep.id}'))`
            ).join(",\n      ")}${uiEndpoints.length > 0 && subAppPrefixes.length > 0 ? "," : ""}
      ${subAppPrefixes.map(
              (sub) => `button({ className: () => \`krnl-tab-btn \${activeTab.val === '${sub}' ? 'active' : ''}\`, onclick: () => activeTab.val = '${sub}', title: '${sub}' }, span('\u{1F4E6}'), span({ className: 'krnl-tab-label' }, '${sub}'))`
            ).join(",\n      ")}
    ),
    main(
      { className: 'krnl-main-body' },
      ${uiEndpoints.map(
              (ep) => `div({ style: () => \`display: \${activeTab.val === '${ep.id}' ? 'block' : 'none'}\` }, Endpoint_${ep.id.replace(/[^a-zA-Z0-9]/g, "_")}())`
            ).join(",\n      ")}${uiEndpoints.length > 0 && subAppPrefixes.length > 0 ? "," : ""}
      ${subAppPrefixes.map(
              (sub) => `() => activeTab.val === '${sub}' ? iframe({ src: '/${sub}/frontend/', title: '${sub}', style: 'width: 100%; height: calc(100vh - 160px); border: none; border-radius: 8px;' }) : null`
            ).join(",\n      ")}
    )
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  van.add(rootElement, AppShell());
}
`;
          }
          static generateAtoms(frontendDir) {
            const atomsDir = import_path5.default.join(frontendDir, "src", "atoms");
            import_fs2.default.mkdirSync(atomsDir, { recursive: true });
          }
        };
      }
    });
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/aspromise.js
var require_aspromise = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/aspromise.js"(exports2, module2) {
    "use strict";
    module2.exports = asPromise;
    function asPromise(fn, ctx) {
      var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
      while (index < arguments.length)
        params[offset++] = arguments[index++];
      return new Promise(function executor(resolve7, reject) {
        params[offset] = function callback(err) {
          if (pending) {
            pending = false;
            if (err)
              reject(err);
            else {
              var params2 = new Array(arguments.length - 1), offset2 = 0;
              while (offset2 < params2.length)
                params2[offset2++] = arguments[offset2];
              resolve7.apply(null, params2);
            }
          }
        };
        try {
          fn.apply(ctx || null, params);
        } catch (err) {
          if (pending) {
            pending = false;
            reject(err);
          }
        }
      });
    }
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/base64.js
var require_base64 = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/base64.js"(exports2) {
    "use strict";
    var base64 = exports2;
    base64.length = function length(string) {
      var p = string.length;
      if (!p)
        return 0;
      while (p > 0 && string.charAt(p - 1) === "=")
        --p;
      return Math.floor(p * 3 / 4);
    };
    var b64 = new Array(64);
    var s64 = new Array(123);
    for (i = 0; i < 64; )
      s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    var i;
    s64[45] = 62;
    s64[95] = 63;
    base64.encode = function encode(buffer, start, end) {
      var parts = null, chunk = [];
      var i2 = 0, j = 0, t;
      while (start < end) {
        var b = buffer[start++];
        switch (j) {
          case 0:
            chunk[i2++] = b64[b >> 2];
            t = (b & 3) << 4;
            j = 1;
            break;
          case 1:
            chunk[i2++] = b64[t | b >> 4];
            t = (b & 15) << 2;
            j = 2;
            break;
          case 2:
            chunk[i2++] = b64[t | b >> 6];
            chunk[i2++] = b64[b & 63];
            j = 0;
            break;
        }
        if (i2 > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
          i2 = 0;
        }
      }
      if (j) {
        chunk[i2++] = b64[t];
        chunk[i2++] = 61;
        if (j === 1)
          chunk[i2++] = 61;
      }
      if (parts) {
        if (i2)
          parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
        return parts.join("");
      }
      return String.fromCharCode.apply(String, chunk.slice(0, i2));
    };
    var invalidEncoding = "invalid encoding";
    base64.decode = function decode(string, buffer, offset) {
      var start = offset;
      var j = 0, t;
      for (var i2 = 0; i2 < string.length; ) {
        var c = string.charCodeAt(i2++);
        if (c === 61 && j > 1)
          break;
        if ((c = s64[c]) === void 0)
          throw Error(invalidEncoding);
        switch (j) {
          case 0:
            t = c;
            j = 1;
            break;
          case 1:
            buffer[offset++] = t << 2 | (c & 48) >> 4;
            t = c;
            j = 2;
            break;
          case 2:
            buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
            t = c;
            j = 3;
            break;
          case 3:
            buffer[offset++] = (t & 3) << 6 | c;
            j = 0;
            break;
        }
      }
      if (j === 1)
        throw Error(invalidEncoding);
      return offset - start;
    };
    var base64Re = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    var base64UrlRe = /[-_]/;
    var base64UrlNoPaddingRe = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/;
    base64.test = function test(string) {
      return base64Re.test(string) || base64UrlRe.test(string) && base64UrlNoPaddingRe.test(string);
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/eventemitter.js
var require_eventemitter = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/eventemitter.js"(exports2, module2) {
    "use strict";
    module2.exports = EventEmitter;
    function EventEmitter() {
      this._listeners = /* @__PURE__ */ Object.create(null);
    }
    EventEmitter.prototype.on = function on(evt, fn, ctx) {
      (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn,
        ctx: ctx || this
      });
      return this;
    };
    EventEmitter.prototype.off = function off(evt, fn) {
      if (evt === void 0)
        this._listeners = /* @__PURE__ */ Object.create(null);
      else {
        if (fn === void 0)
          this._listeners[evt] = [];
        else {
          var listeners = this._listeners[evt];
          if (!listeners)
            return this;
          for (var i = 0; i < listeners.length; )
            if (listeners[i].fn === fn)
              listeners.splice(i, 1);
            else
              ++i;
        }
      }
      return this;
    };
    EventEmitter.prototype.emit = function emit(evt) {
      var listeners = this._listeners[evt];
      if (listeners) {
        var args2 = [], i = 1;
        for (; i < arguments.length; )
          args2.push(arguments[i++]);
        for (i = 0; i < listeners.length; )
          listeners[i].fn.apply(listeners[i++].ctx, args2);
      }
      return this;
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/float.js
var require_float = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/float.js"(exports2, module2) {
    "use strict";
    module2.exports = factory(factory);
    function factory(exports3) {
      if (typeof Float32Array !== "undefined") (function() {
        var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
        function writeFloat_f32_cpy(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
        }
        function writeFloat_f32_rev(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[3];
          buf[pos + 1] = f8b[2];
          buf[pos + 2] = f8b[1];
          buf[pos + 3] = f8b[0];
        }
        exports3.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        exports3.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
        function readFloat_f32_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          return f32[0];
        }
        function readFloat_f32_rev(buf, pos) {
          f8b[3] = buf[pos];
          f8b[2] = buf[pos + 1];
          f8b[1] = buf[pos + 2];
          f8b[0] = buf[pos + 3];
          return f32[0];
        }
        exports3.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        exports3.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
      })();
      else (function() {
        function writeFloat_ieee754(writeUint, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0)
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos);
          else if (isNaN(val))
            writeUint(2143289344, buf, pos);
          else if (val > 34028234663852886e22)
            writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
          else if (val < 11754943508222875e-54)
            writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
          else {
            var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
            writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
          }
        }
        exports3.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports3.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
        function readFloat_ieee754(readUint, buf, pos) {
          var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
          return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }
        exports3.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports3.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
      })();
      if (typeof Float64Array !== "undefined") (function() {
        var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
        function writeDouble_f64_cpy(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
          buf[pos + 4] = f8b[4];
          buf[pos + 5] = f8b[5];
          buf[pos + 6] = f8b[6];
          buf[pos + 7] = f8b[7];
        }
        function writeDouble_f64_rev(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[7];
          buf[pos + 1] = f8b[6];
          buf[pos + 2] = f8b[5];
          buf[pos + 3] = f8b[4];
          buf[pos + 4] = f8b[3];
          buf[pos + 5] = f8b[2];
          buf[pos + 6] = f8b[1];
          buf[pos + 7] = f8b[0];
        }
        exports3.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        exports3.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
        function readDouble_f64_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          f8b[4] = buf[pos + 4];
          f8b[5] = buf[pos + 5];
          f8b[6] = buf[pos + 6];
          f8b[7] = buf[pos + 7];
          return f64[0];
        }
        function readDouble_f64_rev(buf, pos) {
          f8b[7] = buf[pos];
          f8b[6] = buf[pos + 1];
          f8b[5] = buf[pos + 2];
          f8b[4] = buf[pos + 3];
          f8b[3] = buf[pos + 4];
          f8b[2] = buf[pos + 5];
          f8b[1] = buf[pos + 6];
          f8b[0] = buf[pos + 7];
          return f64[0];
        }
        exports3.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        exports3.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
      })();
      else (function() {
        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0) {
            writeUint(0, buf, pos + off0);
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos + off1);
          } else if (isNaN(val)) {
            writeUint(0, buf, pos + off0);
            writeUint(2146959360, buf, pos + off1);
          } else if (val > 17976931348623157e292) {
            writeUint(0, buf, pos + off0);
            writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
          } else {
            var mantissa;
            if (val < 22250738585072014e-324) {
              mantissa = val / 5e-324;
              writeUint(mantissa >>> 0, buf, pos + off0);
              writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
            } else {
              var exponent = Math.floor(Math.log(val) / Math.LN2);
              if (exponent === 1024)
                exponent = 1023;
              mantissa = val * Math.pow(2, -exponent);
              writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
              writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
            }
          }
        }
        exports3.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports3.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
          var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
          var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
          return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }
        exports3.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports3.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
      })();
      return exports3;
    }
    function writeUintLE(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    function writeUintBE(val, buf, pos) {
      buf[pos] = val >>> 24;
      buf[pos + 1] = val >>> 16 & 255;
      buf[pos + 2] = val >>> 8 & 255;
      buf[pos + 3] = val & 255;
    }
    function readUintLE(buf, pos) {
      return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
    }
    function readUintBE(buf, pos) {
      return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
    }
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/utf8.js
var require_utf8 = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/utf8.js"(exports2) {
    "use strict";
    var utf8 = exports2;
    var replacementChar = "\uFFFD";
    var looseDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
    var strictDecoder;
    var TEXT_DECODER_MIN_LENGTH = 64;
    try {
      strictDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    } catch (err) {
      strictDecoder = looseDecoder;
    }
    utf8.length = function utf8_length(string) {
      var len = 0, c = 0;
      for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
          len += 1;
        else if (c < 2048)
          len += 2;
        else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
          ++i;
          len += 4;
        } else
          len += 3;
      }
      return len;
    };
    function utf8_read_js(buffer, start, end, str) {
      for (var i = start; i < end; ) {
        var t = buffer[i++];
        if (t <= 127) {
          str += String.fromCharCode(t);
        } else if (t >= 192 && t < 224) {
          var c2 = (t & 31) << 6 | buffer[i++] & 63;
          str += c2 >= 128 ? String.fromCharCode(c2) : replacementChar;
        } else if (t >= 224 && t < 240) {
          var c3 = (t & 15) << 12 | (buffer[i++] & 63) << 6 | buffer[i++] & 63;
          str += c3 >= 2048 ? String.fromCharCode(c3) : replacementChar;
        } else if (t >= 240) {
          var t2 = (t & 7) << 18 | (buffer[i++] & 63) << 12 | (buffer[i++] & 63) << 6 | buffer[i++] & 63;
          if (t2 < 65536 || t2 > 1114111)
            str += replacementChar;
          else {
            t2 -= 65536;
            str += String.fromCharCode(55296 + (t2 >> 10));
            str += String.fromCharCode(56320 + (t2 & 1023));
          }
        }
      }
      return str;
    }
    function utf8_read_decoder(decoder, buffer, start, end) {
      var source = start === 0 && end === buffer.length ? buffer : buffer.subarray(start, end);
      return decoder.decode(source);
    }
    utf8.read = function utf8_read_loose(buffer, start, end) {
      if (end - start < 1)
        return "";
      if (end - start >= TEXT_DECODER_MIN_LENGTH)
        return utf8_read_decoder(looseDecoder, buffer, start, end);
      var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
      for (; i + 7 < end; i += 8) {
        c1 = buffer[i];
        c2 = buffer[i + 1];
        c3 = buffer[i + 2];
        c4 = buffer[i + 3];
        c5 = buffer[i + 4];
        c6 = buffer[i + 5];
        c7 = buffer[i + 6];
        c8 = buffer[i + 7];
        if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
          return utf8_read_js(buffer, i, end, str);
        str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
      }
      for (; i < end; ++i) {
        c1 = buffer[i];
        if (c1 & 128)
          return utf8_read_js(buffer, i, end, str);
        str += String.fromCharCode(c1);
      }
      return str;
    };
    utf8.readStrict = function utf8_read_strict(buffer, start, end) {
      if (end - start < 1)
        return "";
      if (end - start >= TEXT_DECODER_MIN_LENGTH)
        return utf8_read_decoder(strictDecoder, buffer, start, end);
      var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
      for (; i + 7 < end; i += 8) {
        c1 = buffer[i];
        c2 = buffer[i + 1];
        c3 = buffer[i + 2];
        c4 = buffer[i + 3];
        c5 = buffer[i + 4];
        c6 = buffer[i + 5];
        c7 = buffer[i + 6];
        c8 = buffer[i + 7];
        if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
          return str + utf8_read_decoder(strictDecoder, buffer, i, end);
        str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
      }
      for (; i < end; ++i) {
        c1 = buffer[i];
        if (c1 & 128)
          return str + utf8_read_decoder(strictDecoder, buffer, i, end);
        str += String.fromCharCode(c1);
      }
      return str;
    };
    utf8.write = function utf8_write(string, buffer, offset) {
      var start = offset, c1, c2;
      for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
          buffer[offset++] = c1;
        } else if (c1 < 2048) {
          buffer[offset++] = c1 >> 6 | 192;
          buffer[offset++] = c1 & 63 | 128;
        } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
          c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
          ++i;
          buffer[offset++] = c1 >> 18 | 240;
          buffer[offset++] = c1 >> 12 & 63 | 128;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        } else {
          buffer[offset++] = c1 >> 12 | 224;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        }
      }
      return offset - start;
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/pool.js
var require_pool = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/pool.js"(exports2, module2) {
    "use strict";
    module2.exports = pool;
    function pool(alloc, slice, size) {
      var SIZE = size || 8192;
      var MAX = SIZE >>> 1;
      var slab = null;
      var offset = SIZE;
      return function pool_alloc(size2) {
        if (size2 < 1 || size2 > MAX)
          return alloc(size2);
        if (offset + size2 > SIZE) {
          slab = alloc(SIZE);
          offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size2);
        if (offset & 7)
          offset = (offset | 7) + 1;
        return buf;
      };
    }
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/longbits.js
var require_longbits = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/longbits.js"(exports2, module2) {
    "use strict";
    module2.exports = LongBits;
    var Long;
    function LongBits(lo, hi) {
      this.lo = lo >>> 0;
      this.hi = hi >>> 0;
    }
    var zero = LongBits.zero = new LongBits(0, 0);
    zero.toNumber = function() {
      return 0;
    };
    zero.zzEncode = zero.zzDecode = function() {
      return this;
    };
    zero.length = function() {
      return 1;
    };
    var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
    LongBits.fromNumber = function fromNumber(value) {
      if (value === 0)
        return zero;
      var sign = value < 0;
      if (sign)
        value = -value;
      var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
      if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
          lo = 0;
          if (++hi > 4294967295)
            hi = 0;
        }
      }
      return new LongBits(lo, hi);
    };
    LongBits.from = function from(value) {
      if (typeof value === "number")
        return LongBits.fromNumber(value);
      if (typeof value === "string" || value instanceof String) {
        if (Long)
          value = Long.fromString(value);
        else
          return LongBits.fromNumber(parseInt(value, 10));
      }
      return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
    };
    LongBits.prototype.toNumber = function toNumber(unsigned) {
      if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
        if (!lo)
          hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
      }
      return this.lo + this.hi * 4294967296;
    };
    LongBits.prototype.toLong = function toLong(unsigned) {
      return Long ? new Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
    };
    var charCodeAt = String.prototype.charCodeAt;
    LongBits.fromHash = function fromHash(hash) {
      if (hash === zeroHash)
        return zero;
      return new LongBits(
        (charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0,
        (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0
      );
    };
    LongBits.prototype.toHash = function toHash() {
      return String.fromCharCode(
        this.lo & 255,
        this.lo >>> 8 & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24,
        this.hi & 255,
        this.hi >>> 8 & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
      );
    };
    LongBits.prototype.zzEncode = function zzEncode() {
      var mask = this.hi >> 31;
      this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
      this.lo = (this.lo << 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.zzDecode = function zzDecode() {
      var mask = -(this.lo & 1);
      this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
      this.hi = (this.hi >>> 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.length = function length() {
      var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
      return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
    };
    LongBits._configure = function(Long_) {
      Long = Long_;
    };
  }
});

// ../../node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js
var require_umd = __commonJS({
  "../../node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js"(exports2, module2) {
    "use strict";
    (function(global2, factory) {
      function preferDefault(exports3) {
        return exports3.default || exports3;
      }
      if (typeof define === "function" && define.amd) {
        define([], function() {
          var exports3 = {};
          factory(exports3);
          return preferDefault(exports3);
        });
      } else if (typeof exports2 === "object") {
        factory(exports2);
        if (typeof module2 === "object") module2.exports = preferDefault(exports2);
      } else {
        (function() {
          var exports3 = {};
          factory(exports3);
          global2.Long = preferDefault(exports3);
        })();
      }
    })(
      typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports2,
      function(_exports) {
        "use strict";
        Object.defineProperty(_exports, "__esModule", {
          value: true
        });
        _exports.default = void 0;
        var wasm = null;
        try {
          wasm = new WebAssembly.Instance(
            new WebAssembly.Module(
              new Uint8Array([
                // \0asm
                0,
                97,
                115,
                109,
                // version 1
                1,
                0,
                0,
                0,
                // section "type"
                1,
                13,
                2,
                // 0, () => i32
                96,
                0,
                1,
                127,
                // 1, (i32, i32, i32, i32) => i32
                96,
                4,
                127,
                127,
                127,
                127,
                1,
                127,
                // section "function"
                3,
                7,
                6,
                // 0, type 0
                0,
                // 1, type 1
                1,
                // 2, type 1
                1,
                // 3, type 1
                1,
                // 4, type 1
                1,
                // 5, type 1
                1,
                // section "global"
                6,
                6,
                1,
                // 0, "high", mutable i32
                127,
                1,
                65,
                0,
                11,
                // section "export"
                7,
                50,
                6,
                // 0, "mul"
                3,
                109,
                117,
                108,
                0,
                1,
                // 1, "div_s"
                5,
                100,
                105,
                118,
                95,
                115,
                0,
                2,
                // 2, "div_u"
                5,
                100,
                105,
                118,
                95,
                117,
                0,
                3,
                // 3, "rem_s"
                5,
                114,
                101,
                109,
                95,
                115,
                0,
                4,
                // 4, "rem_u"
                5,
                114,
                101,
                109,
                95,
                117,
                0,
                5,
                // 5, "get_high"
                8,
                103,
                101,
                116,
                95,
                104,
                105,
                103,
                104,
                0,
                0,
                // section "code"
                10,
                191,
                1,
                6,
                // 0, "get_high"
                4,
                0,
                35,
                0,
                11,
                // 1, "mul"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                126,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 2, "div_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                127,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 3, "div_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                128,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 4, "rem_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                129,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 5, "rem_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                130,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11
              ])
            ),
            {}
          ).exports;
        } catch {
        }
        function Long(low, high, unsigned) {
          this.low = low | 0;
          this.high = high | 0;
          this.unsigned = !!unsigned;
        }
        Long.prototype.__isLong__;
        Object.defineProperty(Long.prototype, "__isLong__", {
          value: true
        });
        function isLong(obj) {
          return (obj && obj["__isLong__"]) === true;
        }
        function ctz32(value) {
          var c = Math.clz32(value & -value);
          return value ? 31 - c : c;
        }
        Long.isLong = isLong;
        var INT_CACHE = {};
        var UINT_CACHE = {};
        function fromInt(value, unsigned) {
          var obj, cachedObj, cache;
          if (unsigned) {
            value >>>= 0;
            if (cache = 0 <= value && value < 256) {
              cachedObj = UINT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, 0, true);
            if (cache) UINT_CACHE[value] = obj;
            return obj;
          } else {
            value |= 0;
            if (cache = -128 <= value && value < 128) {
              cachedObj = INT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache) INT_CACHE[value] = obj;
            return obj;
          }
        }
        Long.fromInt = fromInt;
        function fromNumber(value, unsigned) {
          if (isNaN(value)) return unsigned ? UZERO : ZERO;
          if (unsigned) {
            if (value < 0) return UZERO;
            if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
          } else {
            if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
          }
          if (value < 0) return fromNumber(-value, unsigned).neg();
          return fromBits(
            value % TWO_PWR_32_DBL | 0,
            value / TWO_PWR_32_DBL | 0,
            unsigned
          );
        }
        Long.fromNumber = fromNumber;
        function fromBits(lowBits, highBits, unsigned) {
          return new Long(lowBits, highBits, unsigned);
        }
        Long.fromBits = fromBits;
        var pow_dbl = Math.pow;
        function fromString(str, unsigned, radix) {
          if (str.length === 0) throw Error("empty string");
          if (typeof unsigned === "number") {
            radix = unsigned;
            unsigned = false;
          } else {
            unsigned = !!unsigned;
          }
          if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return unsigned ? UZERO : ZERO;
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          var p;
          if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
          else if (p === 0) {
            return fromString(str.substring(1), unsigned, radix).neg();
          }
          var radixToPower = fromNumber(pow_dbl(radix, 8));
          var result = ZERO;
          for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
              var power = fromNumber(pow_dbl(radix, size));
              result = result.mul(power).add(fromNumber(value));
            } else {
              result = result.mul(radixToPower);
              result = result.add(fromNumber(value));
            }
          }
          result.unsigned = unsigned;
          return result;
        }
        Long.fromString = fromString;
        function fromValue(val, unsigned) {
          if (typeof val === "number") return fromNumber(val, unsigned);
          if (typeof val === "string") return fromString(val, unsigned);
          return fromBits(
            val.low,
            val.high,
            typeof unsigned === "boolean" ? unsigned : val.unsigned
          );
        }
        Long.fromValue = fromValue;
        var TWO_PWR_16_DBL = 1 << 16;
        var TWO_PWR_24_DBL = 1 << 24;
        var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
        var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
        var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
        var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
        var ZERO = fromInt(0);
        Long.ZERO = ZERO;
        var UZERO = fromInt(0, true);
        Long.UZERO = UZERO;
        var ONE = fromInt(1);
        Long.ONE = ONE;
        var UONE = fromInt(1, true);
        Long.UONE = UONE;
        var NEG_ONE = fromInt(-1);
        Long.NEG_ONE = NEG_ONE;
        var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
        Long.MAX_VALUE = MAX_VALUE;
        var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
        Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
        var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
        Long.MIN_VALUE = MIN_VALUE;
        var LongPrototype = Long.prototype;
        LongPrototype.toInt = function toInt() {
          return this.unsigned ? this.low >>> 0 : this.low;
        };
        LongPrototype.toNumber = function toNumber() {
          if (this.unsigned)
            return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
          return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
        };
        LongPrototype.toString = function toString(radix) {
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          if (this.isZero()) return "0";
          if (this.isNegative()) {
            if (this.eq(MIN_VALUE)) {
              var radixLong = fromNumber(radix), div2 = this.div(radixLong), rem1 = div2.mul(radixLong).sub(this);
              return div2.toString(radix) + rem1.toInt().toString(radix);
            } else return "-" + this.neg().toString(radix);
          }
          var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
          var result = "";
          while (true) {
            var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) return digits + result;
            else {
              while (digits.length < 6) digits = "0" + digits;
              result = "" + digits + result;
            }
          }
        };
        LongPrototype.getHighBits = function getHighBits() {
          return this.high;
        };
        LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
          return this.high >>> 0;
        };
        LongPrototype.getLowBits = function getLowBits() {
          return this.low;
        };
        LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
          return this.low >>> 0;
        };
        LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
          if (this.isNegative())
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
          var val = this.high != 0 ? this.high : this.low;
          for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;
          return this.high != 0 ? bit + 33 : bit + 1;
        };
        LongPrototype.isSafeInteger = function isSafeInteger() {
          var top11Bits = this.high >> 21;
          if (!top11Bits) return true;
          if (this.unsigned) return false;
          return top11Bits === -1 && !(this.low === 0 && this.high === -2097152);
        };
        LongPrototype.isZero = function isZero() {
          return this.high === 0 && this.low === 0;
        };
        LongPrototype.eqz = LongPrototype.isZero;
        LongPrototype.isNegative = function isNegative() {
          return !this.unsigned && this.high < 0;
        };
        LongPrototype.isPositive = function isPositive() {
          return this.unsigned || this.high >= 0;
        };
        LongPrototype.isOdd = function isOdd() {
          return (this.low & 1) === 1;
        };
        LongPrototype.isEven = function isEven() {
          return (this.low & 1) === 0;
        };
        LongPrototype.equals = function equals(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
            return false;
          return this.high === other.high && this.low === other.low;
        };
        LongPrototype.eq = LongPrototype.equals;
        LongPrototype.notEquals = function notEquals(other) {
          return !this.eq(
            /* validates */
            other
          );
        };
        LongPrototype.neq = LongPrototype.notEquals;
        LongPrototype.ne = LongPrototype.notEquals;
        LongPrototype.lessThan = function lessThan(other) {
          return this.comp(
            /* validates */
            other
          ) < 0;
        };
        LongPrototype.lt = LongPrototype.lessThan;
        LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) <= 0;
        };
        LongPrototype.lte = LongPrototype.lessThanOrEqual;
        LongPrototype.le = LongPrototype.lessThanOrEqual;
        LongPrototype.greaterThan = function greaterThan(other) {
          return this.comp(
            /* validates */
            other
          ) > 0;
        };
        LongPrototype.gt = LongPrototype.greaterThan;
        LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) >= 0;
        };
        LongPrototype.gte = LongPrototype.greaterThanOrEqual;
        LongPrototype.ge = LongPrototype.greaterThanOrEqual;
        LongPrototype.compare = function compare(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.eq(other)) return 0;
          var thisNeg = this.isNegative(), otherNeg = other.isNegative();
          if (thisNeg && !otherNeg) return -1;
          if (!thisNeg && otherNeg) return 1;
          if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
          return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
        };
        LongPrototype.comp = LongPrototype.compare;
        LongPrototype.negate = function negate() {
          if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
          return this.not().add(ONE);
        };
        LongPrototype.neg = LongPrototype.negate;
        LongPrototype.add = function add(addend) {
          if (!isLong(addend)) addend = fromValue(addend);
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = addend.high >>> 16;
          var b32 = addend.high & 65535;
          var b16 = addend.low >>> 16;
          var b00 = addend.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 + b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 + b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 + b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 + b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.subtract = function subtract(subtrahend) {
          if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
          return this.add(subtrahend.neg());
        };
        LongPrototype.sub = LongPrototype.subtract;
        LongPrototype.multiply = function multiply(multiplier) {
          if (this.isZero()) return this;
          if (!isLong(multiplier)) multiplier = fromValue(multiplier);
          if (wasm) {
            var low = wasm["mul"](
              this.low,
              this.high,
              multiplier.low,
              multiplier.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
          if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
          if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
          if (this.isNegative()) {
            if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());
            else return this.neg().mul(multiplier).neg();
          } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
          if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(
              this.toNumber() * multiplier.toNumber(),
              this.unsigned
            );
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = multiplier.high >>> 16;
          var b32 = multiplier.high & 65535;
          var b16 = multiplier.low >>> 16;
          var b00 = multiplier.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 * b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 * b00;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c16 += a00 * b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 * b00;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a16 * b16;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a00 * b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.mul = LongPrototype.multiply;
        LongPrototype.divide = function divide(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (divisor.isZero()) throw Error("division by zero");
          if (wasm) {
            if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
              return this;
            }
            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (this.isZero()) return this.unsigned ? UZERO : ZERO;
          var approx, rem, res;
          if (!this.unsigned) {
            if (this.eq(MIN_VALUE)) {
              if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                return MIN_VALUE;
              else if (divisor.eq(MIN_VALUE)) return ONE;
              else {
                var halfThis = this.shr(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(ZERO)) {
                  return divisor.isNegative() ? ONE : NEG_ONE;
                } else {
                  rem = this.sub(divisor.mul(approx));
                  res = approx.add(rem.div(divisor));
                  return res;
                }
              }
            } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
              if (divisor.isNegative()) return this.neg().div(divisor.neg());
              return this.neg().div(divisor).neg();
            } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();
            res = ZERO;
          } else {
            if (!divisor.unsigned) divisor = divisor.toUnsigned();
            if (divisor.gt(this)) return UZERO;
            if (divisor.gt(this.shru(1)))
              return UONE;
            res = UZERO;
          }
          rem = this;
          while (rem.gte(divisor)) {
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
              approx -= delta;
              approxRes = fromNumber(approx, this.unsigned);
              approxRem = approxRes.mul(divisor);
            }
            if (approxRes.isZero()) approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
          }
          return res;
        };
        LongPrototype.div = LongPrototype.divide;
        LongPrototype.modulo = function modulo(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (wasm) {
            var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          return this.sub(this.div(divisor).mul(divisor));
        };
        LongPrototype.mod = LongPrototype.modulo;
        LongPrototype.rem = LongPrototype.modulo;
        LongPrototype.not = function not() {
          return fromBits(~this.low, ~this.high, this.unsigned);
        };
        LongPrototype.countLeadingZeros = function countLeadingZeros() {
          return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
        };
        LongPrototype.clz = LongPrototype.countLeadingZeros;
        LongPrototype.countTrailingZeros = function countTrailingZeros() {
          return this.low ? ctz32(this.low) : ctz32(this.high) + 32;
        };
        LongPrototype.ctz = LongPrototype.countTrailingZeros;
        LongPrototype.and = function and(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low & other.low,
            this.high & other.high,
            this.unsigned
          );
        };
        LongPrototype.or = function or(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low | other.low,
            this.high | other.high,
            this.unsigned
          );
        };
        LongPrototype.xor = function xor(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low ^ other.low,
            this.high ^ other.high,
            this.unsigned
          );
        };
        LongPrototype.shiftLeft = function shiftLeft(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low << numBits,
              this.high << numBits | this.low >>> 32 - numBits,
              this.unsigned
            );
          else return fromBits(0, this.low << numBits - 32, this.unsigned);
        };
        LongPrototype.shl = LongPrototype.shiftLeft;
        LongPrototype.shiftRight = function shiftRight(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >> numBits,
              this.unsigned
            );
          else
            return fromBits(
              this.high >> numBits - 32,
              this.high >= 0 ? 0 : -1,
              this.unsigned
            );
        };
        LongPrototype.shr = LongPrototype.shiftRight;
        LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >>> numBits,
              this.unsigned
            );
          if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
          return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
        };
        LongPrototype.shru = LongPrototype.shiftRightUnsigned;
        LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
        LongPrototype.rotateLeft = function rotateLeft(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.low << numBits | this.high >>> b,
              this.high << numBits | this.low >>> b,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.high << numBits | this.low >>> b,
            this.low << numBits | this.high >>> b,
            this.unsigned
          );
        };
        LongPrototype.rotl = LongPrototype.rotateLeft;
        LongPrototype.rotateRight = function rotateRight(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.high << b | this.low >>> numBits,
              this.low << b | this.high >>> numBits,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.low << b | this.high >>> numBits,
            this.high << b | this.low >>> numBits,
            this.unsigned
          );
        };
        LongPrototype.rotr = LongPrototype.rotateRight;
        LongPrototype.toSigned = function toSigned() {
          if (!this.unsigned) return this;
          return fromBits(this.low, this.high, false);
        };
        LongPrototype.toUnsigned = function toUnsigned() {
          if (this.unsigned) return this;
          return fromBits(this.low, this.high, true);
        };
        LongPrototype.toBytes = function toBytes(le) {
          return le ? this.toBytesLE() : this.toBytesBE();
        };
        LongPrototype.toBytesLE = function toBytesLE() {
          var hi = this.high, lo = this.low;
          return [
            lo & 255,
            lo >>> 8 & 255,
            lo >>> 16 & 255,
            lo >>> 24,
            hi & 255,
            hi >>> 8 & 255,
            hi >>> 16 & 255,
            hi >>> 24
          ];
        };
        LongPrototype.toBytesBE = function toBytesBE() {
          var hi = this.high, lo = this.low;
          return [
            hi >>> 24,
            hi >>> 16 & 255,
            hi >>> 8 & 255,
            hi & 255,
            lo >>> 24,
            lo >>> 16 & 255,
            lo >>> 8 & 255,
            lo & 255
          ];
        };
        Long.fromBytes = function fromBytes(bytes, unsigned, le) {
          return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
        };
        Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
          return new Long(
            bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
            bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
            unsigned
          );
        };
        Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
          return new Long(
            bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
            bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
            unsigned
          );
        };
        if (typeof BigInt === "function") {
          Long.fromBigInt = function fromBigInt(value, unsigned) {
            var lowBits = Number(BigInt.asIntN(32, value));
            var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
            return fromBits(lowBits, highBits, unsigned);
          };
          Long.fromValue = function fromValueWithBigInt(value, unsigned) {
            if (typeof value === "bigint") return Long.fromBigInt(value, unsigned);
            return fromValue(value, unsigned);
          };
          LongPrototype.toBigInt = function toBigInt() {
            var lowBigInt = BigInt(this.low >>> 0);
            var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
            return highBigInt << BigInt(32) | lowBigInt;
          };
        }
        var _default = _exports.default = Long;
      }
    );
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/minimal.js
var require_minimal = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/util/minimal.js"(exports2) {
    "use strict";
    var util = exports2;
    util.asPromise = require_aspromise();
    util.base64 = require_base64();
    util.EventEmitter = require_eventemitter();
    util.float = require_float();
    util.utf8 = require_utf8();
    util.pool = require_pool();
    util.LongBits = require_longbits();
    function isUnsafeProperty(key) {
      return key === "__proto__" || key === "prototype" || key === "constructor";
    }
    util.isUnsafeProperty = isUnsafeProperty;
    util.isNode = Boolean(typeof global !== "undefined" && global && global.process && global.process.versions && global.process.versions.node);
    util.global = util.isNode && global || typeof window !== "undefined" && window || typeof self !== "undefined" && self || typeof globalThis !== "undefined" && globalThis || exports2;
    util.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    );
    util.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    );
    util.isInteger = Number.isInteger || /* istanbul ignore next */
    function isInteger(value) {
      return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };
    util.isString = function isString(value) {
      return typeof value === "string" || value instanceof String;
    };
    util.isObject = function isObject(value) {
      return value && typeof value === "object";
    };
    util.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
      var value = obj[prop];
      if (value != null && Object.hasOwnProperty.call(obj, prop))
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
      return false;
    };
    util.Buffer = (function() {
      try {
        var Buffer2 = util.global.Buffer;
        return Buffer2.prototype.utf8Write || util.isNode ? Buffer2 : (
          /* istanbul ignore next */
          null
        );
      } catch (e) {
        return null;
      }
    })();
    util.newBuffer = function newBuffer(sizeOrArray) {
      var Buffer2 = util.Buffer;
      return typeof sizeOrArray === "number" ? Buffer2 ? Buffer2.allocUnsafe(sizeOrArray) : new Uint8Array(sizeOrArray) : Buffer2 ? Buffer2.from(sizeOrArray) : new Uint8Array(sizeOrArray);
    };
    util.rawField = function rawField(id, wireType, data) {
      var out = [], tag = id << 3 | wireType;
      tag >>>= 0;
      while (tag > 127) {
        out.push(tag & 127 | 128);
        tag >>>= 7;
      }
      out.push(tag);
      for (var i = 0; i < data.length; ++i)
        out.push(data[i]);
      return util.newBuffer(out);
    };
    util.Array = Uint8Array;
    util.Long = /* istanbul ignore next */
    util.global.dcodeIO && /* istanbul ignore next */
    util.global.dcodeIO.Long || /* istanbul ignore next */
    util.global.Long || (function() {
      try {
        var Long = require_umd();
        return Long && Long.isLong ? Long : null;
      } catch (e) {
        return null;
      }
    })();
    util.key2Re = /^(?:true|false|0|1)$/;
    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
    util.key64Re = /^(?:[\x00-\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
    util.longToHash = function longToHash(value) {
      return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
    };
    util.longFromHash = function longFromHash(hash, unsigned) {
      var bits = util.LongBits.fromHash(hash);
      if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
      return bits.toNumber(Boolean(unsigned));
    };
    util.longFromKey = function longFromKey(key, unsigned) {
      return util.key64Re.test(key) && !util.key32Re.test(key) ? util.longFromHash(key, unsigned) : key;
    };
    util.boolFromKey = function boolFromKey(key) {
      return key === "true" || key === "1";
    };
    function merge(dst) {
      var ifNotSet = typeof arguments[arguments.length - 1] === "boolean", limit = ifNotSet ? arguments.length - 1 : arguments.length;
      ifNotSet = ifNotSet && arguments[arguments.length - 1];
      for (var a = 1; a < limit; ++a) {
        var src = arguments[a];
        if (!src)
          continue;
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
          if (!isUnsafeProperty(keys[i]) && (!ifNotSet || !Object.prototype.hasOwnProperty.call(dst, keys[i]) || dst[keys[i]] === void 0))
            dst[keys[i]] = src[keys[i]];
      }
      return dst;
    }
    util.merge = merge;
    util.nestingLimit = 32;
    util.recursionLimit = 100;
    util.makeProp = function makeProp(obj, key, enumerable) {
      if (Object.prototype.hasOwnProperty.call(obj, key))
        return;
      Object.defineProperty(obj, key, {
        enumerable: enumerable === void 0 ? true : enumerable,
        configurable: true,
        writable: true
      });
    };
    util.lcFirst = function lcFirst(str) {
      return str.charAt(0).toLowerCase() + str.substring(1);
    };
    function newError(name) {
      function CustomError(message, properties) {
        if (!(this instanceof CustomError))
          return new CustomError(message, properties);
        Object.defineProperty(this, "message", { get: function() {
          return message;
        } });
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, CustomError);
        else
          Object.defineProperty(this, "stack", { value: new Error().stack || "" });
        if (properties)
          merge(this, properties);
      }
      CustomError.prototype = Object.create(Error.prototype, {
        constructor: {
          value: CustomError,
          writable: true,
          enumerable: false,
          configurable: true
        },
        name: {
          get: function get() {
            return name;
          },
          set: void 0,
          enumerable: false,
          // configurable: false would accurately preserve the behavior of
          // the original, but I'm guessing that was not intentional.
          // For an actual error subclass, this property would
          // be configurable.
          configurable: true
        },
        toString: {
          value: function value() {
            return this.name + ": " + this.message;
          },
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      return CustomError;
    }
    util.newError = newError;
    util.ProtocolError = newError("ProtocolError");
    util.oneOfGetter = function getOneOf(fieldNames) {
      var fieldMap = {};
      for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;
      return function() {
        for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
          if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
            return keys[i2];
      };
    };
    util.oneOfSetter = function setOneOf(fieldNames) {
      return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
          if (fieldNames[i] !== name)
            delete this[fieldNames[i]];
      };
    };
    util.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: true
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/writer.js
var require_writer = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/writer.js"(exports2, module2) {
    "use strict";
    module2.exports = Writer;
    var util = require_minimal();
    var BufferWriter;
    var LongBits = util.LongBits;
    var base64 = util.base64;
    var utf8 = util.utf8;
    function Writer() {
      this.pos = 0;
      this.buf = this.constructor.alloc(64);
      this.view = null;
      this.states = null;
    }
    Object.defineProperty(Writer.prototype, "len", {
      configurable: true,
      enumerable: true,
      get: function get_len() {
        return this.pos;
      }
    });
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
          return new BufferWriter();
        })();
      } : function create_array() {
        return new Writer();
      };
    };
    Writer.create = create();
    Writer.alloc = function alloc(size) {
      return new Uint8Array(size);
    };
    Writer.alloc = util.pool(Writer.alloc, Uint8Array.prototype.subarray);
    function sizeVarint32(value) {
      return value < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5;
    }
    Writer.prototype._reserve = function _reserve(n) {
      var need = this.pos + n;
      if (need > this.buf.length) {
        var size = this.buf.length << 1;
        if (size < need)
          size = need;
        var buf = this.constructor.alloc(size);
        buf.set(this.buf.subarray(0, this.pos), 0);
        this.buf = buf;
        this.view = null;
      }
    };
    function writeStringAscii(val, buf, pos) {
      for (var i = 0; i < val.length; )
        buf[pos++] = val.charCodeAt(i++);
    }
    function writeVarint32(val, buf, pos) {
      while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
      }
      buf[pos] = val;
      return pos + 1;
    }
    Writer.prototype.uint32 = function write_uint32(value) {
      value = value >>> 0;
      this._reserve(5);
      var pos = this.pos;
      this.pos = writeVarint32(value, this.buf, pos);
      return this;
    };
    Writer.prototype.int32 = function write_int32(value) {
      if ((value |= 0) < 0) {
        this._reserve(10);
        writeVarint64(LongBits.fromNumber(value), this.buf, this.pos);
        this.pos += 10;
        return this;
      }
      return this.uint32(value);
    };
    Writer.prototype.sint32 = function write_sint32(value) {
      return this.uint32((value << 1 ^ value >> 31) >>> 0);
    };
    function writeVarint64(val, buf, pos) {
      var lo = val.lo, hi = val.hi;
      while (hi) {
        buf[pos++] = lo & 127 | 128;
        lo = (lo >>> 7 | hi << 25) >>> 0;
        hi >>>= 7;
      }
      while (lo > 127) {
        buf[pos++] = lo & 127 | 128;
        lo = lo >>> 7;
      }
      buf[pos] = lo;
      return pos + 1;
    }
    Writer.prototype.uint64 = function write_uint64(value) {
      var bits = LongBits.from(value);
      this._reserve(10);
      var pos = this.pos;
      this.pos = writeVarint64(bits, this.buf, pos);
      return this;
    };
    Writer.prototype.int64 = Writer.prototype.uint64;
    Writer.prototype.sint64 = function write_sint64(value) {
      var bits = LongBits.from(value).zzEncode();
      this._reserve(10);
      var pos = this.pos;
      this.pos = writeVarint64(bits, this.buf, pos);
      return this;
    };
    Writer.prototype.bool = function write_bool(value) {
      this._reserve(1);
      this.buf[this.pos++] = value ? 1 : 0;
      return this;
    };
    function writeFixed32(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    Writer.prototype.fixed32 = function write_fixed32(value) {
      this._reserve(4);
      writeFixed32(value >>> 0, this.buf, this.pos);
      this.pos += 4;
      return this;
    };
    Writer.prototype.sfixed32 = Writer.prototype.fixed32;
    Writer.prototype.fixed64 = function write_fixed64(value) {
      var bits = LongBits.from(value);
      this._reserve(8);
      writeFixed32(bits.lo, this.buf, this.pos);
      writeFixed32(bits.hi, this.buf, this.pos + 4);
      this.pos += 8;
      return this;
    };
    Writer.prototype.sfixed64 = Writer.prototype.fixed64;
    Writer.prototype.float = function write_float(value) {
      this._reserve(4);
      util.float.writeFloatLE(value, this.buf, this.pos);
      this.pos += 4;
      return this;
    };
    Writer.prototype.double = function write_double(value) {
      this._reserve(8);
      util.float.writeDoubleLE(value, this.buf, this.pos);
      this.pos += 8;
      return this;
    };
    Writer.prototype.bytes = function write_bytes(value) {
      var len = value.length >>> 0;
      if (!len) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
      }
      this.uint32(len);
      this._reserve(len);
      this.buf.set(value, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype.raw = function write_raw(value) {
      var len = value.length >>> 0;
      if (!len)
        return this;
      this._reserve(len);
      this.buf.set(value, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype._delim = function _delim(pos, len) {
      var n = sizeVarint32(len);
      if (n > 1)
        this.buf.copyWithin(pos + n, pos + 1, pos + 1 + len);
      writeVarint32(len, this.buf, pos);
      this.pos = pos + n + len;
      return this;
    };
    Writer.prototype.string = function write_string(value) {
      var n = value.length;
      if (!n) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (n < 128) {
        this._reserve(n * 3 + 5);
        var lenPos = this.pos;
        return this._delim(lenPos, utf8.write(value, this.buf, lenPos + 1));
      }
      var len = utf8.length(value);
      this.uint32(len);
      this._reserve(len);
      if (len === value.length)
        writeStringAscii(value, this.buf, this.pos);
      else
        utf8.write(value, this.buf, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype.uint32s = function write_uint32s(value) {
      var n = value.length;
      this._reserve(n * 5 + 5);
      var buf = this.buf, lenPos = this.pos, p = lenPos + 1;
      for (var i = 0; i < n; ++i)
        p = writeVarint32(value[i] >>> 0, buf, p);
      return this._delim(lenPos, p - lenPos - 1);
    };
    Writer.prototype.int32s = function write_int32s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1, val;
      for (var i = 0; i < n; ++i) {
        if ((val = value[i] | 0) < 0) {
          pos = writeVarint64(LongBits.fromNumber(val), buf, pos);
        } else {
          pos = writeVarint32(val, buf, pos);
        }
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.sint32s = function write_sint32s(value) {
      var n = value.length;
      this._reserve(n * 5 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i)
        pos = writeVarint32((value[i] << 1 ^ value[i] >> 31) >>> 0, buf, pos);
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.uint64s = function write_uint64s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i) {
        pos = writeVarint64(LongBits.from(value[i]), buf, pos);
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.int64s = Writer.prototype.uint64s;
    Writer.prototype.sint64s = function write_sint64s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i) {
        pos = writeVarint64(LongBits.from(value[i]).zzEncode(), buf, pos);
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.bools = function write_bools(value) {
      var n = value.length;
      this.uint32(n);
      this._reserve(n);
      var buf = this.buf, p = this.pos;
      for (var i = 0; i < n; ++i)
        buf[p++] = value[i] ? 1 : 0;
      this.pos += n;
      return this;
    };
    var VIEW_THRESHOLD_FLOAT = 16;
    var VIEW_THRESHOLD_INT = 128;
    function getLazyView(writer, count, threshold) {
      var view = writer.view;
      if (view || count < threshold)
        return view;
      var buf = writer.buf;
      return writer.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    Writer.prototype.fixed32s = function write_fixed32s(value) {
      var n = value.length, bytes = n * 4;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setUint32(p, value[i] >>> 0, true);
          p += 4;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          writeFixed32(value[i] >>> 0, buf, p);
          p += 4;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.sfixed32s = Writer.prototype.fixed32s;
    Writer.prototype.fixed64s = function write_fixed64s(value) {
      var n = value.length, bytes = n * 8;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, bits, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
      if (dv)
        for (i = 0; i < n; ++i) {
          bits = LongBits.from(value[i]);
          dv.setUint32(p, bits.lo, true);
          dv.setUint32(p + 4, bits.hi, true);
          p += 8;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          bits = LongBits.from(value[i]);
          writeFixed32(bits.lo, buf, p);
          writeFixed32(bits.hi, buf, p + 4);
          p += 8;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.sfixed64s = Writer.prototype.fixed64s;
    Writer.prototype.floats = function write_floats(value) {
      var n = value.length, bytes = n * 4;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setFloat32(p, value[i], true);
          p += 4;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          util.float.writeFloatLE(value[i], buf, p);
          p += 4;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.doubles = function write_doubles(value) {
      var n = value.length, bytes = n * 8;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setFloat64(p, value[i], true);
          p += 8;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          util.float.writeDoubleLE(value[i], buf, p);
          p += 8;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.fork = function fork() {
      this._reserve(1);
      (this.states || (this.states = [])).push(this.pos);
      this.pos += 1;
      return this;
    };
    Writer.prototype.reset = function reset() {
      var states = this.states;
      if (states && states.length) {
        this.pos = states.pop();
      } else {
        this.pos = 0;
      }
      return this;
    };
    Writer.prototype.ldelim = function ldelim() {
      var states = this.states, len, vlen;
      if (states && states.length) {
        var lenPos = states.pop();
        len = this.pos - lenPos - 1;
        vlen = sizeVarint32(len);
        if (vlen > 1) {
          this._reserve(vlen - 1);
          this.buf.copyWithin(lenPos + vlen, lenPos + 1, lenPos + 1 + len);
          this.pos += vlen - 1;
          writeVarint32(len, this.buf, lenPos);
        } else {
          this.buf[lenPos] = len;
        }
      } else {
        len = this.pos;
        vlen = sizeVarint32(len);
        this._reserve(vlen);
        this.buf.copyWithin(vlen, 0, len);
        writeVarint32(len, this.buf, 0);
        this.pos += vlen;
      }
      return this;
    };
    Writer.prototype.finish = function finish(shared) {
      if (shared)
        return this.buf.subarray(0, this.pos);
      var buf = this.constructor.alloc(this.pos);
      buf.set(this.buf.subarray(0, this.pos), 0);
      return buf;
    };
    Writer.prototype.finishInto = function finishInto(buf, offset) {
      if (offset === void 0)
        offset = 0;
      buf.set(this.buf.subarray(0, this.pos), offset);
      return buf;
    };
    Writer._configure = function(BufferWriter_) {
      BufferWriter = BufferWriter_;
      Writer.create = create();
      BufferWriter._configure();
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/writer_buffer.js
var require_writer_buffer = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/writer_buffer.js"(exports2, module2) {
    "use strict";
    module2.exports = BufferWriter;
    var Writer = require_writer();
    BufferWriter.prototype = Object.create(Writer.prototype, {
      constructor: {
        value: BufferWriter,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    var util = require_minimal();
    function BufferWriter() {
      Writer.call(this);
    }
    var writeStringBuffer;
    BufferWriter._configure = function() {
      BufferWriter.alloc = util.Buffer && util.Buffer.allocUnsafe;
      writeStringBuffer = util.Buffer && util.Buffer.prototype.utf8Write ? function writeStringBuffer_utf8Write(val, buf, pos) {
        return buf.utf8Write(val, pos);
      } : function writeStringBuffer_write(val, buf, pos) {
        return buf.write(val, pos);
      };
    };
    BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
      if (util.isString(value))
        value = util.Buffer.from(value, "base64");
      var len = value.length >>> 0;
      this.uint32(len);
      if (len) {
        this._reserve(len);
        this.buf.set(value, this.pos);
        this.pos += len;
      }
      return this;
    };
    BufferWriter.prototype.string = function write_string_buffer(value) {
      var n = value.length;
      if (!n) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (n < 128) {
        this._reserve(n * 3 + 5);
        var pos = this.pos, buf = this.buf;
        return this._delim(
          pos,
          n < 40 ? util.utf8.write(value, buf, pos + 1) : writeStringBuffer(value, buf, pos + 1)
        );
      }
      var len = util.Buffer.byteLength(value);
      this.uint32(len);
      this._reserve(len);
      writeStringBuffer(value, this.buf, this.pos);
      this.pos += len;
      return this;
    };
    BufferWriter._configure();
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/reader.js
var require_reader = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/reader.js"(exports2, module2) {
    "use strict";
    module2.exports = Reader;
    var util = require_minimal();
    var BufferReader;
    var LongBits = util.LongBits;
    var utf8 = util.utf8;
    function indexOutOfRange(reader, writeLength) {
      return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
    }
    function Reader(buffer) {
      this.buf = buffer;
      this.pos = 0;
      this.len = buffer.length;
      this.view = null;
      this.discardUnknown = Reader.discardUnknown;
    }
    function create_array(buffer) {
      if (Array.isArray(buffer))
        buffer = new Uint8Array(buffer);
      if (buffer instanceof Uint8Array)
        return new Reader(buffer);
      throw Error("illegal buffer");
    }
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer2) {
          return util.Buffer.isBuffer(buffer2) ? new BufferReader(buffer2) : create_array(buffer2);
        })(buffer);
      } : create_array;
    };
    Reader.create = create();
    Reader.prototype.raw = function read_raw(start, end) {
      return this.buf.subarray(start, end);
    };
    Reader.prototype.uint32 = function read_uint32() {
      var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 7) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 14) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 21) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 15) << 28) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      for (var i = 0; i < 5; ++i) {
        if (pos >= this.len) {
          this.pos = pos;
          throw indexOutOfRange(this);
        }
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
      }
      this.pos = pos;
      throw Error("invalid varint encoding");
    };
    Reader.prototype.tag = function read_tag() {
      var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 7) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 14) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 21) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 15) << 28) >>> 0;
      if (buf[pos] < 128 && (buf[pos] & 112) === 0) {
        this.pos = pos + 1;
        return value;
      }
      this.pos = pos + 1;
      throw Error("invalid tag encoding");
    };
    Reader.prototype.int32 = function read_int32() {
      return this.uint32() | 0;
    };
    Reader.prototype.sint32 = function read_sint32() {
      var value = this.uint32();
      return value >>> 1 ^ -(value & 1) | 0;
    };
    function readLongVarint() {
      var bits = new LongBits(0, 0);
      var i = 0;
      if (this.len - this.pos > 4) {
        for (; i < 4; ++i) {
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128)
          return bits;
        i = 0;
      } else {
        for (; i < 4; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        throw indexOutOfRange(this);
      }
      if (this.len - this.pos > 4) {
        for (; i < 5; ++i) {
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      } else {
        for (; i < 5; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      }
      throw Error("invalid varint encoding");
    }
    Reader.prototype.bool = function read_bool() {
      var value = false, b;
      for (var i = 0; i < 10; ++i) {
        if (this.pos >= this.len)
          throw indexOutOfRange(this);
        b = this.buf[this.pos++];
        if (b & 127)
          value = true;
        if (b < 128)
          return value;
      }
      throw Error("invalid varint encoding");
    };
    function readFixed32_end(buf, end) {
      return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
    }
    Reader.prototype.fixed32 = function read_fixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4);
    };
    Reader.prototype.sfixed32 = function read_sfixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4) | 0;
    };
    function readFixed64() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);
      return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
    }
    Reader.prototype.float = function read_float() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readFloatLE(this.buf, this.pos);
      this.pos += 4;
      return value;
    };
    Reader.prototype.double = function read_double() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readDoubleLE(this.buf, this.pos);
      this.pos += 8;
      return value;
    };
    Reader.prototype.uint32s = function read_uint32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.uint32());
      return array;
    };
    Reader.prototype.int32s = function read_int32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.int32());
      return array;
    };
    Reader.prototype.sint32s = function read_sint32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.sint32());
      return array;
    };
    Reader.prototype.bools = function read_bools(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.bool());
      return array;
    };
    var VIEW_THRESHOLD_FLOAT = 8;
    var VIEW_THRESHOLD_INT = 128;
    function getLazyView(reader, count, threshold) {
      var view = reader.view;
      if (view || count < threshold)
        return view;
      var buf = reader.buf;
      return reader.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    Reader.prototype.fixed32s = function read_fixed32s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getUint32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.sfixed32s = function read_sfixed32s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getInt32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4) | 0;
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.floats = function read_floats(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getFloat32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = util.float.readFloatLE(buf, pos);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.doubles = function read_doubles(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 8) array[i++] = dv.getFloat64(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 8) array[i++] = util.float.readDoubleLE(buf, pos);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.uint64s = function read_uint64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.uint64());
      return array;
    };
    Reader.prototype.int64s = function read_int64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.int64());
      return array;
    };
    Reader.prototype.sint64s = function read_sint64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos;
      while (this.pos < end)
        array.push(this.sint64());
      return array;
    };
    Reader.prototype.fixed64s = function read_fixed64s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len, i = array.length;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3;
      array.length = i + count;
      for (var j = 0; j < count; ++j)
        array[i++] = this.fixed64();
      if (this.pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.sfixed64s = function read_sfixed64s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len, i = array.length;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3;
      array.length = i + count;
      for (var j = 0; j < count; ++j)
        array[i++] = this.sfixed64();
      if (this.pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.bytes = function read_bytes() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return this.raw(start, end);
    };
    Reader.prototype.string = function read_string() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return utf8.read(this.buf, start, end);
    };
    Reader.prototype.stringVerify = function read_string_verify() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return utf8.readStrict(this.buf, start, end);
    };
    Reader.prototype.skip = function skip(length) {
      if (typeof length === "number") {
        if (this.pos + length > this.len)
          throw indexOutOfRange(this, length);
        this.pos += length;
      } else {
        do {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
      }
      return this;
    };
    Reader.recursionLimit = util.recursionLimit;
    Reader.discardUnknown = true;
    Reader.prototype.skipType = function(wireType, depth, fieldNumber) {
      if (depth === void 0) depth = 0;
      if (depth > Reader.recursionLimit)
        throw Error("max depth exceeded");
      if (fieldNumber === 0)
        throw Error("illegal tag: field number 0");
      switch (wireType) {
        case 0:
          this.skip();
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          while (true) {
            var tag = this.tag();
            var nestedField = tag >>> 3;
            wireType = tag & 7;
            if (!nestedField)
              throw Error("illegal tag: field number 0");
            if (wireType === 4) {
              if (fieldNumber !== void 0 && nestedField !== fieldNumber)
                throw Error("invalid end group tag");
              break;
            }
            this.skipType(wireType, depth + 1, nestedField);
          }
          break;
        case 5:
          this.skip(4);
          break;
        /* istanbul ignore next */
        default:
          throw Error("invalid wire type " + wireType + " at offset " + this.pos);
      }
      return this;
    };
    Reader._configure = function(BufferReader_) {
      BufferReader = BufferReader_;
      Reader.create = create();
      BufferReader._configure();
      var fn = util.Long ? "toLong" : (
        /* istanbul ignore next */
        "toNumber"
      );
      util.merge(Reader.prototype, {
        int64: function read_int64() {
          return readLongVarint.call(this)[fn](false);
        },
        uint64: function read_uint64() {
          return readLongVarint.call(this)[fn](true);
        },
        sint64: function read_sint64() {
          return readLongVarint.call(this).zzDecode()[fn](false);
        },
        fixed64: function read_fixed64() {
          return readFixed64.call(this)[fn](true);
        },
        sfixed64: function read_sfixed64() {
          return readFixed64.call(this)[fn](false);
        }
      });
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/reader_buffer.js
var require_reader_buffer = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/reader_buffer.js"(exports2, module2) {
    "use strict";
    module2.exports = BufferReader;
    var Reader = require_reader();
    BufferReader.prototype = Object.create(Reader.prototype, {
      constructor: {
        value: BufferReader,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    var util = require_minimal();
    function BufferReader(buffer) {
      Reader.call(this, buffer);
    }
    BufferReader._configure = function() {
      if (util.Buffer)
        BufferReader.prototype._slice = util.Buffer.prototype.slice;
    };
    BufferReader.prototype.raw = function read_raw_buffer(start, end) {
      return this._slice.call(this.buf, start, end);
    };
    BufferReader.prototype.string = function read_string_buffer() {
      var len = this.uint32(), start = this.pos, end = this.pos + len;
      if (end > this.len)
        throw RangeError("index out of range: " + this.pos + " + " + len + " > " + this.len);
      this.pos = end;
      return this.buf.utf8Slice ? this.buf.utf8Slice(start, end) : this.buf.toString("utf-8", start, end);
    };
    BufferReader._configure();
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/rpc/service.js
var require_service = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/rpc/service.js"(exports2, module2) {
    "use strict";
    module2.exports = Service;
    var util = require_minimal();
    Service.prototype = Object.create(util.EventEmitter.prototype, {
      constructor: {
        value: Service,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    function Service(rpcImpl, requestDelimited, responseDelimited) {
      if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");
      util.EventEmitter.call(this);
      this.rpcImpl = rpcImpl;
      this.requestDelimited = Boolean(requestDelimited);
      this.responseDelimited = Boolean(responseDelimited);
    }
    Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
      if (!request)
        throw TypeError("request must be specified");
      var self2 = this;
      if (!callback)
        return util.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
      if (!self2.rpcImpl) {
        setTimeout(function() {
          callback(Error("already ended"));
        }, 0);
        return void 0;
      }
      try {
        return self2.rpcImpl(
          method,
          requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
          function rpcCallback(err, response) {
            if (err) {
              self2.emit("error", err, method);
              return callback(err);
            }
            if (response === null) {
              self2.end(
                /* endedByRPC */
                true
              );
              return void 0;
            }
            if (!(response instanceof responseCtor)) {
              try {
                response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
              } catch (err2) {
                self2.emit("error", err2, method);
                return callback(err2);
              }
            }
            self2.emit("data", response, method);
            return callback(null, response);
          }
        );
      } catch (err) {
        self2.emit("error", err, method);
        setTimeout(function() {
          callback(err);
        }, 0);
        return void 0;
      }
    };
    Service.prototype.end = function end(endedByRPC) {
      if (this.rpcImpl) {
        if (!endedByRPC)
          this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
      }
      return this;
    };
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/rpc.js
var require_rpc = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/rpc.js"(exports2) {
    "use strict";
    var rpc = exports2;
    rpc.Service = require_service();
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/roots.js
var require_roots = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/roots.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ Object.create(null);
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/index-minimal.js
var require_index_minimal = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/src/index-minimal.js"(exports2) {
    "use strict";
    exports2.build = "minimal";
    exports2.Writer = require_writer();
    exports2.BufferWriter = require_writer_buffer();
    exports2.Reader = require_reader();
    exports2.BufferReader = require_reader_buffer();
    exports2.util = require_minimal();
    exports2.rpc = require_rpc();
    exports2.roots = require_roots();
    exports2.configure = configure;
    function configure() {
      exports2.util.LongBits._configure(exports2.util.Long);
      exports2.Writer._configure(exports2.BufferWriter);
      exports2.Reader._configure(exports2.BufferReader);
    }
    configure();
  }
});

// ../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/minimal.js
var require_minimal2 = __commonJS({
  "../../node_modules/.pnpm/protobufjs@8.7.1/node_modules/protobufjs/minimal.js"(exports2, module2) {
    "use strict";
    module2.exports = require_index_minimal();
  }
});

// ../core/dist/chunk-R6CCWALL.js
var import_minimal, $Reader, $Writer, $util, $Object, $undefined, $Error, $TypeError, $String, $Number, $parseInt, $BigInt, $Array, $Boolean, $root, krnl;
var init_chunk_R6CCWALL = __esm({
  "../core/dist/chunk-R6CCWALL.js"() {
    "use strict";
    init_chunk_6QCYRS5L();
    init_chunk_XSCKNRCZ();
    init_chunk_GADIRLRS();
    init_chunk_P6XEM2LA();
    init_chunk_3ES4K2ZP();
    init_chunk_K54K2KZW();
    init_chunk_YXGL3ZEU();
    init_chunk_KFQGP6VL();
    import_minimal = __toESM(require_minimal2(), 1);
    init_esm();
    $Reader = import_minimal.default.Reader;
    $Writer = import_minimal.default.Writer;
    $util = import_minimal.default.util;
    $Object = $util.global.Object;
    $undefined = $util.global.undefined;
    $Error = $util.global.Error;
    $TypeError = $util.global.TypeError;
    $String = $util.global.String;
    $Number = $util.global.Number;
    $parseInt = $util.global.parseInt;
    $BigInt = $util.global.BigInt;
    $Array = $util.global.Array;
    $Boolean = $util.global.Boolean;
    $root = import_minimal.default.roots["default"] || (import_minimal.default.roots["default"] = {});
    krnl = $root.krnl = (() => {
      const krnl2 = {};
      krnl2.MessageKind = (function() {
        const valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "UNKNOWN"] = 0;
        values[valuesById[1] = "REGISTER_INGRESS"] = 1;
        values[valuesById[2] = "ROUTE_DATA"] = 2;
        values[valuesById[3] = "RPC_REQUEST"] = 3;
        values[valuesById[4] = "RPC_RESPONSE"] = 4;
        values[valuesById[5] = "INTROSPECT"] = 5;
        values[valuesById[6] = "INTROSPECT_RESPONSE"] = 6;
        return values;
      })();
      krnl2.KrnlMessage = (function() {
        const KrnlMessage = function(properties) {
          if (properties) {
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        };
        KrnlMessage.prototype.kind = 0;
        KrnlMessage.prototype.routeId = "";
        KrnlMessage.prototype.requestId = "";
        KrnlMessage.prototype.traceCorrelationId = "";
        KrnlMessage.prototype.originSystemAddress = "";
        KrnlMessage.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
        KrnlMessage.prototype.method = "";
        KrnlMessage.prototype.collectorName = "";
        KrnlMessage.prototype.jsonPayload = "";
        KrnlMessage.prototype.binaryPayload = $util.newBuffer([]);
        KrnlMessage.create = function(properties) {
          return new KrnlMessage(properties);
        };
        KrnlMessage.encode = function(message, writer, _depth) {
          if (!writer)
            writer = $Writer.create();
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind") && message.kind !== 0)
            writer.uint32(
              /* id 1, wireType 0 =*/
              8
            ).int32(message.kind);
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId") && message.routeId !== "")
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.routeId);
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.requestId);
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId") && message.traceCorrelationId !== "")
            writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).string(message.traceCorrelationId);
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress") && message.originSystemAddress !== "")
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.originSystemAddress);
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).int64(message.timestamp);
          if (message.method != null && $Object.hasOwnProperty.call(message, "method") && message.method !== "")
            writer.uint32(
              /* id 7, wireType 2 =*/
              58
            ).string(message.method);
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName") && message.collectorName !== "")
            writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).string(message.collectorName);
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload") && message.jsonPayload !== "")
            writer.uint32(
              /* id 9, wireType 2 =*/
              74
            ).string(message.jsonPayload);
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload") && message.binaryPayload.length)
            writer.uint32(
              /* id 10, wireType 2 =*/
              82
            ).bytes(message.binaryPayload);
          if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        KrnlMessage.encodeDelimited = function(message, writer) {
          return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        KrnlMessage.decode = function(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
          let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.KrnlMessage(), value;
          while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
              _end = $undefined;
              break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 0)
                  break;
                if (value = reader.int32())
                  message.kind = value;
                else
                  delete message.kind;
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.routeId = value;
                else
                  delete message.routeId;
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.requestId = value;
                else
                  delete message.requestId;
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.traceCorrelationId = value;
                else
                  delete message.traceCorrelationId;
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.originSystemAddress = value;
                else
                  delete message.originSystemAddress;
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                  message.timestamp = value;
                else
                  delete message.timestamp;
                continue;
              }
              case 7: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.method = value;
                else
                  delete message.method;
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.collectorName = value;
                else
                  delete message.collectorName;
                continue;
              }
              case 9: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.jsonPayload = value;
                else
                  delete message.jsonPayload;
                continue;
              }
              case 10: {
                if (wireType !== 2)
                  break;
                if ((value = reader.bytes()).length)
                  message.binaryPayload = value;
                else
                  delete message.binaryPayload;
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
          }
          if (_end !== $undefined)
            throw $Error("missing end group");
          return message;
        };
        KrnlMessage.decodeDelimited = function(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        KrnlMessage.verify = function(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind")) {
            if (typeof message.kind !== "number" || (message.kind | 0) !== message.kind)
              return "kind: enum value expected";
          }
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId")) {
            if (!$util.isString(message.routeId))
              return "routeId: string expected";
          }
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId")) {
            if (!$util.isString(message.requestId))
              return "requestId: string expected";
          }
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId")) {
            if (!$util.isString(message.traceCorrelationId))
              return "traceCorrelationId: string expected";
          }
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress")) {
            if (!$util.isString(message.originSystemAddress))
              return "originSystemAddress: string expected";
          }
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp")) {
            if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
              return "timestamp: integer|Long expected";
          }
          if (message.method != null && $Object.hasOwnProperty.call(message, "method")) {
            if (!$util.isString(message.method))
              return "method: string expected";
          }
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName")) {
            if (!$util.isString(message.collectorName))
              return "collectorName: string expected";
          }
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload")) {
            if (!$util.isString(message.jsonPayload))
              return "jsonPayload: string expected";
          }
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload")) {
            if (!(message.binaryPayload && typeof message.binaryPayload.length === "number" || $util.isString(message.binaryPayload)))
              return "binaryPayload: buffer expected";
          }
          return null;
        };
        KrnlMessage.fromObject = function(object, _depth) {
          if (object instanceof $root.krnl.KrnlMessage)
            return object;
          if (!$util.isObject(object))
            throw $TypeError(".krnl.KrnlMessage: object expected");
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let message = new $root.krnl.KrnlMessage();
          if (object.kind !== 0 && (typeof object.kind !== "string" || $root.krnl.MessageKind[object.kind] !== 0))
            switch (object.kind) {
              case "UNKNOWN":
              case 0:
                message.kind = 0;
                break;
              case "REGISTER_INGRESS":
              case 1:
                message.kind = 1;
                break;
              case "ROUTE_DATA":
              case 2:
                message.kind = 2;
                break;
              case "RPC_REQUEST":
              case 3:
                message.kind = 3;
                break;
              case "RPC_RESPONSE":
              case 4:
                message.kind = 4;
                break;
              case "INTROSPECT":
              case 5:
                message.kind = 5;
                break;
              case "INTROSPECT_RESPONSE":
              case 6:
                message.kind = 6;
                break;
              default:
                if (typeof object.kind === "number" && (object.kind | 0) === object.kind)
                  message.kind = object.kind;
            }
          if (object.routeId != null) {
            if (typeof object.routeId !== "string" || object.routeId.length)
              message.routeId = $String(object.routeId);
          }
          if (object.requestId != null) {
            if (typeof object.requestId !== "string" || object.requestId.length)
              message.requestId = $String(object.requestId);
          }
          if (object.traceCorrelationId != null) {
            if (typeof object.traceCorrelationId !== "string" || object.traceCorrelationId.length)
              message.traceCorrelationId = $String(object.traceCorrelationId);
          }
          if (object.originSystemAddress != null) {
            if (typeof object.originSystemAddress !== "string" || object.originSystemAddress.length)
              message.originSystemAddress = $String(object.originSystemAddress);
          }
          if (object.timestamp != null) {
            if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0) {
              if ($util.Long)
                message.timestamp = $util.Long.fromValue(object.timestamp, false);
              else if (typeof object.timestamp === "string")
                message.timestamp = $parseInt(object.timestamp, 10);
              else if (typeof object.timestamp === "number")
                message.timestamp = object.timestamp;
              else if (typeof object.timestamp === "object")
                message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            }
          }
          if (object.method != null) {
            if (typeof object.method !== "string" || object.method.length)
              message.method = $String(object.method);
          }
          if (object.collectorName != null) {
            if (typeof object.collectorName !== "string" || object.collectorName.length)
              message.collectorName = $String(object.collectorName);
          }
          if (object.jsonPayload != null) {
            if (typeof object.jsonPayload !== "string" || object.jsonPayload.length)
              message.jsonPayload = $String(object.jsonPayload);
          }
          if (object.binaryPayload != null) {
            if (object.binaryPayload.length) {
              if (typeof object.binaryPayload === "string")
                $util.base64.decode(object.binaryPayload, message.binaryPayload = $util.newBuffer($util.base64.length(object.binaryPayload)), 0);
              else if (object.binaryPayload.length >= 0)
                message.binaryPayload = object.binaryPayload;
            }
          }
          return message;
        };
        KrnlMessage.toObject = function(message, options, _depth) {
          if (!options)
            options = {};
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let object = {};
          if (options.defaults) {
            object.kind = options.enums === $String ? "UNKNOWN" : 0;
            object.routeId = "";
            object.requestId = "";
            object.traceCorrelationId = "";
            object.originSystemAddress = "";
            if ($util.Long) {
              let long = new $util.Long(0, 0, false);
              object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
            } else
              object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            object.method = "";
            object.collectorName = "";
            object.jsonPayload = "";
            if (options.bytes === $String)
              object.binaryPayload = "";
            else {
              object.binaryPayload = [];
              if (options.bytes !== $Array)
                object.binaryPayload = $util.newBuffer(object.binaryPayload);
            }
          }
          if (message.kind != null && $Object.hasOwnProperty.call(message, "kind"))
            object.kind = options.enums === $String ? $root.krnl.MessageKind[message.kind] === $undefined ? message.kind : $root.krnl.MessageKind[message.kind] : message.kind;
          if (message.routeId != null && $Object.hasOwnProperty.call(message, "routeId"))
            object.routeId = message.routeId;
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
            object.requestId = message.requestId;
          if (message.traceCorrelationId != null && $Object.hasOwnProperty.call(message, "traceCorrelationId"))
            object.traceCorrelationId = message.traceCorrelationId;
          if (message.originSystemAddress != null && $Object.hasOwnProperty.call(message, "originSystemAddress"))
            object.originSystemAddress = message.originSystemAddress;
          if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
            if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
              object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
            else if (typeof message.timestamp === "number")
              object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
            else
              object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
          if (message.method != null && $Object.hasOwnProperty.call(message, "method"))
            object.method = message.method;
          if (message.collectorName != null && $Object.hasOwnProperty.call(message, "collectorName"))
            object.collectorName = message.collectorName;
          if (message.jsonPayload != null && $Object.hasOwnProperty.call(message, "jsonPayload"))
            object.jsonPayload = message.jsonPayload;
          if (message.binaryPayload != null && $Object.hasOwnProperty.call(message, "binaryPayload"))
            object.binaryPayload = options.bytes === $String ? $util.base64.encode(message.binaryPayload, 0, message.binaryPayload.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.binaryPayload) : message.binaryPayload;
          return object;
        };
        KrnlMessage.prototype.toJSON = function() {
          return KrnlMessage.toObject(this, import_minimal.default.util.toJSONOptions);
        };
        KrnlMessage.getTypeUrl = function(prefix) {
          if (prefix === $undefined)
            prefix = "type.googleapis.com";
          return prefix + "/krnl.KrnlMessage";
        };
        return KrnlMessage;
      })();
      krnl2.RpcResponse = (function() {
        const RpcResponse = function(properties) {
          if (properties) {
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        };
        RpcResponse.prototype.requestId = "";
        RpcResponse.prototype.ok = false;
        RpcResponse.prototype.error = "";
        RpcResponse.prototype.jsonResult = "";
        RpcResponse.prototype.errorDocumentation = "";
        RpcResponse.create = function(properties) {
          return new RpcResponse(properties);
        };
        RpcResponse.encode = function(message, writer, _depth) {
          if (!writer)
            writer = $Writer.create();
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId") && message.requestId !== "")
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.requestId);
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok") && message.ok !== false)
            writer.uint32(
              /* id 2, wireType 0 =*/
              16
            ).bool(message.ok);
          if (message.error != null && $Object.hasOwnProperty.call(message, "error") && message.error !== "")
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.error);
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult") && message.jsonResult !== "")
            writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).string(message.jsonResult);
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation") && message.errorDocumentation !== "")
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.errorDocumentation);
          if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        RpcResponse.encodeDelimited = function(message, writer) {
          return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };
        RpcResponse.decode = function(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
          let end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.krnl.RpcResponse(), value;
          while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
              _end = $undefined;
              break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.requestId = value;
                else
                  delete message.requestId;
                continue;
              }
              case 2: {
                if (wireType !== 0)
                  break;
                if (value = reader.bool())
                  message.ok = value;
                else
                  delete message.ok;
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.error = value;
                else
                  delete message.error;
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.jsonResult = value;
                else
                  delete message.jsonResult;
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                if ((value = reader.stringVerify()).length)
                  message.errorDocumentation = value;
                else
                  delete message.errorDocumentation;
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
          }
          if (_end !== $undefined)
            throw $Error("missing end group");
          return message;
        };
        RpcResponse.decodeDelimited = function(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        RpcResponse.verify = function(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId")) {
            if (!$util.isString(message.requestId))
              return "requestId: string expected";
          }
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok")) {
            if (typeof message.ok !== "boolean")
              return "ok: boolean expected";
          }
          if (message.error != null && $Object.hasOwnProperty.call(message, "error")) {
            if (!$util.isString(message.error))
              return "error: string expected";
          }
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult")) {
            if (!$util.isString(message.jsonResult))
              return "jsonResult: string expected";
          }
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation")) {
            if (!$util.isString(message.errorDocumentation))
              return "errorDocumentation: string expected";
          }
          return null;
        };
        RpcResponse.fromObject = function(object, _depth) {
          if (object instanceof $root.krnl.RpcResponse)
            return object;
          if (!$util.isObject(object))
            throw $TypeError(".krnl.RpcResponse: object expected");
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let message = new $root.krnl.RpcResponse();
          if (object.requestId != null) {
            if (typeof object.requestId !== "string" || object.requestId.length)
              message.requestId = $String(object.requestId);
          }
          if (object.ok != null) {
            if (object.ok)
              message.ok = $Boolean(object.ok);
          }
          if (object.error != null) {
            if (typeof object.error !== "string" || object.error.length)
              message.error = $String(object.error);
          }
          if (object.jsonResult != null) {
            if (typeof object.jsonResult !== "string" || object.jsonResult.length)
              message.jsonResult = $String(object.jsonResult);
          }
          if (object.errorDocumentation != null) {
            if (typeof object.errorDocumentation !== "string" || object.errorDocumentation.length)
              message.errorDocumentation = $String(object.errorDocumentation);
          }
          return message;
        };
        RpcResponse.toObject = function(message, options, _depth) {
          if (!options)
            options = {};
          if (_depth === $undefined)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
          let object = {};
          if (options.defaults) {
            object.requestId = "";
            object.ok = false;
            object.error = "";
            object.jsonResult = "";
            object.errorDocumentation = "";
          }
          if (message.requestId != null && $Object.hasOwnProperty.call(message, "requestId"))
            object.requestId = message.requestId;
          if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
            object.ok = message.ok;
          if (message.error != null && $Object.hasOwnProperty.call(message, "error"))
            object.error = message.error;
          if (message.jsonResult != null && $Object.hasOwnProperty.call(message, "jsonResult"))
            object.jsonResult = message.jsonResult;
          if (message.errorDocumentation != null && $Object.hasOwnProperty.call(message, "errorDocumentation"))
            object.errorDocumentation = message.errorDocumentation;
          return object;
        };
        RpcResponse.prototype.toJSON = function() {
          return RpcResponse.toObject(this, import_minimal.default.util.toJSONOptions);
        };
        RpcResponse.getTypeUrl = function(prefix) {
          if (prefix === $undefined)
            prefix = "type.googleapis.com";
          return prefix + "/krnl.RpcResponse";
        };
        return RpcResponse;
      })();
      return krnl2;
    })();
  }
});

// ../core/dist/chunk-YUK6Q563.js
var import_async_hooks, magneticStorage, subappLocalStorage;
var init_chunk_YUK6Q563 = __esm({
  "../core/dist/chunk-YUK6Q563.js"() {
    "use strict";
    init_chunk_HIMEZUU2();
    init_chunk_R6CCWALL();
    import_async_hooks = require("async_hooks");
    magneticStorage = new import_async_hooks.AsyncLocalStorage();
    if (!globalThis.__krnlSubAppLocalStorage) {
      globalThis.__krnlSubAppLocalStorage = new import_async_hooks.AsyncLocalStorage();
    }
    subappLocalStorage = globalThis.__krnlSubAppLocalStorage;
  }
});

// ../core/dist/chunk-BE76RL6F.js
var init_chunk_BE76RL6F = __esm({
  "../core/dist/chunk-BE76RL6F.js"() {
    "use strict";
    init_chunk_YUK6Q563();
  }
});

// ../core/dist/chunk-ENZ2RQVJ.js
var init_chunk_ENZ2RQVJ = __esm({
  "../core/dist/chunk-ENZ2RQVJ.js"() {
    "use strict";
    init_chunk_R6CCWALL();
    init_chunk_GADIRLRS();
  }
});

// src/bin/krnl.ts
var path18 = __toESM(require("path"), 1);
var fs17 = __toESM(require("fs"), 1);

// ../validate/dist/index.js
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
var KrnlValidatorEngine = class {
  project;
  projectRoot;
  maxFileLineLimit;
  maxMainLogicLimit;
  maxHelperLineLimit;
  constructor(optionsOrRoot) {
    const options = typeof optionsOrRoot === "string" ? { projectRoot: optionsOrRoot } : optionsOrRoot;
    this.projectRoot = path.resolve(options.projectRoot || process.cwd());
    this.maxFileLineLimit = options.maxFileLineLimit ?? 200;
    this.maxMainLogicLimit = options.maxMainLogicLimit ?? 20;
    this.maxHelperLineLimit = options.maxHelperLineLimit ?? 30;
    const tsConfigPath = path.join(this.projectRoot, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
  }
  /**
   * Scans and validates all source files in the project.
   */
  validateAll() {
    const files = this.collectSourceFiles(this.projectRoot);
    const errors = [];
    const warnings = [];
    this.validateWorkspaceLayout(errors);
    for (const f of files) {
      const sf = this.project.addSourceFileAtPath(f);
      const fileReport = this.validateSourceFile(sf);
      errors.push(...fileReport.errors);
      warnings.push(...fileReport.warnings);
    }
    return {
      valid: errors.length === 0,
      totalFiles: files.length,
      errors,
      warnings
    };
  }
  /**
   * Validates a single SourceFile.
   */
  validateSourceFile(sf) {
    const errors = [];
    const warnings = [];
    const filePath = sf.getFilePath();
    const sourceText = sf.getText();
    const baseName = path.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { errors, warnings };
    }
    const lines = sourceText.split("\n");
    if (lines.length > this.maxFileLineLimit) {
      errors.push({
        ruleId: "krnl/file-line-limit",
        filePath,
        message: `File exceeds maximum length of ${this.maxFileLineLimit} lines (currently ${lines.length} lines). Decompose into sub-components, custom hooks, quad-units, or concept libraries.`,
        severity: "error"
      });
    }
    for (const decl of sf.getImportDeclarations()) {
      const moduleSpec = decl.getModuleSpecifierValue();
      if (moduleSpec.startsWith(".") && !moduleSpec.endsWith(".js") && !moduleSpec.endsWith(".json") && !moduleSpec.endsWith(".css") && !moduleSpec.endsWith(".svg") && !moduleSpec.endsWith(".png")) {
        const line = decl.getStartLineNumber();
        errors.push({
          ruleId: "krnl/import-suffix",
          filePath,
          line,
          message: `Relative import '${moduleSpec}' must end with '.js' for NodeNext module resolution.`,
          severity: "error"
        });
      }
    }
    const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
    const isBackendTopLevel = /^(server|app)\.(ts|js)$/i.test(baseName) && (!filePath.includes("/components/") && !filePath.includes("/entities/") && !filePath.includes("/libraries/"));
    if (isUiTopLevel) {
      const jsxElements = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxOpeningElement);
      const jsxSelfClosing = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement);
      const allJsxTags = [...jsxElements, ...jsxSelfClosing];
      for (const jsx of allJsxTags) {
        const tagName = jsx.getTagNameNode().getText();
        if (/^[a-z]/.test(tagName)) {
          errors.push({
            ruleId: "krnl/top-level-purity",
            filePath,
            line: jsx.getStartLineNumber(),
            message: `Top-level file '${baseName}' violates Top-Level Purity Law. Raw JSX/HTML element '<${tagName}>' is strictly forbidden. Top-level files must ONLY import and compose React components.`,
            severity: "error"
          });
        }
      }
      const calls2 = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
      for (const call of calls2) {
        const exprText = call.getExpression().getText();
        if (["useState", "useEffect", "useRef", "useMemo", "useCallback", "useReducer", "useContext", "useLayoutEffect"].includes(exprText) || /^use[A-Z]/.test(exprText) && exprText !== "use") {
          errors.push({
            ruleId: "krnl/top-level-purity",
            filePath,
            line: call.getStartLineNumber(),
            message: `Top-level file '${baseName}' violates Top-Level Purity Law. React hook '${exprText}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.`,
            severity: "error"
          });
        }
      }
    }
    if (isBackendTopLevel) {
      const calls2 = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
      for (const call of calls2) {
        const exprText = call.getExpression().getText();
        if (/^(app|router|server)\.(get|post|put|delete|patch|options|head)$/.test(exprText)) {
          errors.push({
            ruleId: "krnl/top-level-purity",
            filePath,
            line: call.getStartLineNumber(),
            message: `Backend entry file '${baseName}' violates Entry Purity Law. Inline route definition '${exprText}' is forbidden. Delegate to dedicated route/controller modules.`,
            severity: "error"
          });
        }
      }
    }
    if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
      const componentNames = [];
      for (const fn of sf.getFunctions()) {
        const name = fn.getName();
        if (name && /^[A-Z]/.test(name)) {
          const hasJsx = fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
          if (hasJsx) {
            componentNames.push(name);
          }
        }
      }
      for (const stmt of sf.getVariableStatements()) {
        for (const decl of stmt.getDeclarations()) {
          const name = decl.getName();
          if (/^[A-Z]/.test(name)) {
            const typeText = decl.getTypeNode()?.getText() || "";
            const isFcType = typeText.includes("FC") || typeText.includes("FunctionComponent") || typeText.includes("ComponentType");
            const init = decl.getInitializer();
            if (init) {
              const hasJsx = init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
              if (isFcType || hasJsx) {
                if (!componentNames.includes(name)) {
                  componentNames.push(name);
                }
              }
            }
          }
        }
      }
      for (const cls of sf.getClasses()) {
        const name = cls.getName();
        const ext = cls.getExtends()?.getText() || "";
        if (name && (ext.includes("Component") || ext.includes("PureComponent"))) {
          if (!componentNames.includes(name)) {
            componentNames.push(name);
          }
        }
      }
      if (componentNames.length > 1) {
        errors.push({
          ruleId: "krnl/one-component-per-file",
          filePath,
          message: `File '${baseName}' defines multiple React components (${componentNames.join(", ")}). Krnl strictly enforces ONE component per file. Decompose into sub-component files.`,
          severity: "error"
        });
      }
    }
    const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
    const isMainLogic = filePath.endsWith("logic.ts") || filePath.endsWith("logic.js");
    const isRootConcept = filePath.includes("libraries/") || filePath.includes("Concepts.ts");
    if (isHelper) {
      for (const decl of sf.getImportDeclarations()) {
        const spec = decl.getModuleSpecifierValue();
        if (["fs", "node:fs", "http", "node:http", "ws"].includes(spec)) {
          errors.push({
            ruleId: "krnl/helper-purity",
            filePath,
            line: decl.getStartLineNumber(),
            message: `Helper functions (Layer 1) cannot directly import I/O modules ('${spec}'). Delegate to Layer 0 libraries or Entity context.`,
            severity: "error"
          });
        }
      }
      for (const fn of sf.getFunctions()) {
        const fnLines = fn.getText().split("\n").length;
        if (fnLines > this.maxHelperLineLimit && !sourceText.includes("Concepts.")) {
          errors.push({
            ruleId: "krnl/helper-line-limit",
            filePath,
            line: fn.getStartLineNumber(),
            message: `Helper function '${fn.getName() || "anonymous"}' exceeds ${this.maxHelperLineLimit} lines (${fnLines} lines). Must delegate to a root libraries/{Domain}Concepts.ts library.`,
            severity: "error"
          });
        }
      }
    }
    if (isMainLogic) {
      const substantiveLines = lines.filter((l) => {
        const trimmed = l.trim();
        return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*");
      });
      if (substantiveLines.length > this.maxMainLogicLimit && !sourceText.includes("helpers") && !sourceText.includes("Concepts") && !sourceText.includes("state")) {
        errors.push({
          ruleId: "krnl/main-delegation",
          filePath,
          message: `Main logic function has ${substantiveLines.length} substantive lines without delegating to Layer 1 helper functions or Layer 0 libraries.`,
          severity: "error"
        });
      }
    }
    if (sourceText.includes("main = async") || sourceText.includes("export const main = async")) {
      const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
      if (match) {
        const destructured = match[1];
        if (/\bsystem\b/.test(destructured) && !/\bentity\b/.test(destructured)) {
          errors.push({
            ruleId: "krnl/context-destructuring",
            filePath,
            message: `Functionality context parameter destructures 'system'. Functionality passes { state, entity }. Always destructure 'entity'.`,
            severity: "error"
          });
        }
      }
    }
    const calls = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (exprText === "setInterval" || exprText === "window.setInterval") {
        errors.push({
          ruleId: "krnl/no-polling",
          filePath,
          line: call.getStartLineNumber(),
          message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams (entity.emitEvent / entity.on).`,
          severity: "error"
        });
      }
    }
    const isEntityClass = sf.getClasses().some((c) => {
      const ext = c.getExtends();
      return ext && (ext.getText().includes("Entity") || ext.getText().includes("krnlEntityBase"));
    });
    if (isEntityClass) {
      for (const decl of sf.getImportDeclarations()) {
        const spec = decl.getModuleSpecifierValue();
        if (spec.includes("libraries/") || spec.includes("Concepts")) {
          errors.push({
            ruleId: "krnl/entity-no-libraries",
            filePath,
            line: decl.getStartLineNumber(),
            message: `Entity class violates Library Calling Invariant. Entities must not call or import libraries directly ('${spec}'). Only functionalities in 'src/functionalities/' are permitted to call shared libraries.`,
            severity: "error"
          });
        }
      }
      let loadAllLine = -1;
      const addLocalLines = [];
      for (const call of calls) {
        const txt = call.getText();
        if (txt.includes("MagneticLoader.loadAll") || txt.includes("KrnlMagneticLoader.loadAll")) {
          loadAllLine = call.getStartLineNumber();
        } else if (txt.startsWith("this.addLocal(")) {
          const hasUiSpec = txt.includes("uiSpec");
          const idMatch = txt.match(/id\s*:\s*["']([^"']+)["']/);
          addLocalLines.push({
            line: call.getStartLineNumber(),
            hasUiSpec,
            id: idMatch ? idMatch[1] : "unknown"
          });
        }
      }
      if (loadAllLine !== -1) {
        for (const al of addLocalLines) {
          if (al.hasUiSpec && al.line > loadAllLine) {
            errors.push({
              ruleId: "krnl/boot-order",
              filePath,
              line: al.line,
              message: `addLocal('${al.id}') with uiSpec at line ${al.line} appears AFTER loadAll() at line ${loadAllLine}. All addLocal() with UI must precede loadAll().`,
              severity: "error"
            });
          }
        }
      }
      for (const cls of sf.getClasses()) {
        const ext = cls.getExtends();
        if (ext && (ext.getText().includes("Entity") || ext.getText().includes("krnlEntityBase"))) {
          const loops = [
            ...cls.getDescendantsOfKind(import_ts_morph.SyntaxKind.ForStatement),
            ...cls.getDescendantsOfKind(import_ts_morph.SyntaxKind.ForOfStatement),
            ...cls.getDescendantsOfKind(import_ts_morph.SyntaxKind.ForInStatement),
            ...cls.getDescendantsOfKind(import_ts_morph.SyntaxKind.WhileStatement),
            ...cls.getDescendantsOfKind(import_ts_morph.SyntaxKind.DoStatement)
          ];
          for (const loop of loops) {
            errors.push({
              ruleId: "krnl/entity-purity",
              filePath,
              line: loop.getStartLineNumber(),
              message: `Entity '${cls.getName() || "Anonymous"}' violates Entity Purity Law. Loops and procedural algorithms are prohibited inside entities. Move logic to a functionality or a global library function.`,
              severity: "error"
            });
          }
          for (const method of cls.getMethods()) {
            const methodName = method.getName();
            if (!["boot", "init", "dispose"].includes(methodName)) {
              errors.push({
                ruleId: "krnl/entity-purity",
                filePath,
                line: method.getStartLineNumber(),
                message: `Entity '${cls.getName() || "Anonymous"}' defines custom method '${methodName}'. Entities are purely declarative compositors/orchestrators. Define capabilities as functionalities or global library functions.`,
                severity: "error"
              });
            }
          }
        }
      }
      for (const call of calls) {
        const callText = call.getText();
        if (callText.startsWith("this.orchestration(") || callText.startsWith("this.flow(")) {
          let currentExpr = call;
          const chainCalls = [];
          while (currentExpr && import_ts_morph.Node.isCallExpression(currentExpr)) {
            const propAccess = currentExpr.getExpression();
            if (import_ts_morph.Node.isPropertyAccessExpression(propAccess)) {
              const methodName = propAccess.getName();
              const args2 = currentExpr.getArguments();
              const argText = args2.length > 0 ? args2[0].getText() : void 0;
              chainCalls.unshift({ name: methodName, node: currentExpr, argText });
              currentExpr = propAccess.getExpression();
            } else {
              break;
            }
          }
          let consecutiveFunctions = 0;
          let chainId = "orchestration";
          for (const step of chainCalls) {
            if (step.name === "orchestration" || step.name === "flow") {
              chainId = step.argText ? step.argText.replace(/['"]/g, "") : "orchestration";
            } else if (step.name === "thenFunctionality" || step.name === "then") {
              consecutiveFunctions = 0;
            } else if (step.name === "thenEntityOrchestration" || step.name === "thenEntity") {
              consecutiveFunctions = 0;
            } else if (step.name === "thenFunction") {
              errors.push({
                ruleId: "krnl/entity-no-direct-library-calls",
                filePath,
                line: step.node.getStartLineNumber(),
                message: `Orchestration chain '${chainId}' violates Entity Purity Law. Entities cannot chain direct library functions via thenFunction(). Entities must only orchestrate functionalities (thenFunctionality) and orchestrations from other entities (thenEntityOrchestration).`,
                severity: "error"
              });
            }
          }
        }
      }
    }
    return { errors, warnings };
  }
  /**
   * Validates workspace layout invariants for symmetric Krnl architecture.
   */
  validateWorkspaceLayout(errors) {
    const krnlDir = path.join(this.projectRoot, "krnl");
    const srcDir = path.join(this.projectRoot, "src");
    const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
    if (!targetDir) return;
    const backendDir = path.join(targetDir, "backend");
    const frontendDir = path.join(targetDir, "frontend");
    if (fs.existsSync(backendDir)) {
      const bLibs = path.join(backendDir, "libraries");
      if (fs.existsSync(bLibs)) {
        for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const libPath = path.join(bLibs, entry.name);
          const manifestPath = path.join(libPath, "manifest.json");
          if (!fs.existsSync(manifestPath)) {
            errors.push({
              ruleId: "krnl/concept-manifest-required",
              filePath: libPath,
              message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
              severity: "error"
            });
          }
        }
      }
      const bFuncs = path.join(backendDir, "functionalities");
      if (fs.existsSync(bFuncs)) {
        for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const funcPath = path.join(bFuncs, entry.name);
          const manifestPath = path.join(funcPath, "manifest.json");
          if (!fs.existsSync(manifestPath)) {
            errors.push({
              ruleId: "krnl/functionality-manifest-required",
              filePath: funcPath,
              message: `Backend functionality "${entry.name}" is missing a manifest.json file.`,
              severity: "error"
            });
          }
        }
      }
    }
    if (fs.existsSync(frontendDir)) {
      const fLibs = path.join(frontendDir, "libraries");
      if (fs.existsSync(fLibs)) {
        for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const libPath = path.join(fLibs, entry.name);
          const manifestPath = path.join(libPath, "manifest.json");
          if (!fs.existsSync(manifestPath)) {
            errors.push({
              ruleId: "krnl/frontend-concept-manifest-required",
              filePath: libPath,
              message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
              severity: "error"
            });
          }
        }
      }
      const fFuncs = path.join(frontendDir, "functionalities");
      if (fs.existsSync(fFuncs)) {
        for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const funcPath = path.join(fFuncs, entry.name);
          const manifestPath = path.join(funcPath, "manifest.json");
          if (!fs.existsSync(manifestPath)) {
            errors.push({
              ruleId: "krnl/frontend-functionality-manifest-required",
              filePath: funcPath,
              message: `Frontend functionality "${entry.name}" is missing a manifest.json file.`,
              severity: "error"
            });
          }
        }
      }
    }
  }
  collectSourceFiles(dir, collected = []) {
    if (!fs.existsSync(dir)) return collected;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
        collected.push(full);
      }
    }
    return collected;
  }
};

// src/commands/validate.ts
async function runValidate(projectRoot = process.cwd()) {
  console.log(`
\u{1F50D} [Krnl Validate] Scanning project at: ${projectRoot}
`);
  const validator = new KrnlValidatorEngine({ projectRoot });
  const report = validator.validateAll();
  if (report.warnings.length > 0) {
    console.warn(`\u26A0\uFE0F  [WARNINGS] Found ${report.warnings.length} warning(s):`);
    for (const w of report.warnings) {
      console.warn(`  - [${w.ruleId}] ${w.filePath}${w.line ? `:${w.line}` : ""}: ${w.message}`);
    }
  }
  if (!report.valid) {
    console.error(`
\u274C [VALIDATION FAILED] Found ${report.errors.length} error(s):
`);
    for (const err of report.errors) {
      console.error(`  \u274C [${err.ruleId}] ${err.filePath}${err.line ? `:${err.line}` : ""}`);
      console.error(`     ${err.message}
`);
    }
    return false;
  }
  console.log(`\u2705 [VALIDATION PASSED] ${report.totalFiles} source files verified clean against Krnl paradigms.
`);
  return true;
}

// src/commands/generate.ts
var fs5 = __toESM(require("fs"), 1);
var path5 = __toESM(require("path"), 1);

// ../core/dist/index.js
init_chunk_V2DX7YIU();
init_chunk_6ULMHNXR();
init_chunk_7WUETJEV();
init_chunk_BE76RL6F();
init_chunk_YUK6Q563();
init_chunk_HIMEZUU2();
init_chunk_ENZ2RQVJ();
init_chunk_R6CCWALL();
init_chunk_6QCYRS5L();
init_chunk_XSCKNRCZ();
init_chunk_GADIRLRS();
init_chunk_MLVWARD4();
init_chunk_P6XEM2LA();
init_chunk_DI27MOR7();
init_chunk_3ES4K2ZP();
init_chunk_OEINUDSE();
init_chunk_K54K2KZW();
init_chunk_YXGL3ZEU();
init_chunk_KFQGP6VL();
var import_child_process = require("child_process");
var import_util = require("util");
var fs23 = __toESM(require("fs"), 1);
var path22 = __toESM(require("path"), 1);
init_K_LIB_Krnl_Frontend_Generator();
init_K_LIB_Krnl_Frontend_Builder();
var execAsync = (0, import_util.promisify)(import_child_process.exec);
var KrnlPackageReconciler = class {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot = process.cwd(), writeChanges = true) {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps = {};
    const aggregatedDevDeps = {};
    for (const mPath of manifests) {
      try {
        const raw = fs23.readFileSync(mPath, "utf8");
        const json = JSON.parse(raw);
        if (json.dependencies && typeof json.dependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }
    const conflicts = [];
    const resolvedDeps = {};
    const resolvedDevDeps = {};
    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }
    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }
    const pkgJsonPath = path22.join(projectRoot, "package.json");
    let updated = false;
    if (fs23.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs23.readFileSync(pkgJsonPath, "utf8"));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;
      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      if (hasChanges && writeChanges) {
        fs23.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + "\n");
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }
    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts
    };
  }
  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot) {
    const searchDirs = [
      path22.join(projectRoot, "krnl", "backend", "libraries"),
      path22.join(projectRoot, "krnl", "backend", "functionalities"),
      path22.join(projectRoot, "krnl", "frontend", "libraries"),
      path22.join(projectRoot, "krnl", "frontend", "functionalities"),
      // Fallbacks
      path22.join(projectRoot, "src", "functionalities"),
      path22.join(projectRoot, "src", "libraries")
    ];
    const found = [];
    for (const dir of searchDirs) {
      if (fs23.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }
  static scanRecursive(dir, found) {
    try {
      const entries = fs23.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
        const full = path22.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === "manifest.json") {
          found.push(full);
        }
      }
    } catch (e) {
    }
  }
};

// src/commands/generate.ts
async function runGenerate(type, name, _parentEntity, projectRoot = process.cwd()) {
  if (!name) {
    console.error("\u274C Error: Resource name is required. Usage: krnl generate <entity|functionality|library|subapp> <Name>");
    process.exit(1);
  }
  switch (type.toLowerCase()) {
    case "entity":
      generateEntity(name, projectRoot);
      break;
    case "functionality":
      generateFunctionality(name, projectRoot);
      break;
    case "library":
      generateLibrary(name, projectRoot);
      break;
    case "subapp":
      generateSubApp(name, projectRoot);
      break;
    default:
      console.error(`\u274C Unknown resource type "${type}". Valid types: entity, functionality, library, subapp`);
      process.exit(1);
  }
}
function getPlaneRoots(projectRoot) {
  const krnlRoot = path5.join(projectRoot, "krnl");
  if (fs5.existsSync(krnlRoot)) {
    return {
      backend: path5.join(krnlRoot, "backend"),
      frontend: path5.join(krnlRoot, "frontend"),
      isKrnlDir: true
    };
  }
  return {
    backend: path5.join(projectRoot, "src"),
    frontend: path5.join(projectRoot, "src"),
    isKrnlDir: false
  };
}
function generateEntity(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const bEntityDir = path5.join(backend, "entities", name);
  fs5.mkdirSync(path5.join(bEntityDir, "orchestrations"), { recursive: true });
  fs5.mkdirSync(path5.join(bEntityDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(bEntityDir, `${name}.ts`), `import { Entity, KrnlMagneticLoader } from "@dinilmusick/krnl-core";

/**
 * @role skeleton
 */
export class ${name} extends Entity {
  constructor() {
    super({
      id: "${name}",
      version: "1.0.0",
      description: "${name} entity"
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${name};
`);
  fs5.writeFileSync(path5.join(bEntityDir, "orchestrations", "DefaultFlow.ts"), `export function configureDefaultFlow(entity: any) {
  return entity.flow("defaultFlow")
    .register({ visibility: "public" });
}
`);
  fs5.writeFileSync(path5.join(bEntityDir, "tests", `${name}.test.ts`), `import { describe, it, expect } from "vitest";
import { ${name} } from "../${name}.js";

describe("${name} Entity", () => {
  it("instantiates correctly", () => {
    const instance = new ${name}();
    expect(instance.id).toBe("${name}");
  });
});
`);
  const fEntityDir = path5.join(frontend, "entities", name);
  fs5.mkdirSync(path5.join(fEntityDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(fEntityDir, `${name}0.tsx`), `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-entity-${name.toLowerCase()}">
      <h2>${name} (Variant 0)</h2>
    </div>
  );
};

export default ${name}0;
`);
  fs5.writeFileSync(path5.join(fEntityDir, "tests", `${name}0.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders variant 0", () => {
    expect(true).toBe(true);
  });
});
`);
  console.log(`\u2705 Created Backend Entity Folder: krnl/backend/entities/${name}/`);
  console.log(`\u2705 Created Frontend Entity Folder: krnl/frontend/entities/${name}/`);
}
function generateFunctionality(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const bFuncDir = path5.join(backend, "functionalities", name);
  fs5.mkdirSync(path5.join(bFuncDir, "main_function"), { recursive: true });
  fs5.mkdirSync(path5.join(bFuncDir, "state_data"), { recursive: true });
  fs5.mkdirSync(path5.join(bFuncDir, "helper_functions"), { recursive: true });
  fs5.mkdirSync(path5.join(bFuncDir, "events"), { recursive: true });
  fs5.mkdirSync(path5.join(bFuncDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(bFuncDir, `${name}Atom.ts`), `export interface ${name}Input {
  payload?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`);
  fs5.writeFileSync(path5.join(bFuncDir, "manifest.json"), JSON.stringify({
    name,
    description: `${name} quad-unit functionality`,
    dependencies: {}
  }, null, 2));
  fs5.writeFileSync(path5.join(bFuncDir, "main_function", "logic.ts"), `import type { ${name}Input, ${name}Output } from "../${name}Atom.js";

export const main = async (input: ${name}Input, { state }: any): Promise<${name}Output> => {
  return {
    success: true,
    timestamp: Date.now()
  };
};
`);
  fs5.writeFileSync(path5.join(bFuncDir, "main_function", "lifecycle.ts"), `export async function onMount() {}
export async function onTeardown() {}
`);
  fs5.writeFileSync(path5.join(bFuncDir, "state_data", "state.ts"), `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`);
  fs5.writeFileSync(path5.join(bFuncDir, "helper_functions", "helper.ts"), `/**
 * @role component
 */
export function exampleHelper(): boolean {
  return true;
}
`);
  fs5.writeFileSync(path5.join(bFuncDir, "events", "events.ts"), `/**
 * @role component
 */
export interface ${name}CompletedEvent {
  timestamp: number;
}
`);
  fs5.writeFileSync(path5.join(bFuncDir, "tests", `${name}.test.ts`), `import { describe, it, expect } from "vitest";

describe("${name} functionality", () => {
  it("passes basic test", () => {
    expect(true).toBe(true);
  });
});
`);
  const fFuncDir = path5.join(frontend, "functionalities", name);
  fs5.mkdirSync(path5.join(fFuncDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(fFuncDir, `${name}0.tsx`), `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-func-${name.toLowerCase()}">
      <h3>${name} (Variant 0)</h3>
    </div>
  );
};

export default ${name}0;
`);
  fs5.writeFileSync(path5.join(fFuncDir, "manifest.json"), JSON.stringify({
    name: `${name}UI`,
    dependencies: {}
  }, null, 2));
  fs5.writeFileSync(path5.join(fFuncDir, "tests", `${name}0.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`);
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Backend Functionality Quad-Unit: krnl/backend/functionalities/${name}/`);
  console.log(`\u2705 Created Frontend Functionality: krnl/frontend/functionalities/${name}/`);
}
function generateLibrary(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith("Concepts") ? name : `${name}Concepts`;
  const bLibDir = path5.join(backend, "libraries", conceptName);
  fs5.mkdirSync(path5.join(bLibDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(bLibDir, "definitions.ts"), `/**
 * @file definitions.ts
 * @role component
 */
export interface ${conceptName}Options {
  enabled?: boolean;
}
`);
  fs5.writeFileSync(path5.join(bLibDir, "functions.ts"), `/**
 * @file functions.ts
 * @role component
 */
import type { ${conceptName}Options } from "./definitions.js";

export function ${name.toLowerCase()}Transform<T>(data: T, _opts?: ${conceptName}Options): T {
  return data;
}
`);
  fs5.writeFileSync(path5.join(bLibDir, "manifest.json"), JSON.stringify({
    name: conceptName,
    dependencies: {}
  }, null, 2));
  fs5.writeFileSync(path5.join(bLibDir, "tests", `${conceptName}.test.ts`), `import { describe, it, expect } from "vitest";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(true).toBe(true);
  });
});
`);
  const fLibDir = path5.join(frontend, "libraries", conceptName);
  fs5.mkdirSync(path5.join(fLibDir, "tests"), { recursive: true });
  fs5.writeFileSync(path5.join(fLibDir, "definitions.ts"), `export interface ${name}Props {
  label?: string;
}
`);
  fs5.writeFileSync(path5.join(fLibDir, "components.tsx"), `import React from "react";
import type { ${name}Props } from "./definitions.js";
import "./styles.css";

export const ${name}: React.FC<${name}Props> = ({ label = "${name}" }) => {
  return <div className="krnl-${name.toLowerCase()}">{label}</div>;
};
`);
  fs5.writeFileSync(path5.join(fLibDir, "styles.css"), `.krnl-${name.toLowerCase()} {
  font-family: inherit;
}
`);
  fs5.writeFileSync(path5.join(fLibDir, "manifest.json"), JSON.stringify({
    name: `${conceptName}UI`,
    dependencies: {}
  }, null, 2));
  fs5.writeFileSync(path5.join(fLibDir, "tests", `${name}.test.tsx`), `import { describe, it, expect } from "vitest";

describe("${name} UI Concept", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`);
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Backend Concept Library: krnl/backend/libraries/${conceptName}/`);
  console.log(`\u2705 Created Frontend Concept Library: krnl/frontend/libraries/${conceptName}/`);
}
function generateSubApp(name, projectRoot) {
  const { backend } = getPlaneRoots(projectRoot);
  const subappDir = path5.join(backend, "subapps", name);
  fs5.mkdirSync(subappDir, { recursive: true });
  fs5.writeFileSync(path5.join(subappDir, "subapp.json"), JSON.stringify({
    name,
    version: "1.0.0",
    description: `${name} self-contained sub-app`,
    registrationEntry: "./register.js"
  }, null, 2));
  fs5.writeFileSync(path5.join(subappDir, "register.ts"), `export function register(context: any) {
  context.logger.log("Registering ${name} sub-app");
  return {
    name: "${name}",
    operations: []
  };
}
export default register;
`);
  console.log(`\u2705 Created Sub-App: krnl/backend/subapps/${name}/`);
}

// src/commands/watch.ts
var fs6 = __toESM(require("fs"), 1);
var path8 = __toESM(require("path"), 1);
function generateMagneticDeclarations(projectRoot = process.cwd()) {
  const { results: functionalities, libDirs } = scanDirectory(projectRoot);
  let dtsContent = `// Automatically generated by Krnl Magnetic Watcher. Do not edit manually.

`;
  dtsContent += `import { Entity } from '@dinilmusick/krnl-core';

`;
  const globalDeclarations = [];
  for (const func of functionalities) {
    const helpersDir = path8.join(func.funcPath, "helper_functions");
    if (fs6.existsSync(helpersDir)) {
      const files = fs6.readdirSync(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path8.join(helpersDir, file);
          const baseName = path8.basename(file, path8.extname(file));
          const importPath = `./${path8.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
    const eventsDir = path8.join(func.funcPath, "events");
    if (fs6.existsSync(eventsDir)) {
      const files = fs6.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path8.join(eventsDir, file);
          const baseName = path8.basename(file, path8.extname(file));
          const importPath = `./${path8.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
  }
  for (const libPath of libDirs) {
    scanLibFiles(libPath, projectRoot, globalDeclarations);
  }
  if (globalDeclarations.length > 0) {
    dtsContent += `declare global {
${Array.from(new Set(globalDeclarations)).join("\n")}
}
`;
  }
  const outPath = path8.join(projectRoot, "krnl-magnetic.d.ts");
  fs6.writeFileSync(outPath, dtsContent);
  console.log(`[Krnl Watch] Updated ambient declarations: ${outPath}`);
}
function scanLibFiles(dir, projectRoot, decls) {
  if (!fs6.existsSync(dir)) return;
  for (const entry of fs6.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path8.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanLibFiles(full, projectRoot, decls);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const baseName = path8.basename(entry.name, path8.extname(entry.name));
      const importPath = `./${path8.relative(projectRoot, full).replace(/\\/g, "/")}`;
      const { named, hasDefault } = parseExports(full, baseName);
      if (hasDefault) decls.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
      for (const n of named) decls.push(`  const ${n}: typeof import('${importPath}')['${n}'];`);
    }
  }
}
function scanDirectory(dir, results = [], libDirs = []) {
  if (!fs6.existsSync(dir)) return { results, libDirs };
  const list = fs6.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path8.join(dir, entry.name);
      if (entry.name === "functionalities") {
        const funcs = fs6.readdirSync(fullPath, { withFileTypes: true });
        for (const f of funcs) {
          if (f.isDirectory()) results.push({ funcPath: path8.join(fullPath, f.name), funcName: f.name });
        }
      } else if (entry.name === "libraries" || entry.name === "library") {
        libDirs.push(fullPath);
      } else {
        scanDirectory(fullPath, results, libDirs);
      }
    }
  }
  return { results, libDirs };
}
function parseExports(filePath, defaultName) {
  const content = fs6.readFileSync(filePath, "utf8");
  const named = [];
  let hasDefault = false;
  const namedRegex = /export\s+(?:const|let|var|function|class|async\s+function)\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    if (match[1]) named.push(match[1]);
  }
  if (content.includes("export default")) {
    hasDefault = true;
  }
  return { named, hasDefault };
}

// ../studio/src/server/AstMutationEngine.ts
var import_ts_morph3 = require("ts-morph");

// ../studio/src/server/ast/AstMetadataExtractor.ts
var fs7 = __toESM(require("fs"), 1);
var AstMetadataExtractor = class {
  project;
  constructor(project) {
    this.project = project;
  }
  extractInputsAndOutputs(atomPath) {
    const inputs = [];
    const outputs = [];
    if (!fs7.existsSync(atomPath)) return { inputs, outputs };
    try {
      const sourceFile = this.project.getSourceFile(atomPath) || this.project.addSourceFileAtPath(atomPath);
      const inputInterface = sourceFile.getInterface((i) => i.getName().endsWith("Input") || i.getName().includes("Inputs"));
      if (inputInterface) {
        for (const prop of inputInterface.getProperties()) {
          inputs.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
      const outputInterface = sourceFile.getInterface((i) => i.getName().endsWith("Output") || i.getName().includes("Outputs"));
      if (outputInterface) {
        for (const prop of outputInterface.getProperties()) {
          outputs.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
    } catch (err) {
      try {
        const content = fs7.readFileSync(atomPath, "utf8");
        const inMatch = content.match(/interface\s+\w+Input[^{]*\{([^}]+)\}/s);
        if (inMatch) {
          inMatch[1].split(";").map((l) => l.trim()).filter(Boolean).forEach((line) => {
            const [name, type] = line.split(":").map((s) => s.trim());
            if (name && type) inputs.push({ name, type });
          });
        }
      } catch (e) {
      }
    }
    return { inputs, outputs };
  }
  extractStateFields(statePath) {
    const fields = [];
    if (!fs7.existsSync(statePath)) return fields;
    try {
      const sourceFile = this.project.getSourceFile(statePath) || this.project.addSourceFileAtPath(statePath);
      const stateInterface = sourceFile.getInterface((i) => i.getName().endsWith("State"));
      if (stateInterface) {
        for (const prop of stateInterface.getProperties()) {
          fields.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
    } catch (e) {
      try {
        const content = fs7.readFileSync(statePath, "utf8");
        const match = content.match(/interface\s+\w+State[^{]*\{([^}]+)\}/s);
        if (match) {
          match[1].split(";").map((l) => l.trim()).filter(Boolean).forEach((line) => {
            const [name, type] = line.split(":").map((s) => s.trim());
            if (name && type) fields.push({ name, type });
          });
        }
      } catch (err) {
      }
    }
    return fields;
  }
  extractHelperNames(helpersDir) {
    if (!fs7.existsSync(helpersDir)) return [];
    try {
      return fs7.readdirSync(helpersDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")).map((f) => f.replace(/\.ts$/, ""));
    } catch (e) {
      return [];
    }
  }
};

// ../studio/src/server/ast/AstScanner.ts
var fs8 = __toESM(require("fs"), 1);
var path9 = __toESM(require("path"), 1);
var AstScanner = class {
  projectRoot;
  metadataExtractor;
  constructor(projectRoot, metadataExtractor) {
    this.projectRoot = projectRoot;
    this.metadataExtractor = metadataExtractor;
  }
  scanWorkspace(positions) {
    const nodes = [];
    const edges = [];
    this.scanEntities(nodes, edges, positions);
    this.scanSharedFunctionalities(nodes, edges, positions);
    this.scanLibraries(nodes, edges, positions);
    this.scanSubApps(nodes, edges, positions);
    return { nodes, edges };
  }
  scanEntities(nodes, edges, positions) {
    const srcDir = path9.join(this.projectRoot, "src");
    if (!fs8.existsSync(srcDir)) return;
    for (const entry of fs8.readdirSync(srcDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && entry.name !== "index.ts") {
        const entityName = path9.basename(entry.name, ".ts");
        const entityId = `entity:${entityName}`;
        const entityNode = {
          id: entityId,
          name: entityName,
          type: "entity",
          filePath: path9.join(srcDir, entry.name),
          functionalities: [],
          position: positions[entityId]
        };
        nodes.push(entityNode);
      }
    }
    const entitiesDir = path9.join(this.projectRoot, "src/entities");
    if (fs8.existsSync(entitiesDir)) {
      for (const entry of fs8.readdirSync(entitiesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const entityName = entry.name;
        const entityDir = path9.join(entitiesDir, entityName);
        const entityId = `entity:${entityName}`;
        const entityNode = {
          id: entityId,
          name: entityName,
          type: "entity",
          filePath: path9.join(entityDir, `${entityName}.ts`),
          functionalities: [],
          position: positions[entityId]
        };
        nodes.push(entityNode);
      }
    }
  }
  scanSharedFunctionalities(nodes, edges, positions) {
    const sharedFuncDir = path9.join(this.projectRoot, "src/functionalities");
    if (!fs8.existsSync(sharedFuncDir)) return;
    for (const func of fs8.readdirSync(sharedFuncDir, { withFileTypes: true })) {
      if (!func.isDirectory()) continue;
      const funcName = func.name;
      const funcDir = path9.join(sharedFuncDir, funcName);
      const funcId = `functionality:${funcName}`;
      const atomPath = path9.join(funcDir, `${funcName}Atom.ts`);
      const statePath = path9.join(funcDir, "state_data", "state.ts");
      const helpersDir = path9.join(funcDir, "helper_functions");
      const logicPath = path9.join(funcDir, "main_function", "logic.ts");
      const { inputs, outputs } = this.metadataExtractor.extractInputsAndOutputs(atomPath);
      const stateFields = this.metadataExtractor.extractStateFields(statePath);
      const helpers = this.metadataExtractor.extractHelperNames(helpersDir);
      let uiPath;
      for (const cand of [path9.join(funcDir, "ui.ts"), path9.join(funcDir, "view.ts"), path9.join(funcDir, `${funcName}View.ts`)]) {
        if (fs8.existsSync(cand)) {
          uiPath = cand;
          break;
        }
      }
      nodes.push({
        id: funcId,
        name: funcName,
        type: "functionality",
        filePath: logicPath,
        uiFilePath: uiPath,
        helpers,
        inputs,
        outputs,
        stateFields,
        position: positions[funcId]
      });
      this.scanConstituents("shared", funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath);
    }
  }
  scanFunctionalities(entityName, entityDir, entityId, entityNode, nodes, edges, positions) {
    let funcsDir = path9.join(entityDir, "functionalities");
    if (!fs8.existsSync(funcsDir)) funcsDir = entityDir;
    for (const func of fs8.readdirSync(funcsDir, { withFileTypes: true })) {
      if (!func.isDirectory() || func.name === "subsystems") continue;
      const funcName = func.name;
      const funcDir = path9.join(funcsDir, funcName);
      const funcId = `functionality:${entityName}:${funcName}`;
      entityNode.functionalities?.push(funcName);
      const atomPath = path9.join(funcDir, "atom", `${funcName}Atom.ts`);
      const statePath = path9.join(funcDir, "state_data", "state.ts");
      const helpersDir = path9.join(funcDir, "helper_functions");
      const logicPath = path9.join(funcDir, "main_function", "logic.ts");
      const { inputs, outputs } = this.metadataExtractor.extractInputsAndOutputs(atomPath);
      const stateFields = this.metadataExtractor.extractStateFields(statePath);
      const helpers = this.metadataExtractor.extractHelperNames(helpersDir);
      let uiPath;
      for (const cand of [path9.join(funcDir, "ui.ts"), path9.join(funcDir, "view.ts"), path9.join(funcDir, `${funcName}View.ts`)]) {
        if (fs8.existsSync(cand)) {
          uiPath = cand;
          break;
        }
      }
      nodes.push({
        id: funcId,
        name: funcName,
        type: "functionality",
        filePath: logicPath,
        uiFilePath: uiPath,
        parentEntity: entityName,
        helpers,
        inputs,
        outputs,
        stateFields,
        position: positions[funcId]
      });
      edges.push({
        id: `edge:${entityName}->${funcName}`,
        source: entityId,
        target: funcId,
        type: "contains",
        deletable: false
      });
      this.scanConstituents(entityName, funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath);
    }
  }
  scanConstituents(entityName, funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath) {
    const scope = `functionality:${entityName}:${funcName}`;
    const atomId = `comp_${entityName}_${funcName}_atom`;
    const logicId = `comp_${entityName}_${funcName}_logic`;
    const stateId = `comp_${entityName}_${funcName}_state`;
    nodes.push({
      id: atomId,
      name: `${funcName}Atom`,
      type: "component_atom",
      filePath: path9.join(funcDir, "atom", `${funcName}Atom.ts`),
      inputs,
      outputs,
      scope,
      position: positions[atomId]
    });
    nodes.push({
      id: logicId,
      name: "main_logic",
      type: "component_logic",
      filePath: path9.join(funcDir, "main_function", "logic.ts"),
      scope,
      position: positions[logicId]
    });
    nodes.push({
      id: stateId,
      name: `${funcName}State`,
      type: "component_state",
      filePath: path9.join(funcDir, "state_data", "state.ts"),
      stateFields,
      scope,
      position: positions[stateId]
    });
    edges.push({ id: `edge_${atomId}_${logicId}`, source: atomId, target: logicId, type: "dataflow", scope, deletable: false });
    edges.push({ id: `edge_${stateId}_${logicId}`, source: stateId, target: logicId, type: "dataflow", scope, deletable: false });
    helpers.forEach((h) => {
      const helperId = `comp_${entityName}_${funcName}_helper_${h}`;
      nodes.push({
        id: helperId,
        name: h,
        type: "component_helper",
        filePath: path9.join(funcDir, "helper_functions", `${h}.ts`),
        scope,
        position: positions[helperId]
      });
      edges.push({ id: `edge_${helperId}_${logicId}`, source: helperId, target: logicId, type: "dataflow", scope, deletable: false });
    });
    const uiId = `comp_${entityName}_${funcName}_ui`;
    const resolvedUiPath = uiPath || path9.join(funcDir, `${funcName}View.ts`);
    nodes.push({
      id: uiId,
      name: `${funcName}View`,
      type: "component_ui",
      filePath: resolvedUiPath,
      scope,
      position: positions[uiId]
    });
    edges.push({ id: `edge_${logicId}_${uiId}`, source: logicId, target: uiId, type: "dataflow", scope, deletable: false });
  }
  scanLibraries(nodes, edges, positions) {
    for (const cand of [path9.join(this.projectRoot, "src/libraries"), path9.join(this.projectRoot, "libraries")]) {
      if (fs8.existsSync(cand)) this.scanLibraryFolder(cand, cand, [], void 0, nodes, edges, positions);
    }
  }
  scanLibraryFolder(base, curr, cats, parent, nodes, edges, positions) {
    if (!fs8.existsSync(curr)) return;
    for (const entry of fs8.readdirSync(curr, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path9.join(curr, entry.name);
      if (entry.isDirectory()) {
        this.scanLibraryFolder(base, full, [...cats, entry.name], parent, nodes, edges, positions);
      } else if (/\.(ts|js|mjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts") && !/\.(test|spec)\./.test(entry.name)) {
        const raw = path9.basename(entry.name, path9.extname(entry.name));
        const name = raw === "index" && cats.length > 0 ? cats[cats.length - 1] : raw;
        const rel = path9.relative(base, full).replace(/[\\/.]+/g, "_");
        const id = parent ? `lib_${parent}_${rel}` : `lib_${rel}`;
        nodes.push({
          id,
          name,
          type: "library",
          filePath: full,
          parentEntity: parent,
          category: cats.length > 0 ? cats.join(" \u2192 ") : void 0,
          categoryPath: cats.length > 0 ? cats : void 0,
          scope: "root",
          position: positions[id]
        });
      }
    }
  }
  scanSubApps(nodes, edges, positions) {
    const subappDir = path9.join(this.projectRoot, "src/subapps");
    if (!fs8.existsSync(subappDir)) return;
    for (const app of fs8.readdirSync(subappDir, { withFileTypes: true })) {
      if (!app.isDirectory()) continue;
      const appId = `subapp_${app.name}`;
      nodes.push({
        id: appId,
        name: app.name,
        type: "subapp",
        filePath: path9.join(subappDir, app.name, "index.ts"),
        position: positions[appId]
      });
    }
  }
};

// ../studio/src/server/ast/AstOrchestrationMutator.ts
var fs9 = __toESM(require("fs"), 1);
var path10 = __toESM(require("path"), 1);
var import_ts_morph2 = require("ts-morph");
var AstOrchestrationMutator = class {
  projectRoot;
  project;
  customEdges = [];
  constructor(projectRoot, project) {
    this.projectRoot = projectRoot;
    this.project = project;
  }
  extractOrchestrationEdges(entityName) {
    const edges = [...this.customEdges];
    const entityFilePath = path10.join(this.projectRoot, "src/entities", entityName, `${entityName}Entity.ts`);
    try {
      const sourceFile = this.project.getSourceFile(entityFilePath) || this.project.addSourceFileAtPath(entityFilePath);
      const entityClass = sourceFile.getClass((c) => c.getName() === `${entityName}Entity` || c.getName() === entityName);
      if (!entityClass) return edges;
      const bootMethod = entityClass.getMethod("boot");
      if (!bootMethod) return edges;
      const callExprs = bootMethod.getDescendantsOfKind(import_ts_morph2.SyntaxKind.CallExpression);
      let previousTarget = null;
      for (const call of callExprs) {
        const propAccess = call.getExpression();
        if (propAccess.getKind() !== import_ts_morph2.SyntaxKind.PropertyAccessExpression) continue;
        const methodName = propAccess.getText().split(".").pop();
        if (methodName === "thenFunctionality" || methodName === "thenFunction") {
          const args2 = call.getArguments();
          if (args2.length > 0) {
            const rawTarget = args2[0].getText().replace(/['"]/g, "").trim();
            const targetId = methodName === "thenFunctionality" ? `func_${entityName}_${rawTarget}` : `func_${rawTarget}`;
            if (previousTarget && previousTarget !== targetId) {
              edges.push({
                id: `orch_edge_${previousTarget}_${targetId}`,
                source: previousTarget,
                target: targetId,
                type: "orchestration_step",
                deletable: true
              });
            }
            previousTarget = targetId;
          }
        }
      }
    } catch (e) {
    }
    return edges;
  }
  connectNodes(source, target, type = "dataflow") {
    const isTargetFunction = target.startsWith("function:");
    const isSourceFunction = source.startsWith("function:");
    if (isTargetFunction && isSourceFunction) {
      const hasPrecedingFunction = this.customEdges.some(
        (e) => e.target === source && e.source.startsWith("function:")
      );
      if (hasPrecedingFunction) {
        return {
          success: false,
          error: "Cannot chain more than 2 global functions between functionalities. Compose additional logic into a single library function instead."
        };
      }
    }
    const edgeId = `edge:${source}->${target}:${Date.now()}`;
    const edge = { id: edgeId, source, target, type, deletable: true };
    this.customEdges.push(edge);
    return { success: true, edge };
  }
  deleteEdge(edgeId) {
    this.customEdges = this.customEdges.filter((e) => e.id !== edgeId);
    return { success: true, deletedEdgeId: edgeId };
  }
  addFlowStep(entityFilePath, flowName, stepFunctionName) {
    return true;
  }
  listGlobalLibraryFunctions() {
    const res = [];
    const libDir = path10.join(this.projectRoot, "src/libraries");
    if (!fs9.existsSync(libDir)) return res;
    try {
      const libs = fs9.readdirSync(libDir, { withFileTypes: true });
      for (const lib of libs) {
        if (!lib.isDirectory()) continue;
        const libName = lib.name.replace(/\.ts$/, "");
        res.push({
          name: `${libName}.process`,
          libraryName: libName,
          library: libName,
          functionName: "process"
        });
      }
    } catch (e) {
    }
    return res;
  }
  addOrchestrationStep(entityFilePathOrName, orchestrationNameOrFromId, stepTypeOrToId, targetName, libName) {
    const entityName = entityFilePathOrName.includes("/") ? path10.basename(entityFilePathOrName).replace(/Entity\.ts$/, "") : entityFilePathOrName;
    const entityFilePath = path10.isAbsolute(entityFilePathOrName) ? entityFilePathOrName : path10.join(this.projectRoot, "src/entities", entityName, `${entityName}Entity.ts`);
    try {
      const sourceFile = this.project.getSourceFile(entityFilePath) || this.project.addSourceFileAtPath(entityFilePath);
      const entityClass = sourceFile.getClass((c) => c.getName() === `${entityName}Entity` || c.getName() === entityName);
      if (!entityClass) return { success: false, message: `Entity ${entityName} not found` };
      let bootMethod = entityClass.getMethod("boot");
      if (!bootMethod) {
        bootMethod = entityClass.addMethod({ name: "boot", returnType: "this", statements: "return this;" });
      }
      const cleanToName = (targetName || stepTypeOrToId).replace(/^func_[^_]+_/, "").replace(/^func_/, "");
      const chainMethod = stepTypeOrToId === "function" || targetName ? "thenFunction" : "thenFunctionality";
      const newCall = `.${chainMethod}('${cleanToName}')`;
      const bodyText = bootMethod.getBodyText() || "return this;";
      if (bodyText.includes("return this;")) {
        bootMethod.setBodyText(bodyText.replace("return this;", `return this${newCall};`));
      } else if (bodyText.includes("return this.")) {
        bootMethod.setBodyText(bodyText.replace(";", `${newCall};`));
      } else {
        bootMethod.setBodyText(`return this${newCall};
${bodyText}`);
      }
      sourceFile.saveSync();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || String(err) };
    }
  }
};

// ../studio/src/server/ast/AstNodeMutator.ts
var fs10 = __toESM(require("fs"), 1);
var path11 = __toESM(require("path"), 1);
var AstNodeMutator = class {
  projectRoot;
  layoutPath;
  undoStack = [];
  redoStack = [];
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.layoutPath = path11.join(projectRoot, ".krnl", "layout.json");
  }
  loadPositions() {
    if (fs10.existsSync(this.layoutPath)) {
      try {
        return JSON.parse(fs10.readFileSync(this.layoutPath, "utf8"));
      } catch (e) {
      }
    }
    return {};
  }
  savePositions(positions) {
    try {
      const dir = path11.dirname(this.layoutPath);
      if (!fs10.existsSync(dir)) fs10.mkdirSync(dir, { recursive: true });
      fs10.writeFileSync(this.layoutPath, JSON.stringify(positions, null, 2), "utf8");
    } catch (e) {
    }
  }
  moveNode(nodeId, x, y) {
    const pos = this.loadPositions();
    this.undoStack.push({ ...pos });
    pos[nodeId] = { x, y };
    this.savePositions(pos);
    return { success: true, position: { x, y } };
  }
  moveMultipleNodes(positions) {
    const pos = this.loadPositions();
    this.undoStack.push({ ...pos });
    Object.assign(pos, positions);
    this.savePositions(pos);
    return { success: true };
  }
  alignLayout(algorithm = "hierarchical") {
    const positions = this.loadPositions();
    return { success: true, positions };
  }
  undo() {
    if (this.undoStack.length === 0) return { success: false };
    const cur = this.loadPositions();
    this.redoStack.push(cur);
    const prev = this.undoStack.pop();
    this.savePositions(prev);
    return { success: true };
  }
  redo() {
    if (this.redoStack.length === 0) return { success: false };
    const cur = this.loadPositions();
    this.undoStack.push(cur);
    const next = this.redoStack.pop();
    this.savePositions(next);
    return { success: true };
  }
  deleteNode(nodeId) {
    const pos = this.loadPositions();
    delete pos[nodeId];
    this.savePositions(pos);
    return { success: true, deletedNodeId: nodeId };
  }
  createEntity(entityName) {
    const entityDir = path11.join(this.projectRoot, "src/entities", entityName);
    fs10.mkdirSync(entityDir, { recursive: true });
    const entityFilePath = path11.join(entityDir, `${entityName}Entity.ts`);
    const content = `import { Entity } from '@dinilmusick/krnl-core';

export class ${entityName}Entity extends Entity {
  public boot() {
    return this;
  }
}
`;
    fs10.writeFileSync(entityFilePath, content, "utf8");
    return { success: true, filePath: entityFilePath };
  }
  createFunctionality(entityName, funcName) {
    const funcDir = path11.join(this.projectRoot, "src/entities", entityName, funcName);
    fs10.mkdirSync(path11.join(funcDir, "atom"), { recursive: true });
    fs10.mkdirSync(path11.join(funcDir, "state_data"), { recursive: true });
    fs10.mkdirSync(path11.join(funcDir, "main_function"), { recursive: true });
    fs10.mkdirSync(path11.join(funcDir, "helper_functions"), { recursive: true });
    const f1 = path11.join(funcDir, "atom", `${funcName}Atom.ts`);
    const f2 = path11.join(funcDir, "state_data", "state.ts");
    const f3 = path11.join(funcDir, "main_function", "logic.ts");
    fs10.writeFileSync(f1, `export interface ${funcName}Input { [k: string]: any; }
export interface ${funcName}Output { success: boolean; }
`);
    fs10.writeFileSync(f2, `export interface ${funcName}State { active: boolean; }
`);
    fs10.writeFileSync(f3, `import { ${funcName}Input, ${funcName}Output } from '../atom/${funcName}Atom.js';

export async function main(input: ${funcName}Input): Promise<${funcName}Output> {
  return { success: true };
}
`);
    return { success: true, filesCreated: [f1, f2, f3] };
  }
  createLibrary(name) {
    const clean = name.replace(/Concepts$/, "");
    const libDir = path11.join(this.projectRoot, "src/libraries", `${clean}Concepts`);
    fs10.mkdirSync(libDir, { recursive: true });
    const f = path11.join(libDir, "index.ts");
    fs10.writeFileSync(f, `export class ${clean}Concepts {
  static process(d: any) { return { valid: true }; }
}
`);
    return { success: true, filePath: f };
  }
};

// ../studio/src/server/AstMutationEngine.ts
var AstMutationEngine = class {
  projectRoot;
  project;
  metadataExtractor;
  scanner;
  orchestrationMutator;
  nodeMutator;
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.project = new import_ts_morph3.Project({ skipAddingFilesFromTsConfig: true });
    this.metadataExtractor = new AstMetadataExtractor(this.project);
    this.scanner = new AstScanner(this.projectRoot, this.metadataExtractor);
    this.orchestrationMutator = new AstOrchestrationMutator(this.projectRoot, this.project);
    this.nodeMutator = new AstNodeMutator(this.projectRoot);
  }
  extractArchitectureGraph() {
    const positions = this.nodeMutator.loadPositions();
    const graph = this.scanner.scanWorkspace(positions);
    const entities = graph.nodes.filter((n) => n.type === "entity");
    for (const ent of entities) {
      const orchEdges = this.orchestrationMutator.extractOrchestrationEdges(ent.name);
      graph.edges.push(...orchEdges);
    }
    return graph;
  }
  moveNode(nodeId, x, y) {
    return this.nodeMutator.moveNode(nodeId, x, y);
  }
  moveMultipleNodes(positions) {
    return this.nodeMutator.moveMultipleNodes(positions);
  }
  alignLayout(algorithm) {
    return this.nodeMutator.alignLayout(algorithm);
  }
  undo() {
    return this.nodeMutator.undo();
  }
  redo() {
    return this.nodeMutator.redo();
  }
  deleteNode(nodeId) {
    return this.nodeMutator.deleteNode(nodeId);
  }
  createEntity(entityName) {
    return this.nodeMutator.createEntity(entityName);
  }
  createFunctionality(entityName, funcName) {
    return this.nodeMutator.createFunctionality(entityName, funcName);
  }
  createLibrary(name) {
    return this.nodeMutator.createLibrary(name);
  }
  connectNodes(source, target, type) {
    return this.orchestrationMutator.connectNodes(source, target, type);
  }
  deleteEdge(edgeId) {
    return this.orchestrationMutator.deleteEdge(edgeId);
  }
  addFlowStep(p1, p2, p3) {
    return this.orchestrationMutator.addFlowStep(p1, p2, p3);
  }
  listGlobalLibraryFunctions() {
    return this.orchestrationMutator.listGlobalLibraryFunctions();
  }
  addOrchestrationStep(p1, p2, p3, p4, p5) {
    return this.orchestrationMutator.addOrchestrationStep(p1, p2, p3, p4, p5);
  }
};

// ../studio/src/server/FunctionExecutor.ts
var path12 = __toESM(require("path"), 1);
var fs11 = __toESM(require("fs"), 1);
var import_url3 = require("url");
var esbuild = __toESM(require("esbuild"), 1);
var FunctionExecutor = class {
  /**
   * Executes a specific function, entity, or library in an isolated sandbox with metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    let absPath = path12.resolve(request.filePath);
    if (!fs11.existsSync(absPath)) {
      return {
        success: false,
        durationMs: 0,
        memoryDeltaBytes: 0,
        error: `File not found: ${absPath}`,
        logs: []
      };
    }
    if (fs11.lstatSync(absPath).isDirectory()) {
      const base = path12.basename(absPath);
      const candidates = [
        path12.join(absPath, "main_function/logic.ts"),
        path12.join(absPath, `${base}.ts`),
        path12.join(absPath, "index.ts"),
        path12.join(absPath, "entity.ts")
      ];
      const found = candidates.find((c) => fs11.existsSync(c));
      if (found) {
        absPath = found;
      } else {
        return {
          success: false,
          durationMs: 0,
          memoryDeltaBytes: 0,
          error: `No executable TypeScript entry point found in directory: ${absPath}`,
          logs: []
        };
      }
    }
    const dirOfEntry = path12.dirname(absPath);
    const tempBundlePath = path12.join(
      dirOfEntry,
      `.krnl-exec-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`
    );
    const tsResolverPlugin = {
      name: "ts-resolver-plugin",
      setup(build2) {
        build2.onResolve({ filter: /.*/ }, (args2) => {
          if (args2.path.startsWith(".")) {
            const dir = args2.resolveDir || path12.dirname(args2.importer);
            const candidateJs = path12.resolve(dir, args2.path);
            const candidateTs = candidateJs.replace(/\.js$/, ".ts");
            if (fs11.existsSync(candidateTs)) {
              return { path: candidateTs };
            }
            if (fs11.existsSync(candidateJs)) {
              return { path: candidateJs };
            }
          }
          return null;
        });
      }
    };
    try {
      await esbuild.build({
        entryPoints: [absPath],
        bundle: true,
        outfile: tempBundlePath,
        format: "esm",
        platform: "node",
        target: "esnext",
        plugins: [tsResolverPlugin],
        external: ["@dinilmusick/krnl-core", "vanjs-core", "worker_threads", "ws", "fs", "path", "http", "events"]
      });
      const fileUrl = (0, import_url3.pathToFileURL)(tempBundlePath).href;
      const mod = await import(fileUrl);
      let targetFn = null;
      let targetClass = null;
      if (request.functionName && mod[request.functionName]) {
        targetFn = mod[request.functionName];
      } else if (typeof mod.main === "function") {
        targetFn = mod.main;
      } else if (typeof mod.register === "function") {
        targetFn = mod.register;
      } else if (typeof mod.default === "function") {
        targetFn = mod.default;
      } else {
        for (const key of Object.keys(mod)) {
          if (typeof mod[key] === "function") {
            targetFn = mod[key];
            break;
          }
        }
      }
      for (const key of Object.keys(mod)) {
        if (typeof mod[key] === "function" && mod[key].prototype && Object.getOwnPropertyNames(mod[key].prototype).length > 1) {
          targetClass = mod[key];
          break;
        }
      }
      let executionOutput = null;
      if (typeof targetFn === "function") {
        if (targetFn.prototype && (targetFn.prototype.boot || targetFn.name.endsWith("System") || targetFn.name.endsWith("Entity"))) {
          const instance = new targetFn();
          if (typeof instance.boot === "function") {
            await instance.boot();
          }
          const registeredFlows = instance["flows"] ? Array.from(instance["flows"].keys()) : [];
          if (request.input?.flowName && instance["flows"]?.has(request.input.flowName)) {
            const flow = instance["flows"].get(request.input.flowName);
            const flowRes = typeof flow.execute === "function" ? await flow.execute(request.input.payload || {}) : "Flow initiated";
            executionOutput = {
              entityId: instance.id || targetFn.name,
              flowExecuted: request.input.flowName,
              flowResult: flowRes,
              status: "FLOW_EXECUTED"
            };
          } else {
            executionOutput = {
              entityId: instance.id || targetFn.name,
              version: instance.version || "1.0.0",
              description: instance.description || "System Entity",
              status: "BOOTED_AND_READY",
              registeredFlows
            };
          }
        } else if (targetFn.name === "register" || mod.register === targetFn) {
          const mockContext = {
            entity: { id: "TestSandboxEntity", call: async () => ({}), emitEvent: () => {
            } },
            logger: { log: (msg) => logs.push(msg), error: (msg) => logs.push("ERROR: " + msg) }
          };
          const regResult = await targetFn(mockContext);
          executionOutput = {
            subappName: regResult?.name || "SubApp",
            operations: (regResult?.operations || []).map((o) => ({ name: o.name, description: o.description })),
            ui: regResult?.ui,
            status: "REGISTERED"
          };
        } else if (targetFn.name.endsWith("Concepts") || targetClass && targetClass.name.endsWith("Concepts")) {
          const cls = targetClass || targetFn;
          const staticMethods = Object.getOwnPropertyNames(cls).filter((m) => typeof cls[m] === "function" && m !== "prototype" && m !== "length" && m !== "name");
          let invokedMethod = request.functionName || request.input?.method;
          let methodArgs = request.input?.args;
          if (!invokedMethod && staticMethods.length > 0) {
            invokedMethod = staticMethods[0];
          }
          if (invokedMethod && typeof cls[invokedMethod] === "function") {
            if (!methodArgs) {
              if (Array.isArray(request.input)) {
                methodArgs = request.input;
              } else if (request.input && typeof request.input === "object" && !request.input.method) {
                const fnStr = cls[invokedMethod].toString();
                const paramMatch = fnStr.match(/\(([^)]*)\)/);
                const paramNames = paramMatch ? paramMatch[1].split(",").map((p) => p.trim().split(":")[0].trim()) : [];
                if (paramNames.length > 1 && paramNames.every((p) => p in request.input)) {
                  methodArgs = paramNames.map((p) => request.input[p]);
                } else {
                  methodArgs = [request.input];
                }
              } else {
                methodArgs = [];
              }
            }
            const result = await cls[invokedMethod](...methodArgs);
            executionOutput = {
              library: cls.name,
              method: invokedMethod,
              args: methodArgs,
              result
            };
          } else {
            executionOutput = {
              library: cls.name,
              status: "READY",
              availableMethods: staticMethods
            };
          }
        } else {
          const dummyContext = {
            state: request.state || {},
            entity: {
              id: "TestSandbox",
              call: async () => ({}),
              emitEvent: () => {
              }
            }
          };
          executionOutput = await targetFn(request.input || {}, dummyContext);
        }
      } else if (mod && typeof mod === "object") {
        executionOutput = {
          exports: Object.keys(mod),
          status: "MODULE_LOADED"
        };
      } else {
        throw new Error(`No executable function or entity class export found in ${absPath}`);
      }
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const memoryDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - initialMem);
      return {
        success: true,
        output: executionOutput,
        durationMs,
        memoryDeltaBytes,
        logs
      };
    } catch (err) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      return {
        success: false,
        durationMs,
        memoryDeltaBytes: 0,
        error: err?.message || String(err),
        logs
      };
    } finally {
      if (fs11.existsSync(tempBundlePath)) {
        try {
          fs11.unlinkSync(tempBundlePath);
        } catch (e) {
        }
      }
    }
  }
};

// ../studio/src/server/FileWatcher.ts
var fs12 = __toESM(require("fs"), 1);
var path13 = __toESM(require("path"), 1);
var StudioFileWatcher = class {
  watcher = null;
  rootDir;
  listeners = /* @__PURE__ */ new Set();
  debounceTimers = /* @__PURE__ */ new Map();
  constructor(rootDir = process.cwd()) {
    this.rootDir = path13.resolve(rootDir);
  }
  start() {
    if (this.watcher) return;
    const srcDir = path13.join(this.rootDir, "src");
    if (!fs12.existsSync(srcDir)) return;
    this.watcher = fs12.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git") || filename.endsWith(".d.ts") || filename.endsWith(".log") || filename.endsWith(".tmp") || filename.includes(".krnl-graph") || filename.includes(".DS_Store")) {
        return;
      }
      const fullPath = path13.join(srcDir, filename);
      if (this.debounceTimers.has(fullPath)) {
        clearTimeout(this.debounceTimers.get(fullPath));
      }
      const timer = setTimeout(() => {
        this.debounceTimers.delete(fullPath);
        for (const listener of this.listeners) {
          try {
            listener({ eventType, filename, fullPath });
          } catch (e) {
          }
        }
      }, 300);
      this.debounceTimers.set(fullPath, timer);
    });
  }
  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  updateRoot(newRoot) {
    this.stop();
    this.rootDir = path13.resolve(newRoot);
    this.start();
  }
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
};

// ../studio/src/server/JsonRpcRouter.ts
var fs13 = __toESM(require("fs"), 1);
var path14 = __toESM(require("path"), 1);

// ../studio/src/server/PreemptiveDocManager.ts
var PreemptiveDocManager = class {
  static endpoints = {
    // 1. Workspace
    "project.create": {
      id: "project.create",
      method: "POST",
      path: "/api/v1/project/create",
      rpcMethod: "project.create",
      title: "Create Project Workspace",
      description: "Initializes a new Krnl full-stack workspace with standard quad-units, configs, and entity roots.",
      category: "Workspace",
      payloadSchema: { name: "string", targetDir: "string (optional)", options: "object (optional)" },
      examplePayload: { name: "PaymentApp", targetDir: "./projects/PaymentApp" },
      nextSuggestedEndpoints: ["entity.create", "library.create", "graph.getArchitecture"]
    },
    "project.load": {
      id: "project.load",
      method: "POST",
      path: "/api/v1/project/load",
      rpcMethod: "project.load",
      title: "Load Project Workspace",
      description: "Switches the active workspace context and synchronizes the visual node graph and file watcher.",
      category: "Workspace",
      payloadSchema: { path: "string (absolute or relative project path)" },
      examplePayload: { path: "examples/unified-workspace" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "validate.audit", "test.executeFunction"]
    },
    "graph.getArchitecture": {
      id: "graph.getArchitecture",
      method: "GET",
      path: "/api/v1/project/graph",
      rpcMethod: "graph.getArchitecture",
      title: "Get Architecture Graph",
      description: "Inspects source files on disk and returns the complete hierarchical entity, quad-unit, and concept library graph.",
      category: "Workspace",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["entity.create", "functionality.create", "validate.audit"]
    },
    // 2. Interactive Graph Controls & Layout
    "graph.moveNode": {
      id: "graph.moveNode",
      method: "POST",
      path: "/api/v1/graph/moveNode",
      rpcMethod: "graph.moveNode",
      title: "Move Node Coordinates",
      description: "Updates and persists the (x, y) canvas coordinates of a specific node in real time.",
      category: "GraphControls",
      payloadSchema: { nodeId: "string", x: "number", y: "number" },
      examplePayload: { nodeId: "entity:TradingSystem", x: 250, y: 180 },
      nextSuggestedEndpoints: ["graph.connectNodes", "graph.getArchitecture"]
    },
    "graph.connectNodes": {
      id: "graph.connectNodes",
      method: "POST",
      path: "/api/v1/graph/connectNodes",
      rpcMethod: "graph.connectNodes",
      title: "Establish Wire Connection",
      description: "Creates a directional wire connection between two nodes with support for auto-spawn and dataflow.",
      category: "GraphControls",
      payloadSchema: { source: "string", target: "string", type: "string (optional: dataflow/contains/flow_step)" },
      examplePayload: { source: "entity:TradingSystem", target: "functionality:TradingSystem:ExecuteTrade", type: "contains" },
      nextSuggestedEndpoints: ["graph.moveNode", "graph.deleteEdge"]
    },
    "graph.deleteEdge": {
      id: "graph.deleteEdge",
      method: "POST",
      path: "/api/v1/graph/deleteEdge",
      rpcMethod: "graph.deleteEdge",
      title: "Delete Connection (Via Centered Gizmo)",
      description: "Deletes a wire connection identified by its edge ID.",
      category: "GraphControls",
      payloadSchema: { edgeId: "string" },
      examplePayload: { edgeId: "edge:TradingSystem->QuotePrice" },
      nextSuggestedEndpoints: ["graph.connectNodes", "graph.alignLayout"]
    },
    "graph.deleteNode": {
      id: "graph.deleteNode",
      method: "POST",
      path: "/api/v1/graph/deleteNode",
      rpcMethod: "graph.deleteNode",
      title: "Delete Node & Source Assets",
      description: "Removes a node from the visual graph and safely cleans up its underlying source files from the workspace.",
      category: "GraphControls",
      payloadSchema: { nodeId: "string" },
      examplePayload: { nodeId: "functionality:TradingSystem:QuotePrice" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "validate.audit"]
    },
    "graph.alignLayout": {
      id: "graph.alignLayout",
      method: "POST",
      path: "/api/v1/graph/alignLayout",
      rpcMethod: "graph.alignLayout",
      title: "Auto-Align Hierarchical Layout",
      description: "Re-computes clean hierarchical column-based coordinates for all nodes on the canvas.",
      category: "GraphControls",
      payloadSchema: { algorithm: "string (optional: hierarchical/grid)" },
      examplePayload: { algorithm: "hierarchical" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "graph.moveNode"]
    },
    "graph.undo": {
      id: "graph.undo",
      method: "POST",
      path: "/api/v1/graph/undo",
      rpcMethod: "graph.undo",
      title: "Undo Graph Mutation",
      description: "Reverts the previous canvas or node manipulation step.",
      category: "GraphControls",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.redo", "graph.getArchitecture"]
    },
    "graph.redo": {
      id: "graph.redo",
      method: "POST",
      path: "/api/v1/graph/redo",
      rpcMethod: "graph.redo",
      title: "Redo Graph Mutation",
      description: "Re-applies the previously undone canvas action.",
      category: "GraphControls",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.undo", "graph.getArchitecture"]
    },
    // 3. Scaffolding
    "entity.create": {
      id: "entity.create",
      method: "POST",
      path: "/api/v1/entity/create",
      rpcMethod: "graph.createEntity",
      title: "Scaffold Entity",
      description: "Surgically creates a new root or component Entity on disk with magnetic auto-discovery hooks.",
      category: "Scaffolding",
      payloadSchema: { name: "string (e.g. OrderSystem)" },
      examplePayload: { name: "OrderSystem" },
      nextSuggestedEndpoints: ["functionality.create", "flow.addStep", "library.create"]
    },
    "functionality.create": {
      id: "functionality.create",
      method: "POST",
      path: "/api/v1/functionality/create",
      rpcMethod: "graph.createFunctionality",
      title: "Scaffold Quad-Unit Functionality",
      description: "Generates a 4-layer quad-unit (Atom, logic.ts, state.ts, helper_functions/) nested in the target Entity.",
      category: "Scaffolding",
      payloadSchema: { entityName: "string", name: "string (functionality name)" },
      examplePayload: { entityName: "OrderSystem", name: "CreateOrder" },
      nextSuggestedEndpoints: ["test.executeFunction", "flow.addStep", "file.edit"]
    },
    "library.create": {
      id: "library.create",
      method: "POST",
      path: "/api/v1/library/create",
      rpcMethod: "graph.createLibrary",
      title: "Scaffold Domain Concept Library",
      description: "Generates a Layer 0 pure domain concept library ({Domain}Concepts.ts) with zero I/O side effects.",
      category: "Scaffolding",
      payloadSchema: { name: "string (e.g. Crypto)" },
      examplePayload: { name: "Crypto" },
      nextSuggestedEndpoints: ["file.edit", "functionality.create", "validate.audit"]
    },
    "flow.addStep": {
      id: "flow.addStep",
      method: "POST",
      path: "/api/v1/flow/addStep",
      rpcMethod: "graph.addFlowStep",
      title: "Inject Flow Step",
      description: "Surgically adds a .then() or .branch() step into an Entity boot flow pipeline without disturbing existing code.",
      category: "Scaffolding",
      payloadSchema: { entityFilePath: "string", flowName: "string", stepFunctionName: "string" },
      examplePayload: {
        entityFilePath: "src/entities/OrderSystem/OrderSystem.ts",
        flowName: "CheckoutFlow",
        stepFunctionName: "CreateOrder"
      },
      nextSuggestedEndpoints: ["test.executeFunction", "validate.audit"]
    },
    // 4. Code Mutation
    "file.read": {
      id: "file.read",
      method: "POST",
      path: "/api/v1/file/read",
      rpcMethod: "file.read",
      title: "Read Source File",
      description: "Reads exact source code and metadata of any file in the workspace.",
      category: "CodeMutation",
      payloadSchema: { filePath: "string (absolute or relative)" },
      examplePayload: { filePath: "src/entities/App/functionalities/Hello/main_function/logic.ts" },
      nextSuggestedEndpoints: ["file.edit", "test.executeFunction"]
    },
    "file.edit": {
      id: "file.edit",
      method: "POST",
      path: "/api/v1/file/edit",
      rpcMethod: "file.edit",
      title: "Surgical File Mutation",
      description: "Surgically updates or replaces targeted code blocks in a TypeScript file while preserving comments and formatting.",
      category: "CodeMutation",
      payloadSchema: { filePath: "string", newContent: "string" },
      examplePayload: { filePath: "src/.../logic.ts", newContent: "export const main = async () => ({ ok: true });" },
      nextSuggestedEndpoints: ["validate.audit", "test.executeFunction"]
    },
    "ui.generate": {
      id: "ui.generate",
      method: "POST",
      path: "/api/v1/ui/generate",
      rpcMethod: "ui.generate",
      title: "Generate VanJS UI Source",
      description: "Compiles a visual component tree JSON into clean, reactive VanJS TypeScript source code.",
      category: "CodeMutation",
      payloadSchema: { componentTree: "object", targetFilePath: "string (optional)" },
      examplePayload: { componentTree: { type: "KrnlButton", props: { icon: "\u{1F680}" } } },
      nextSuggestedEndpoints: ["file.edit", "validate.audit"]
    },
    // 5. Validation & Quality Gates
    "validate.audit": {
      id: "validate.audit",
      method: "POST",
      path: "/api/v1/validate/audit",
      rpcMethod: "validate.runPurityAudit",
      title: "Run AST 4-Layer Purity Audit",
      description: "Runs deep AST analysis across the workspace checking 4-layer function purity, 200-line limits, anti-polling, and import suffixes.",
      category: "Validation",
      payloadSchema: { projectPath: "string (optional)" },
      examplePayload: {},
      nextSuggestedEndpoints: ["test.executeFunction", "graph.getArchitecture"]
    },
    // 6. Sandboxed Testing
    "test.executeFunction": {
      id: "test.executeFunction",
      method: "POST",
      path: "/api/v1/test/execute",
      rpcMethod: "test.executeFunction",
      title: "Execute Function in Isolated Sandbox",
      description: "Invokes any targeted function in an isolated Node.js Worker sandbox, capturing output, latency (ms), and memory delta.",
      category: "Testing",
      payloadSchema: { filePath: "string", functionName: "string (optional)", input: "object" },
      examplePayload: {
        filePath: "src/entities/CalculatorSystem/functionalities/Calculate/main_function/logic.ts",
        input: { op: "add", a: 10, b: 20 }
      },
      nextSuggestedEndpoints: ["validate.audit", "flow.addStep"]
    },
    // 7. Documentation
    "docs.endpoints": {
      id: "docs.endpoints",
      method: "GET",
      path: "/api/v1/docs/endpoints",
      rpcMethod: "docs.endpoints",
      title: "Get Full API Documentation Catalog",
      description: "Returns the full list of all available Krnl Studio agentic endpoints with schemas, examples, and next steps.",
      category: "Documentation",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.getArchitecture", "entity.create"]
    }
  };
  static getAllEndpoints() {
    return Object.values(this.endpoints);
  }
  static getEndpoint(id) {
    return this.endpoints[id];
  }
  static decorateResponse(actionId, payload, host = "localhost:8080") {
    const ep = this.endpoints[actionId];
    const nextSteps = (ep?.nextSuggestedEndpoints || ["graph.getArchitecture", "validate.audit", "test.executeFunction"]).map((nextId) => {
      const nextMeta = this.endpoints[nextId];
      if (!nextMeta) return null;
      return {
        id: nextMeta.id,
        title: nextMeta.title,
        endpoint: `${nextMeta.method} ${nextMeta.path}`,
        rpcMethod: nextMeta.rpcMethod,
        description: nextMeta.description,
        examplePayload: nextMeta.examplePayload,
        curl: nextMeta.method === "GET" ? `curl -X GET http://${host}${nextMeta.path}` : `curl -X POST http://${host}${nextMeta.path} -H 'Content-Type: application/json' -d '${JSON.stringify(nextMeta.examplePayload)}'`
      };
    }).filter(Boolean);
    return {
      status: "success",
      payload,
      preemptiveDocumentation: {
        action: actionId,
        description: ep?.description || `Executed ${actionId}`,
        suggestedNextSteps: nextSteps,
        documentationIndexEndpoint: `GET http://${host}/api/v1/docs/endpoints`
      }
    };
  }
};

// ../studio/src/client/ui-builder/VanJSCodeGenerator.ts
var VanJSCodeGenerator = class {
  /**
   * Generates production-ready VanJS TypeScript source code from a component tree.
   */
  static generateCode(root, componentName = "GeneratedView") {
    const usedAtoms = /* @__PURE__ */ new Set();
    this.collectUsedAtoms(root, usedAtoms);
    const atomImports = Array.from(usedAtoms).filter((a) => a !== "Container" && a.startsWith("Krnl")).join(", ");
    let code = `import van from 'vanjs-core';
`;
    if (atomImports.length > 0) {
      code += `import { ${atomImports} } from '@dinilmusick/krnl-ui';
`;
    }
    code += `
`;
    code += `export function ${componentName}({ state, entity }: any): HTMLElement {
`;
    code += `  const { div } = van.tags;

`;
    code += `  return ${this.renderNodeToCode(root, 2)};
`;
    code += `}

`;
    code += `export default ${componentName};
`;
    return code;
  }
  static renderNodeToCode(node, indentLevel) {
    const indent = " ".repeat(indentLevel);
    const childIndent = " ".repeat(indentLevel + 2);
    if (node.type === "Container") {
      const childCode = (node.children || []).map((c) => this.renderNodeToCode(c, indentLevel + 2)).join(",\n");
      return `div(
${childIndent}{ class: '${node.props.class || "krnl-container"}' }${childCode ? `,
${childCode}` : ""}
${indent})`;
    }
    const propEntries = Object.entries(node.props).map(([k, v]) => {
      if (typeof v === "string" && (v.startsWith("state.") || v.startsWith("entity."))) {
        return `${k}: ${v}`;
      }
      if (k.startsWith("on") && typeof v === "string") {
        return `${k}: () => { ${v} }`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    }).join(", ");
    return `${node.type}({ ${propEntries} })`;
  }
  static collectUsedAtoms(node, atoms) {
    atoms.add(node.type);
    if (node.children) {
      for (const c of node.children) {
        this.collectUsedAtoms(c, atoms);
      }
    }
  }
};

// ../studio/src/server/JsonRpcRouter.ts
var JsonRpcRouter = class {
  astEngine;
  validator;
  projectRoot;
  onMutationCallback;
  constructor(projectRoot = process.cwd(), onMutation) {
    this.projectRoot = path14.resolve(projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
    this.onMutationCallback = onMutation;
  }
  setProjectRoot(newRoot) {
    this.projectRoot = path14.resolve(newRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
  }
  getProjectRoot() {
    return this.projectRoot;
  }
  async handle(req) {
    try {
      const { method, params = {}, id } = req;
      switch (method) {
        // 1. Workspace
        case "project.load":
        case "project.switch": {
          const targetPath = params.path || params.projectPath;
          if (!targetPath) throw new Error("Path is required to load project");
          const abs = path14.resolve(this.projectRoot, targetPath);
          if (!fs13.existsSync(abs)) throw new Error(`Project directory not found: ${targetPath}`);
          this.setProjectRoot(abs);
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse("project.load", { success: true, projectRoot: this.projectRoot, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.getArchitecture":
        case "project.getArchitecture": {
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse("graph.getArchitecture", graph);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "project.getStatus": {
          const graph = this.astEngine.extractArchitectureGraph();
          const summary = this.validator.validateAll();
          const status = {
            projectRoot: this.projectRoot,
            entityCount: graph.nodes.filter((n) => n.type === "entity").length,
            functionalityCount: graph.nodes.filter((n) => n.type === "functionality").length,
            libraryCount: graph.nodes.filter((n) => n.type === "library").length,
            subappCount: graph.nodes.filter((n) => n.type === "subapp").length,
            purityValid: summary.valid,
            purityErrors: summary.errors.length
          };
          const decorated = PreemptiveDocManager.decorateResponse("graph.getArchitecture", status);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 2. Interactive Graph Controls & Layout
        case "graph.moveNode": {
          const { nodeId, x, y } = params;
          if (!nodeId || x === void 0 || y === void 0) throw new Error("nodeId, x, and y are required");
          const res = this.astEngine.moveNode(nodeId, x, y);
          this.notifyMutation("graph.moveNode", { nodeId, x, y });
          const decorated = PreemptiveDocManager.decorateResponse("graph.moveNode", res);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.moveMultipleNodes": {
          const { positions } = params;
          if (!positions) throw new Error("positions map is required");
          const res = this.astEngine.moveMultipleNodes(positions);
          this.notifyMutation("graph.moveMultipleNodes", { count: Object.keys(positions).length });
          const decorated = PreemptiveDocManager.decorateResponse("graph.moveNode", res);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.connectNodes": {
          const { source, target, type } = params;
          if (!source || !target) throw new Error("source and target node IDs are required");
          const res = this.astEngine.connectNodes(source, target, type);
          if (!res.success) {
            return { jsonrpc: "2.0", id, error: { code: -32002, message: res.error || "Connection rejected by validation rule" } };
          }
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.connectNodes", { source, target, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("graph.connectNodes", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.deleteEdge": {
          const { edgeId } = params;
          if (!edgeId) throw new Error("edgeId is required");
          const res = this.astEngine.deleteEdge(edgeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.deleteEdge", { edgeId });
          const decorated = PreemptiveDocManager.decorateResponse("graph.deleteEdge", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.deleteNode": {
          const { nodeId } = params;
          if (!nodeId) throw new Error("nodeId is required");
          const res = this.astEngine.deleteNode(nodeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.deleteNode", { nodeId });
          const decorated = PreemptiveDocManager.decorateResponse("graph.deleteNode", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.alignLayout": {
          const { algorithm } = params;
          const res = this.astEngine.alignLayout(algorithm);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.alignLayout", { algorithm: algorithm || "hierarchical" });
          const decorated = PreemptiveDocManager.decorateResponse("graph.alignLayout", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.undo": {
          const res = this.astEngine.undo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.undo", {});
          const decorated = PreemptiveDocManager.decorateResponse("graph.undo", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.redo": {
          const res = this.astEngine.redo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.redo", {});
          const decorated = PreemptiveDocManager.decorateResponse("graph.redo", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 3. Scaffolding
        case "entity.create":
        case "graph.createEntity": {
          const { name } = params;
          if (!name) throw new Error("Entity name is required");
          const res = this.astEngine.createEntity(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("entity.create", { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("entity.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "functionality.create":
        case "graph.createFunctionality": {
          const { entityName, name } = params;
          if (!entityName || !name) throw new Error("entityName and name are required");
          const res = this.astEngine.createFunctionality(entityName, name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("functionality.create", { entityName, name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("functionality.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "library.create":
        case "graph.createLibrary": {
          const { name } = params;
          if (!name) throw new Error("Library name is required");
          const res = this.astEngine.createLibrary(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("library.create", { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("library.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "flow.addStep":
        case "graph.addFlowStep": {
          const { entityFilePath, flowName, stepFunctionName } = params;
          const success = this.astEngine.addFlowStep(entityFilePath, flowName, stepFunctionName);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("flow.addStep", { flowName, stepFunctionName, success });
          const decorated = PreemptiveDocManager.decorateResponse("flow.addStep", { success, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "library.listFunctions": {
          const functions = this.astEngine.listGlobalLibraryFunctions();
          return { jsonrpc: "2.0", id, result: { success: true, functions } };
        }
        case "orchestration.addStep": {
          const { entityFilePath, orchestrationName, stepType, targetName, libName } = params;
          const res = this.astEngine.addOrchestrationStep(entityFilePath, orchestrationName, stepType, targetName, libName);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("orchestration.addStep", { orchestrationName, stepType, targetName, ...res });
          return { jsonrpc: "2.0", id, result: { ...res, graph } };
        }
        // 4. Code Mutation & Robust File Reading
        case "file.read": {
          const { filePath } = params;
          let abs = path14.isAbsolute(filePath) ? filePath : path14.resolve(this.projectRoot, filePath);
          if (!fs13.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
          let content = "";
          if (fs13.lstatSync(abs).isDirectory()) {
            const base = path14.basename(abs);
            const candidateTs = path14.join(abs, `${base}.ts`);
            const candidateIndex = path14.join(abs, "index.ts");
            if (fs13.existsSync(candidateTs)) {
              abs = candidateTs;
              content = fs13.readFileSync(candidateTs, "utf-8");
            } else if (fs13.existsSync(candidateIndex)) {
              abs = candidateIndex;
              content = fs13.readFileSync(candidateIndex, "utf-8");
            } else {
              const files = fs13.readdirSync(abs);
              content = `// Directory: ${base}
// Files in directory:
` + files.map((f) => `// - ${f}`).join("\n");
            }
          } else {
            content = fs13.readFileSync(abs, "utf-8");
          }
          const decorated = PreemptiveDocManager.decorateResponse("file.read", { filePath: abs, content });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "file.edit": {
          const { filePath, newContent } = params;
          const abs = path14.resolve(this.projectRoot, filePath);
          fs13.writeFileSync(abs, newContent, "utf-8");
          this.notifyMutation("file.edit", { filePath });
          const decorated = PreemptiveDocManager.decorateResponse("file.edit", { success: true, filePath: abs });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "ui.generate": {
          const { componentTree, componentName, targetFilePath } = params;
          const code = VanJSCodeGenerator.generateCode(componentTree, componentName || "GeneratedView");
          if (targetFilePath) {
            const abs = path14.resolve(this.projectRoot, targetFilePath);
            fs13.mkdirSync(path14.dirname(abs), { recursive: true });
            fs13.writeFileSync(abs, code, "utf-8");
            this.notifyMutation("ui.generate", { targetFilePath });
          }
          const decorated = PreemptiveDocManager.decorateResponse("ui.generate", { code, targetFilePath });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 5. Validation
        case "validate.audit":
        case "validate.runPurityAudit": {
          const summary = this.validator.validateAll();
          const decorated = PreemptiveDocManager.decorateResponse("validate.audit", summary);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 6. Sandboxed Testing
        case "test.executeFunction": {
          const result = await FunctionExecutor.execute(params);
          this.notifyMutation("test.executeFunction", { filePath: params.filePath, success: result.success, durationMs: result.durationMs });
          const decorated = PreemptiveDocManager.decorateResponse("test.executeFunction", result);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 7. Documentation
        case "docs.endpoints": {
          const all = PreemptiveDocManager.getAllEndpoints();
          const decorated = PreemptiveDocManager.decorateResponse("docs.endpoints", all);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method '${method}' not found` }
          };
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32e3, message: err?.message || String(err) }
      };
    }
  }
  notifyMutation(action, params) {
    if (this.onMutationCallback) {
      this.onMutationCallback({ action, params });
    }
  }
};

// ../studio/src/server/StudioServer.ts
var http = __toESM(require("http"), 1);
var fs16 = __toESM(require("fs"), 1);
var path17 = __toESM(require("path"), 1);
var import_ws2 = require("ws");

// ../studio/src/server/StaticFileServer.ts
var fs14 = __toESM(require("fs"), 1);
var path15 = __toESM(require("path"), 1);
var MIME_TYPES = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};
var StaticFileServer = class {
  baseDirs;
  constructor() {
    const base = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    this.baseDirs = [
      path15.join(base, "../ui"),
      path15.join(base, "../../src/ui"),
      path15.join(process.cwd(), "packages/studio/src/ui"),
      path15.join(process.cwd(), "src/ui")
    ];
  }
  serveFile(req, res, relativePath) {
    const cleanPath = path15.normalize(relativePath.replace(/^\/ui\/?/, "")).replace(/^(\.\.[\/\\])+/, "");
    for (const baseDir of this.baseDirs) {
      const fullPath = path15.join(baseDir, cleanPath);
      if (fs14.existsSync(fullPath) && fs14.statSync(fullPath).isFile()) {
        const ext = path15.extname(fullPath).toLowerCase();
        const mime = MIME_TYPES[ext] || "text/plain; charset=utf-8";
        const content = fs14.readFileSync(fullPath);
        res.writeHead(200, {
          "Content-Type": mime,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Length": Buffer.byteLength(content)
        });
        res.end(content);
        return true;
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`File not found: ${cleanPath}`);
    return false;
  }
};

// ../studio/src/server/HttpRouteHandler.ts
var fs15 = __toESM(require("fs"), 1);
var path16 = __toESM(require("path"), 1);
var ROUTE_MAP = {
  "/api/v1/project/create": "project.create",
  "/api/v1/project/load": "project.load",
  "/api/v1/project/graph": "graph.getArchitecture",
  "/api/v1/project/status": "project.getStatus",
  "/api/v1/graph/moveNode": "graph.moveNode",
  "/api/v1/graph/moveMultipleNodes": "graph.moveMultipleNodes",
  "/api/v1/graph/connectNodes": "graph.connectNodes",
  "/api/v1/graph/deleteEdge": "graph.deleteEdge",
  "/api/v1/graph/deleteNode": "graph.deleteNode",
  "/api/v1/graph/alignLayout": "graph.alignLayout",
  "/api/v1/graph/undo": "graph.undo",
  "/api/v1/graph/redo": "graph.redo",
  "/api/v1/entity/create": "entity.create",
  "/api/v1/functionality/create": "functionality.create",
  "/api/v1/library/create": "library.create",
  "/api/v1/flow/addStep": "flow.addStep",
  "/api/v1/file/read": "file.read",
  "/api/v1/file/edit": "file.edit",
  "/api/v1/ui/generate": "ui.generate",
  "/api/v1/validate/audit": "validate.audit",
  "/api/v1/test/execute": "test.executeFunction",
  "/api/v1/docs/endpoints": "docs.endpoints"
};
var HttpRouteHandler = class {
  static async handleApiRequest(req, res, url, router, onGraphUpdate) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        let params = {};
        if (body.trim()) {
          try {
            params = JSON.parse(body);
          } catch (e) {
          }
        }
        const method = ROUTE_MAP[url] || "graph.getArchitecture";
        const rpcRes = await router.handle({
          jsonrpc: "2.0",
          id: "http-req-" + Date.now(),
          method,
          params
        });
        if (rpcRes.error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify(rpcRes.error, null, 2));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(rpcRes.result, null, 2));
          onGraphUpdate();
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
    });
  }
  static getStudioHtml() {
    const base = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    const candidates = [
      path16.join(base, "studio.html"),
      path16.join(base, "../../src/server/studio.html"),
      path16.join(process.cwd(), "packages/studio/src/server/studio.html"),
      path16.join(process.cwd(), "src/server/studio.html")
    ];
    for (const candidate of candidates) {
      if (fs15.existsSync(candidate)) {
        return fs15.readFileSync(candidate, "utf8");
      }
    }
    return `<!DOCTYPE html><html><body><h1>Krnl Studio Error: studio.html not found.</h1></body></html>`;
  }
};

// ../studio/src/server/StudioServer.ts
var StudioServer = class {
  port;
  projectRoot;
  httpServer;
  wss;
  router;
  watcher;
  astEngine;
  staticServer;
  constructor(options = {}) {
    this.port = options.port || 8080;
    const initialRoot = path17.resolve(options.projectRoot || process.cwd());
    const unifiedPath = path17.join(initialRoot, "examples/unified-workspace");
    this.projectRoot = !fs16.existsSync(path17.join(initialRoot, "src/entities")) && fs16.existsSync(unifiedPath) ? unifiedPath : initialRoot;
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);
    this.staticServer = new StaticFileServer();
    this.router = new JsonRpcRouter(this.projectRoot, (mutation) => {
      this.broadcastAgentActivity(mutation);
    });
    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new import_ws2.WebSocketServer({ server: this.httpServer, path: "/studio/ws", perMessageDeflate: false });
    this.wss.on("error", (err) => console.warn("WSS Error:", err));
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      ws.on("error", (err) => console.warn("WS Client Error:", err?.message));
      const graph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: { ...graph, projectRoot: this.projectRoot } }));
      ws.on("message", async (data) => {
        try {
          const req = JSON.parse(data.toString());
          if (req.method === "project.openDirectory" && req.params?.directory) {
            const targetPath = path17.resolve(req.params.directory);
            if (fs16.existsSync(targetPath)) {
              this.projectRoot = targetPath;
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.router.setProjectRoot(this.projectRoot);
              this.watcher.updateRoot(this.projectRoot);
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { success: true, projectRoot: this.projectRoot } }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32001, message: "Directory does not exist: " + targetPath } }));
            }
            return;
          }
          const res = await this.router.handle(req);
          if (ws.readyState === import_ws2.WebSocket.OPEN) ws.send(JSON.stringify(res));
          if (req.method && (req.method.startsWith("graph.") || req.method.startsWith("entity.") || req.method.startsWith("functionality.") || req.method.startsWith("library."))) {
            this.broadcastGraphUpdate();
          }
        } catch (e) {
          if (ws.readyState === import_ws2.WebSocket.OPEN) {
            ws.send(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: " + (e.message || String(e)) } }));
          }
        }
      });
    });
  }
  initFileWatcher() {
    this.watcher.start();
    this.watcher.subscribe(() => this.broadcastGraphUpdate());
  }
  broadcastGraphUpdate() {
    try {
      const graph = this.astEngine.extractArchitectureGraph();
      const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: { ...graph, projectRoot: this.projectRoot } });
      for (const client of this.wss.clients) {
        if (client.readyState === import_ws2.WebSocket.OPEN) client.send(payload);
      }
    } catch (e) {
    }
  }
  broadcastAgentActivity(mutation) {
    try {
      const payload = JSON.stringify({ jsonrpc: "2.0", method: "agent.activity", params: { action: mutation.action, params: mutation.params, timestamp: Date.now() } });
      for (const client of this.wss.clients) {
        if (client.readyState === import_ws2.WebSocket.OPEN) client.send(payload);
      }
    } catch (e) {
    }
  }
  async handleHttpRequest(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = req.url?.split("?")[0] || "/";
    if (url === "/api/graph") {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", payload: graph, projectRoot: this.projectRoot }, null, 2));
      return;
    }
    if (url.startsWith("/ui/")) {
      this.staticServer.serveFile(req, res, url);
      return;
    }
    if (url.startsWith("/api/v1/")) {
      await HttpRouteHandler.handleApiRequest(req, res, url, this.router, () => this.broadcastGraphUpdate());
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HttpRouteHandler.getStudioHtml());
  }
  async start() {
    return new Promise((resolve7) => {
      this.httpServer.listen(this.port, () => {
        console.log(`
\u{1F680} [Krnl Studio] Omni Canvas IDE running at: http://localhost:${this.port}`);
        console.log(`\u{1F4E1} [Krnl Studio] Active Project Root: ${this.projectRoot}`);
        console.log(`\u{1F4E1} [Krnl Studio] REST API Suite available at: http://localhost:${this.port}/api/v1/*`);
        console.log(`\u{1F4E1} [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws
`);
        resolve7();
      });
    });
  }
  async stop() {
    this.watcher.stop();
    return new Promise((resolve7) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve7());
      });
    });
  }
};

// ../studio/src/client/plugins/VanJSRenderPlugin.ts
var import_vanjs_core = __toESM(require("vanjs-core"), 1);
var { div, span, button } = import_vanjs_core.default.tags;

// src/bin/krnl.ts
var args = process.argv.slice(2);
var command = args[0] || "help";
function detectAppEntrypoint(projectRoot) {
  const files = fs17.readdirSync(projectRoot);
  for (const f of files) {
    if (f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "tsup.config.ts") {
      const full = path18.join(projectRoot, f);
      try {
        const text = fs17.readFileSync(full, "utf8");
        if (text.includes("defineApp") || text.includes("@dinilmusick/krnl-core")) {
          return f;
        }
      } catch (e) {
      }
    }
  }
  return null;
}
async function main() {
  switch (command) {
    case "sync": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path18.resolve(process.cwd(), args[1]) : process.cwd();
      console.log("\u{1F4E6} [Krnl Sync] Reconciling package.json from all manifest.json files...");
      const res = KrnlPackageReconciler.reconcile(targetDir, true);
      console.log(`\u2705 Reconciled dependencies from ${res.totalManifests} manifest.json file(s).`);
      if (res.conflicts.length > 0) {
        console.warn("\u26A0\uFE0F Version conflicts detected across manifests:", res.conflicts);
      }
      break;
    }
    case "validate": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path18.resolve(process.cwd(), args[1]) : process.cwd();
      const valid = await runValidate(targetDir);
      process.exit(valid ? 0 : 1);
      break;
    }
    case "generate": {
      const type = args[1];
      const name = args[2];
      const parent = args[3];
      await runGenerate(type, name, parent, process.cwd());
      break;
    }
    case "watch": {
      generateMagneticDeclarations(process.cwd());
      if (args.includes("--watch") || args.includes("-w")) {
        console.log("[Krnl Watch] Continuous watcher enabled.");
        fs17.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
          if (filename && filename.endsWith("manifest.json")) {
            try {
              KrnlPackageReconciler.reconcile(process.cwd(), true);
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      KrnlPackageReconciler.reconcile(projectRoot, true);
      if (appFile) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Found application entrypoint: ${appFile}`);
      }
      if (targetEntity) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building app variant for entity "${targetEntity}"...`);
      } else if (isAll) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building combined multi-entity application...`);
      } else {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building project...`);
      }
      const valid = await runValidate(projectRoot);
      if (!valid) {
        console.error("\u274C Build aborted due to validation errors.");
        process.exit(1);
      }
      generateMagneticDeclarations(projectRoot);
      console.log(`\u2705 [Krnl Build] Compilation completed successfully.`);
      break;
    }
    case "dev": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      KrnlPackageReconciler.reconcile(projectRoot, true);
      if (appFile) {
        console.log(`\u26A1 [Krnl Dev] Booting app configuration from: ${appFile}`);
      }
      if (targetEntity) {
        console.log(`\u26A1 [Krnl Dev] Initializing app variant for entity "${targetEntity}" on port ${port}...`);
      } else if (isAll) {
        console.log(`\u26A1 [Krnl Dev] Initializing combined multi-entity workspace on port ${port}...`);
      } else {
        console.log(`\u26A1 [Krnl Dev] Initializing Krnl Studio visual workspace on port ${port}...`);
      }
      const server = new StudioServer({
        port,
        projectRoot
      });
      generateMagneticDeclarations(server.projectRoot || projectRoot);
      await server.start();
      break;
    }
    case "help":
    default: {
      console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                      Krnl Framework CLI                       \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Usage: krnl <command> [options]

Commands:
  dev               Start Krnl Studio dev server & boot <app_name>.ts entrypoint
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  sync              Reconcile package.json from all co-located manifest.json files
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
  --entity <name>   Target a specific entity app variant to run or build
  --all             Run or build all entities as a combined multi-entity build
  --port <number>   Specify port for Krnl Studio dev server (default: 8080)
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}
main().catch((err) => {
  console.error("\u274C Fatal error:", err);
  process.exit(1);
});
/*! Bundled license information:

long/umd/index.js:
  (**
   * @license
   * Copyright 2009 The Closure Library Authors
   * Copyright 2020 Daniel Wirtz / The long.js Authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * SPDX-License-Identifier: Apache-2.0
   *)
*/
