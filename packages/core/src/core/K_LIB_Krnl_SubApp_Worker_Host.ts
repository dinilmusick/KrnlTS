//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Krnl_SubApp_Worker_Host.ts
 *
 * @description Parent-process proxy for a sub-app running in an isolated worker_thread.
 *
 * KrnlSubAppWorkerHost wraps a Node.js worker_thread and exposes the same call interface
 * as a local sub-app entity, so the parent's routing code works transparently regardless
 * of which execution mode was chosen.
 *
 * Communication uses worker_threads MessagePort exclusively.
 * No HTTP · No WebSocket · No TCP · No port binding.
 *
 * Wire protocol (MessagePort messages):
 *
 *   Parent → Worker:
 *     { type: 'call',     requestId: string, fid: string, input: any }
 *     { type: 'shutdown'                                              }
 *
 *   Worker → Parent:
 *     { type: 'result',   requestId: string, ok: boolean, result?: any, error?: string }
 *     { type: 'manifest', manifest: any }   // sent once at startup
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import type { KrnlSubAppConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let _rpcSeq = 0;

export class KrnlSubAppWorkerHost {
  prefix:      string;
  _worker:     Worker;
  _manifest:   any;
  _pending:    Map<string, { resolve: Function; reject: Function; timeoutId: ReturnType<typeof setTimeout> }>;
  _ready:      Promise<void>;
  _resolveReady!: () => void;
  _rejectReady!:  (err: Error) => void;

  private constructor(prefix: string, worker: Worker) {
    this.prefix   = prefix;
    this._worker  = worker;
    this._manifest = null;
    this._pending  = new Map();

    this._ready = new Promise<void>((resolve, reject) => {
      this._resolveReady = resolve;
      this._rejectReady  = reject;
    });

    // Wire message handler
    this._worker.on('message', (msg: any) => {
      if (msg.type === 'manifest') {
        this._manifest = msg.manifest;
        this._resolveReady();
        return;
      }
      if (msg.type === 'result') {
        const pending = this._pending.get(msg.requestId);
        if (!pending) return;
        clearTimeout(pending.timeoutId);
        this._pending.delete(msg.requestId);
        if (msg.ok) pending.resolve(msg.result);
        else         pending.reject(new Error(msg.error || 'Worker sub-app error'));
      }
    });

    this._worker.on('error', (err: any) => {
      console.error(`[SubAppWorkerHost:${prefix}] Worker error:`, err.message || err);
      this._rejectReady(err instanceof Error ? err : new Error(String(err)));
      // Reject all pending calls
      for (const [id, p] of this._pending) {
        clearTimeout(p.timeoutId);
        p.reject(err);
        this._pending.delete(id);
      }
    });

    this._worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[SubAppWorkerHost:${prefix}] Worker exited with code ${code}`);
      }
    });
  }

  /**
   * Spawn a worker_thread for the given sub-app config and wait for the manifest.
   */
  static async create(config: KrnlSubAppConfig, timeoutMs = 30_000): Promise<KrnlSubAppWorkerHost> {
    // Resolve the compiled worker runtime path (TypeScript → JS output)
    const runtimePath = path.resolve(__dirname, 'K_LIB_Krnl_SubApp_Worker_Runtime.js');

    const worker = new Worker(runtimePath, {
      workerData: {
        entryPath:       config.entryPath ?? '',
        prefix:          config.prefix,
        constructorArgs: config.constructorArgs ?? [],
      },
    });

    const host = new KrnlSubAppWorkerHost(config.prefix, worker);

    // Wait for manifest (signals the worker is ready)
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[SubAppWorkerHost:${config.prefix}] Timed out waiting for worker ready signal.`)), timeoutMs)
    );

    await Promise.race([host._ready, timeout]);
    return host;
  }

  /**
   * Call a functionality on the worker-hosted sub-app.
   * This is the primary dispatch path for worker-mode sub-apps.
   * Uses MessagePort IPC — no networking.
   */
  async callInternal(fid: string, input: any = {}, timeoutMs = 30_000): Promise<any> {
    const requestId = `wkr_${Date.now()}_${(_rpcSeq++).toString(36)}`;

    return new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this._pending.delete(requestId);
        reject(new Error(`[SubAppWorkerHost:${this.prefix}] Call '${fid}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this._pending.set(requestId, { resolve, reject, timeoutId });
      this._worker.postMessage({ type: 'call', requestId, fid, input });
    });
  }

  /**
   * Alias so both local entities and worker hosts expose the same dispatch surface.
   */
  async call(fid: string, input: any = {}): Promise<any> {
    return this.callInternal(fid, input);
  }

  /**
   * Returns the sub-app manifest obtained from the worker at startup.
   */
  getManifest(): any {
    return this._manifest;
  }

  /**
   * Terminate the worker thread gracefully.
   */
  async gracefulShutdown(): Promise<void> {
    try {
      this._worker.postMessage({ type: 'shutdown' });
      // Give the worker 5 seconds to clean up before forcing termination
      await new Promise<void>((resolve) => setTimeout(resolve, 5000));
    } finally {
      await this._worker.terminate();
    }
  }
}
