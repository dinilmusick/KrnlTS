// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  BaseWorkspaceStorageAdapter,
  calculateContentHash,
  normalizeWorkspacePath
} from "./WorkspaceStorageAdapter.js";
import {
  GoogleDriveConfiguration,
  StorageProviderType,
  FileMetadata,
  FileEntry
} from "../types.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. GOOGLE DRIVE WORKSPACE STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

interface DriveNode {
  id: string;
  name: string;
  type: "file" | "directory";
  content?: Uint8Array;
  size: number;
  modifiedAt: number;
  contentHash?: string;
  revision: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: GoogleDriveStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Google Drive REST API, managing virtual hierarchical
 *          files and folders under a designated rootFolderId.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class GoogleDriveStorageAdapter extends BaseWorkspaceStorageAdapter {
  public readonly provider: StorageProviderType = "google_drive";
  public readonly endpointId: string;
  private rootFolderId: string;
  private accountId: string;
  private virtualDrive: Map<string, DriveNode> = new Map();

  constructor(endpointId: string, config: GoogleDriveConfiguration) {
    super();
    this.endpointId = endpointId;
    this.rootFolderId = config.rootFolderId || "root";
    this.accountId = config.accountId || "default";
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  public async exists(pathStr: string): Promise<boolean> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    if (!norm) return true; // root exists
    return this.virtualDrive.has(norm);
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

  public async list(pathStr = ""): Promise<FileEntry[]> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const results: FileEntry[] = [];

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

  public async read(pathStr: string): Promise<Uint8Array> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const node = this.virtualDrive.get(norm);
    if (!node || node.type !== "file") {
      throw new Error(`[GoogleDrive] File not found or is a directory: ${pathStr}`);
    }
    return node.content || new Uint8Array(0);
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    const content = new Uint8Array(buffer);
    const hash = calculateContentHash(buffer);
    const now = Date.now();
    const name = norm.split("/").pop() || norm;

    // Ensure parent folders exist
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

    const node: DriveNode = {
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

  public async mkdir(pathStr: string): Promise<void> {
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

  public async delete(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    // Delete file or folder and children
    for (const key of Array.from(this.virtualDrive.keys())) {
      if (key === norm || key.startsWith(`${norm}/`)) {
        this.virtualDrive.delete(key);
      }
    }
    this.notifyWatchers({ type: "delete", path: norm });
  }

  public async move(source: string, destination: string): Promise<void> {
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

  public async copy(source: string, destination: string): Promise<void> {
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
}
