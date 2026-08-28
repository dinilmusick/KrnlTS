// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  IWorkspaceRuntime,
  Workspace,
  WorkspaceStorageAdapter,
  StorageEndpoint,
  IWorkspaceFS,
  ISyncEngine
} from "./types.js";
import { StorageAdapterFactory } from "./storage_adapters/StorageAdapterFactory.js";
import { WorkspaceFS } from "./WorkspaceFS.js";
import { SyncEngine } from "./SyncEngine.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. WORKSPACE RUNTIME CONTAINER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: WorkspaceRuntime
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Complete runtime container orchestrating a Workspace's Primary Storage Adapter,
 *          Replicated Backup Adapters, WorkspaceFS abstraction, and SyncEngine lifecycle.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class WorkspaceRuntime implements IWorkspaceRuntime {
  public workspace: Workspace;
  public primary: WorkspaceStorageAdapter;
  public backups: WorkspaceStorageAdapter[] = [];
  public filesystem: WorkspaceFS;
  public syncEngine: SyncEngine;
  private isInitialized = false;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
    this.primary = StorageAdapterFactory.create(workspace.primaryStorage);

    this.backups = (workspace.backupStorages || []).map(ep => StorageAdapterFactory.create(ep));

    this.syncEngine = new SyncEngine();
    this.filesystem = new WorkspaceFS(this.primary, this.workspace, this.syncEngine);
  }

  public static async create(workspace: Workspace): Promise<WorkspaceRuntime> {
    const runtime = new WorkspaceRuntime(workspace);
    await runtime.initialize();
    return runtime;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. Initialize Primary Storage
    await this.primary.initialize();

    // 2. Initialize Backup Storages
    for (const backup of this.backups) {
      try {
        await backup.initialize();
      } catch (err: any) {
        console.warn(`[WorkspaceRuntime] Backup init warning for '${backup.endpointId}':`, err.message);
      }
    }

    // 3. Initialize Sync Engine
    await this.syncEngine.initialize(this.workspace, this.primary, this.backups);
    this.isInitialized = true;
  }

  public async changePrimary(newPrimaryEndpointId: string): Promise<void> {
    const backupIndex = this.workspace.backupStorages.findIndex(b => b.id === newPrimaryEndpointId);
    if (backupIndex === -1) {
      throw new Error(`[WorkspaceRuntime] Target endpoint not found in backup storages: ${newPrimaryEndpointId}`);
    }

    const newPrimaryEndpoint = this.workspace.backupStorages[backupIndex];
    const oldPrimaryEndpoint = this.workspace.primaryStorage;

    // 1. Instantiate and verify new primary
    const newPrimaryAdapter = StorageAdapterFactory.create(newPrimaryEndpoint);
    await newPrimaryAdapter.initialize();

    // 2. Old primary becomes a backup
    oldPrimaryEndpoint.syncState = "SYNCED";
    this.workspace.backupStorages.splice(backupIndex, 1, oldPrimaryEndpoint);
    this.workspace.primaryStorage = newPrimaryEndpoint;

    // 3. Update runtime references
    this.primary = newPrimaryAdapter;
    this.backups = this.workspace.backupStorages.map(ep => StorageAdapterFactory.create(ep));

    this.filesystem.setPrimary(this.primary);
    this.syncEngine.updateAdapters(this.primary, this.backups);

    // 4. Reconcile backups from new primary
    await this.syncEngine.sync(this.workspace);
  }

  public async addBackup(endpoint: StorageEndpoint): Promise<void> {
    const exists = this.workspace.backupStorages.some(b => b.id === endpoint.id);
    if (!exists) {
      this.workspace.backupStorages.push(endpoint);
      const adapter = StorageAdapterFactory.create(endpoint);
      await adapter.initialize();
      this.backups.push(adapter);
      this.syncEngine.updateAdapters(this.primary, this.backups);

      // Perform initial replication
      await this.syncEngine.sync(this.workspace);
    }
  }

  public async detachStorage(endpointId: string): Promise<void> {
    // Invariant: DETACH != DELETE (removes configuration without destroying remote files)
    const idx = this.workspace.backupStorages.findIndex(b => b.id === endpointId);
    if (idx !== -1) {
      this.workspace.backupStorages.splice(idx, 1);
      const bIdx = this.backups.findIndex(b => b.endpointId === endpointId);
      if (bIdx !== -1) {
        await this.backups[bIdx].disconnect();
        this.backups.splice(bIdx, 1);
      }
      this.syncEngine.updateAdapters(this.primary, this.backups);
    }
  }

  public async dispose(): Promise<void> {
    await this.syncEngine.shutdown();
    await this.primary.disconnect();
    for (const b of this.backups) {
      await b.disconnect();
    }
    this.isInitialized = false;
  }
}
