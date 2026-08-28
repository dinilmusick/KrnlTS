// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  ISyncEngine,
  Workspace,
  WorkspaceStorageAdapter,
  StorageEndpoint,
  SyncResult,
  RestoreResult,
  VerificationResult,
  FileMetadata
} from "./types.js";
import { normalizeWorkspacePath } from "./storage_adapters/WorkspaceStorageAdapter.js";
import { StorageAdapterFactory } from "./storage_adapters/StorageAdapterFactory.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. HIGH-RELIABILITY MULTI-CLOUD SYNC ENGINE
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: SyncEngine
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Replicates Primary Storage mutations to 0..N Backup Storage Adapters, executes
 *          hash/revision conflict resolution, automated retry queues, and explicit restore.
 *
 * Comparison Priority:
 *   contentHash (SHA-256) ──► revision ──► modifiedAt ──► size
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class SyncEngine implements ISyncEngine {
  private workspace!: Workspace;
  private primary!: WorkspaceStorageAdapter;
  private backups: Map<string, WorkspaceStorageAdapter> = new Map();
  private intervalTimer: any = null;
  private isPaused = false;
  private retryQueue: Map<string, { endpointId: string; path: string; attempts: number }> = new Map();

  public async initialize(
    workspace: Workspace,
    primary: WorkspaceStorageAdapter,
    backups: WorkspaceStorageAdapter[]
  ): Promise<void> {
    this.workspace = workspace;
    this.primary = primary;
    this.backups.clear();
    for (const b of backups) {
      this.backups.set(b.endpointId, b);
    }

    // Schedule interval synchronization if mode is "interval"
    if (this.workspace.sync?.enabled && this.workspace.sync.mode === "interval") {
      const intervalMs = this.workspace.sync.intervalMs || 60000;
      this.intervalTimer = setInterval(() => {
        if (!this.isPaused) {
          this.sync(this.workspace).catch(err => {
            console.warn("[SyncEngine] Interval sync error:", err.message);
          });
        }
      }, intervalMs);
    }
  }

  public updateAdapters(primary: WorkspaceStorageAdapter, backups: WorkspaceStorageAdapter[]): void {
    this.primary = primary;
    this.backups.clear();
    for (const b of backups) {
      this.backups.set(b.endpointId, b);
    }
  }

  public async sync(workspace: Workspace): Promise<SyncResult> {
    const startTime = Date.now();
    const syncedFiles: string[] = [];
    const failedEndpoints: Array<{ endpointId: string; error: string }> = [];

    if (!workspace.sync?.enabled) {
      return { ok: true, syncedFiles: [], failedEndpoints: [], timestamp: startTime, durationMs: 0 };
    }

    try {
      const primaryFiles = await this.primary.list();

      for (const entry of primaryFiles) {
        if (entry.type === "directory") continue;
        const norm = normalizeWorkspacePath(entry.path);
        const result = await this.syncFile(norm);
        if (result.ok) {
          syncedFiles.push(norm);
        } else {
          for (const fe of result.failedEndpoints) {
            failedEndpoints.push(fe);
          }
        }
      }

      // Process any queued retry items
      await this.processRetryQueue();

      return {
        ok: failedEndpoints.length === 0,
        syncedFiles,
        failedEndpoints,
        timestamp: Date.now(),
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        ok: false,
        syncedFiles,
        failedEndpoints: [{ endpointId: "all", error: err.message }],
        timestamp: Date.now(),
        durationMs: Date.now() - startTime
      };
    }
  }

  public async syncFile(pathStr: string): Promise<SyncResult> {
    const startTime = Date.now();
    const norm = normalizeWorkspacePath(pathStr);
    const failedEndpoints: Array<{ endpointId: string; error: string }> = [];
    const syncedFiles: string[] = [];

    const primaryExists = await this.primary.exists(norm);

    for (const [endpointId, backupAdapter] of this.backups.entries()) {
      const endpointConfig = this.workspace.backupStorages.find(b => b.id === endpointId);
      if (endpointConfig && !endpointConfig.enabled) continue;

      try {
        if (primaryExists) {
          const primaryMeta = await this.primary.stat(norm);
          const backupExists = await backupAdapter.exists(norm);

          let needsSync = true;
          if (backupExists) {
            const backupMeta = await backupAdapter.stat(norm);
            // Comparison Priority: contentHash -> revision -> modifiedAt -> size
            if (primaryMeta.contentHash && backupMeta.contentHash) {
              needsSync = primaryMeta.contentHash !== backupMeta.contentHash;
            } else if (primaryMeta.revision && backupMeta.revision) {
              needsSync = primaryMeta.revision !== backupMeta.revision;
            } else {
              needsSync = primaryMeta.modifiedAt !== backupMeta.modifiedAt || primaryMeta.size !== backupMeta.size;
            }
          }

          if (needsSync) {
            const data = await this.primary.read(norm);
            await backupAdapter.write(norm, data);
            syncedFiles.push(norm);
          }

          if (endpointConfig) {
            endpointConfig.syncState = "SYNCED";
            endpointConfig.lastSyncAt = Date.now();
          }
        } else {
          // Primary file was deleted
          if (this.workspace.sync?.deletePropagation) {
            const backupExists = await backupAdapter.exists(norm);
            if (backupExists) {
              await backupAdapter.delete(norm);
              syncedFiles.push(norm);
            }
          }
          if (endpointConfig) {
            endpointConfig.syncState = "SYNCED";
            endpointConfig.lastSyncAt = Date.now();
          }
        }
      } catch (err: any) {
        if (endpointConfig) {
          endpointConfig.syncState = "OUT_OF_SYNC";
          endpointConfig.errorMessage = err.message;
        }
        failedEndpoints.push({ endpointId, error: err.message });
        // Enqueue for background retry
        this.enqueueRetry(endpointId, norm);
      }
    }

    return {
      ok: failedEndpoints.length === 0,
      syncedFiles,
      failedEndpoints,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime
    };
  }

  private enqueueRetry(endpointId: string, pathStr: string): void {
    const key = `${endpointId}::${pathStr}`;
    const existing = this.retryQueue.get(key) || { endpointId, path: pathStr, attempts: 0 };
    existing.attempts += 1;
    this.retryQueue.set(key, existing);
  }

  private async processRetryQueue(): Promise<void> {
    const maxAttempts = this.workspace.sync?.retry?.maxAttempts || 3;
    for (const [key, item] of this.retryQueue.entries()) {
      if (item.attempts > maxAttempts) {
        this.retryQueue.delete(key);
        continue;
      }
      const adapter = this.backups.get(item.endpointId);
      if (!adapter) {
        this.retryQueue.delete(key);
        continue;
      }
      try {
        const primaryExists = await this.primary.exists(item.path);
        if (primaryExists) {
          const data = await this.primary.read(item.path);
          await adapter.write(item.path, data);
        }
        this.retryQueue.delete(key);
        const ep = this.workspace.backupStorages.find(b => b.id === item.endpointId);
        if (ep) {
          ep.syncState = "SYNCED";
          ep.lastSyncAt = Date.now();
        }
      } catch {
        // Will retry on next cycle
      }
    }
  }

  public async restore(backupEndpoint: StorageEndpoint): Promise<RestoreResult> {
    try {
      const backupAdapter = StorageAdapterFactory.create(backupEndpoint);
      await backupAdapter.initialize();
      const files = await backupAdapter.list();
      let count = 0;

      for (const entry of files) {
        if (entry.type === "directory") {
          await this.primary.mkdir(entry.path);
        } else {
          const data = await backupAdapter.read(entry.path);
          await this.primary.write(entry.path, data);
          count++;
        }
      }

      // Reconcile other backups
      await this.sync(this.workspace);

      return {
        ok: true,
        restoredFromEndpointId: backupEndpoint.id,
        filesRestoredCount: count,
        timestamp: Date.now()
      };
    } catch (err: any) {
      return {
        ok: false,
        restoredFromEndpointId: backupEndpoint.id,
        filesRestoredCount: 0,
        timestamp: Date.now(),
        errorMessage: err.message
      };
    }
  }

  public async verify(workspace: Workspace): Promise<VerificationResult> {
    const primaryFiles = await this.primary.list();
    let total = 0;
    let matched = 0;
    const divergentFiles: Array<{ path: string; primaryHash?: string; backupHashes: Record<string, string> }> = [];

    for (const entry of primaryFiles) {
      if (entry.type === "directory") continue;
      total++;
      const norm = normalizeWorkspacePath(entry.path);
      const primaryStat = await this.primary.stat(norm);
      let allMatch = true;
      const backupHashes: Record<string, string> = {};

      for (const [endpointId, backupAdapter] of this.backups.entries()) {
        try {
          const bStat = await backupAdapter.stat(norm);
          backupHashes[endpointId] = bStat.contentHash || "";
          if (bStat.contentHash !== primaryStat.contentHash) {
            allMatch = false;
          }
        } catch {
          allMatch = false;
          backupHashes[endpointId] = "MISSING";
        }
      }

      if (allMatch) {
        matched++;
      } else {
        divergentFiles.push({
          path: norm,
          primaryHash: primaryStat.contentHash,
          backupHashes
        });
      }
    }

    return {
      ok: divergentFiles.length === 0,
      totalFiles: total,
      matchedFiles: matched,
      divergentFiles,
      timestamp: Date.now()
    };
  }

  public async pause(): Promise<void> {
    this.isPaused = true;
  }

  public async resume(): Promise<void> {
    this.isPaused = false;
  }

  public async shutdown(): Promise<void> {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isPaused = true;
    this.retryQueue.clear();
  }
}
