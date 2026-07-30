// src/krnl/core/K_LIB_Krnl_SubApp_Worker_Host.ts
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var _rpcSeq = 0;
var KrnlSubAppWorkerHost = class _KrnlSubAppWorkerHost {
  prefix;
  _worker;
  _manifest;
  _pending;
  _ready;
  _resolveReady;
  _rejectReady;
  constructor(prefix, worker) {
    this.prefix = prefix;
    this._worker = worker;
    this._manifest = null;
    this._pending = /* @__PURE__ */ new Map();
    this._ready = new Promise((resolve, reject) => {
      this._resolveReady = resolve;
      this._rejectReady = reject;
    });
    this._worker.on("message", (msg) => {
      if (msg.type === "manifest") {
        this._manifest = msg.manifest;
        this._resolveReady();
        return;
      }
      if (msg.type === "result") {
        const pending = this._pending.get(msg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._pending.delete(msg.requestId);
        if (msg.ok) pending.resolve(msg.result);
        else pending.reject(new Error(msg.error || "Worker sub-app error"));
      }
    });
    this._worker.on("error", (err) => {
      console.error(`[SubAppWorkerHost:${prefix}] Worker error:`, err.message || err);
      this._rejectReady(err instanceof Error ? err : new Error(String(err)));
      for (const [id, p] of this._pending) {
        clearTimeout(p.timeoutId);
        p.reject(err);
        this._pending.delete(id);
      }
    });
    this._worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`[SubAppWorkerHost:${prefix}] Worker exited with code ${code}`);
      }
    });
  }
  /**
   * Spawn a worker_thread for the given sub-app config and wait for the manifest.
   */
  static async create(config, timeoutMs = 3e4) {
    const runtimePath = path.resolve(__dirname, "K_LIB_Krnl_SubApp_Worker_Runtime.js");
    const worker = new Worker(runtimePath, {
      workerData: {
        entryPath: config.entryPath ?? "",
        prefix: config.prefix,
        constructorArgs: config.constructorArgs ?? []
      }
    });
    const host = new _KrnlSubAppWorkerHost(config.prefix, worker);
    const timeout = new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`[SubAppWorkerHost:${config.prefix}] Timed out waiting for worker ready signal.`)), timeoutMs)
    );
    await Promise.race([host._ready, timeout]);
    return host;
  }
  /**
   * Call a functionality on the worker-hosted sub-app.
   * This is the primary dispatch path for worker-mode sub-apps.
   * Uses MessagePort IPC — no networking.
   */
  async callInternal(fid, input = {}, timeoutMs = 3e4) {
    const requestId = `wkr_${Date.now()}_${(_rpcSeq++).toString(36)}`;
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._pending.delete(requestId);
        reject(new Error(`[SubAppWorkerHost:${this.prefix}] Call '${fid}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this._pending.set(requestId, { resolve, reject, timeoutId });
      this._worker.postMessage({ type: "call", requestId, fid, input });
    });
  }
  /**
   * Alias so both local entities and worker hosts expose the same dispatch surface.
   */
  async call(fid, input = {}) {
    return this.callInternal(fid, input);
  }
  /**
   * Returns the sub-app manifest obtained from the worker at startup.
   */
  getManifest() {
    return this._manifest;
  }
  /**
   * Terminate the worker thread gracefully.
   */
  async gracefulShutdown() {
    try {
      this._worker.postMessage({ type: "shutdown" });
      await new Promise((resolve) => setTimeout(resolve, 5e3));
    } finally {
      await this._worker.terminate();
    }
  }
};

export {
  KrnlSubAppWorkerHost
};
