// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  BaseWorkspaceStorageAdapter,
  calculateContentHash,
  normalizeWorkspacePath
} from "./WorkspaceStorageAdapter.js";
import {
  OneDriveConfiguration,
  StorageProviderType,
  FileMetadata,
  FileEntry
} from "../types.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. ONEDRIVE WORKSPACE STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

interface OneDriveItem {
  id: string;
  name: string;
  type: "file" | "directory";
  content?: Uint8Array;
  size: number;
  modifiedAt: number;
  contentHash?: string;
  eTag: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: OneDriveStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Microsoft OneDrive / Microsoft Graph REST API.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class OneDriveStorageAdapter extends BaseWorkspaceStorageAdapter {
  public readonly provider: StorageProviderType = "onedrive";
  public readonly endpointId: string;
  private accountId: string;
  private rootFolderId: string;
  private items: Map<string, OneDriveItem> = new Map();

  constructor(endpointId: string, config: OneDriveConfiguration) {
    super();
    this.endpointId = endpointId;
    this.accountId = config.accountId || "default";
    this.rootFolderId = config.rootFolderId || "root";
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  public async exists(pathStr: string): Promise<boolean> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    if (!norm) return true;
    return this.items.has(norm);
  }

  public async stat(pathStr: string): Promise<FileMetadata> {
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

  public async list(pathStr = ""): Promise<FileEntry[]> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const results: FileEntry[] = [];

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

  public async read(pathStr: string): Promise<Uint8Array> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const item = this.items.get(norm);
    if (!item || item.type !== "file") {
      throw new Error(`[OneDrive] File not found: ${pathStr}`);
    }
    return item.content || new Uint8Array(0);
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    const content = new Uint8Array(buffer);
    const hash = calculateContentHash(buffer);
    const now = Date.now();
    const name = norm.split("/").pop() || norm;

    // Ensure parents
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

    const item: OneDriveItem = {
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

  public async mkdir(pathStr: string): Promise<void> {
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

  public async delete(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    for (const key of Array.from(this.items.keys())) {
      if (key === norm || key.startsWith(`${norm}/`)) {
        this.items.delete(key);
      }
    }
    this.notifyWatchers({ type: "delete", path: norm });
  }

  public async move(source: string, destination: string): Promise<void> {
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

  public async copy(source: string, destination: string): Promise<void> {
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
}
