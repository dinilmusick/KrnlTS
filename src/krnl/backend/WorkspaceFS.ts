// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  IWorkspaceFS,
  WorkspaceStorageAdapter,
  FileMetadata,
  FileEntry,
  ISyncEngine,
  Workspace
} from "./types.js";
import { normalizeWorkspacePath } from "./storage_adapters/WorkspaceStorageAdapter.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. PROVIDER-INDEPENDENT WORKSPACE FILESYSTEM (WorkspaceFS)
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: WorkspaceFS
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provider-independent filesystem operating strictly on the Primary Storage Adapter
 *          and coordinating with SyncEngine for asynchronous backup replication.
 *
 * Write Flow Chart:
 *   [Application Write] ──► [WorkspaceFS.write()] ──► [Primary Adapter Write]
 *                                                               │
 *                                                   (Success) ──┴── (Failure)
 *                                                       │               │
 *                                                       ▼               ▼
 *                                            [SyncEngine.syncFile()] [Throw Error]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class WorkspaceFS implements IWorkspaceFS {
  private primary: WorkspaceStorageAdapter;
  private syncEngine?: ISyncEngine;
  private workspace: Workspace;

  constructor(primary: WorkspaceStorageAdapter, workspace: Workspace, syncEngine?: ISyncEngine) {
    this.primary = primary;
    this.workspace = workspace;
    this.syncEngine = syncEngine;
  }

  public setPrimary(newPrimary: WorkspaceStorageAdapter): void {
    this.primary = newPrimary;
  }

  public setSyncEngine(engine: ISyncEngine): void {
    this.syncEngine = engine;
  }

  public async exists(pathStr: string): Promise<boolean> {
    return this.primary.exists(pathStr);
  }

  public async stat(pathStr: string): Promise<FileMetadata> {
    return this.primary.stat(pathStr);
  }

  public async list(pathStr = ""): Promise<FileEntry[]> {
    return this.primary.list(pathStr);
  }

  public async read(pathStr: string): Promise<Uint8Array> {
    return this.primary.read(pathStr);
  }

  public async readText(pathStr: string): Promise<string> {
    const data = await this.read(pathStr);
    return Buffer.from(data).toString("utf8");
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    const norm = normalizeWorkspacePath(pathStr);
    // 1. Primary write is canonical
    await this.primary.write(norm, data);

    // 2. Trigger asynchronous backup replication if configured
    if (this.syncEngine && this.workspace.sync?.enabled && this.workspace.sync.mode === "on_write") {
      this.syncEngine.syncFile(norm).catch(err => {
        console.warn(`[WorkspaceFS] Async backup sync warning for '${norm}':`, err.message);
      });
    }
  }

  public async mkdir(pathStr: string): Promise<void> {
    const norm = normalizeWorkspacePath(pathStr);
    await this.primary.mkdir(norm);
  }

  public async delete(pathStr: string): Promise<void> {
    const norm = normalizeWorkspacePath(pathStr);
    await this.primary.delete(norm);

    if (this.syncEngine && this.workspace.sync?.enabled && this.workspace.sync.deletePropagation) {
      this.syncEngine.syncFile(norm).catch(err => {
        console.warn(`[WorkspaceFS] Async delete sync warning for '${norm}':`, err.message);
      });
    }
  }

  public async move(source: string, destination: string): Promise<void> {
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    await this.primary.move(srcNorm, destNorm);

    if (this.syncEngine && this.workspace.sync?.enabled) {
      this.syncEngine.syncFile(srcNorm).catch(() => {});
      this.syncEngine.syncFile(destNorm).catch(() => {});
    }
  }

  public async copy(source: string, destination: string): Promise<void> {
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    await this.primary.copy(srcNorm, destNorm);

    if (this.syncEngine && this.workspace.sync?.enabled) {
      this.syncEngine.syncFile(destNorm).catch(() => {});
    }
  }
}
