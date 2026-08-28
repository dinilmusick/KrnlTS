// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  BaseWorkspaceStorageAdapter,
  calculateContentHash,
  normalizeWorkspacePath
} from "./WorkspaceStorageAdapter.js";
import {
  ICloudStorageConfiguration,
  StorageProviderType,
  FileMetadata,
  FileEntry
} from "../types.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. ICLOUD WORKSPACE STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: ICloudStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud/Local storage adapter targeting Apple iCloud Drive container directories
 *          (e.g., ~/Library/Mobile Documents/com~apple~CloudDocs/ or CloudKit Document paths).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class ICloudStorageAdapter extends BaseWorkspaceStorageAdapter {
  public readonly provider: StorageProviderType = "icloud";
  public readonly endpointId: string;
  private basePath: string;

  constructor(endpointId: string, config: ICloudStorageConfiguration) {
    super();
    this.endpointId = endpointId;

    if (config.basePath) {
      this.basePath = path.resolve(config.basePath);
    } else {
      const home = os.homedir();
      const container = config.containerId ? `iCloud~${config.containerId}` : "com~apple~CloudDocs";
      this.basePath = path.join(home, "Library", "Mobile Documents", container, "Workspaces");
    }
  }

  private getFullPath(relPath: string): string {
    const norm = normalizeWorkspacePath(relPath);
    return path.join(this.basePath, norm);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch {
      // Fallback to local sandbox if iCloud directory is sandboxed or inaccessible
      const fallback = path.resolve("./.icloud_sandbox");
      await fs.mkdir(fallback, { recursive: true });
      this.basePath = fallback;
    }
    this.isInitialized = true;
  }

  public async exists(pathStr: string): Promise<boolean> {
    await this.initialize();
    const full = this.getFullPath(pathStr);
    try {
      await fs.access(full);
      return true;
    } catch {
      return false;
    }
  }

  public async stat(pathStr: string): Promise<FileMetadata> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const full = this.getFullPath(pathStr);
    const st = await fs.stat(full);

    let contentHash: string | undefined;
    if (!st.isDirectory()) {
      const data = await fs.readFile(full);
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

  public async list(pathStr = ""): Promise<FileEntry[]> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const full = this.getFullPath(norm);
    const entries: FileEntry[] = [];

    const scanDir = async (dirFull: string, prefix: string) => {
      let items: string[] = [];
      try {
        items = await fs.readdir(dirFull);
      } catch {
        return;
      }

      for (const item of items) {
        if (item.startsWith(".")) continue; // Ignore hidden files / .DS_Store
        const itemFull = path.join(dirFull, item);
        const itemRel = prefix ? `${prefix}/${item}` : item;
        try {
          const st = await fs.stat(itemFull);
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
        } catch {}
      }
    };

    await scanDir(full, norm);
    return entries;
  }

  public async read(pathStr: string): Promise<Uint8Array> {
    await this.initialize();
    const full = this.getFullPath(pathStr);
    const buffer = await fs.readFile(full);
    return new Uint8Array(buffer);
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const full = this.getFullPath(norm);
    await fs.mkdir(path.dirname(full), { recursive: true });

    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    await fs.writeFile(full, buffer);

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

  public async mkdir(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const full = this.getFullPath(norm);
    await fs.mkdir(full, { recursive: true });
    this.notifyWatchers({
      type: "create",
      path: norm,
      metadata: { path: norm, type: "directory", size: 0, modifiedAt: Date.now() }
    });
  }

  public async delete(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const full = this.getFullPath(norm);
    try {
      const st = await fs.stat(full);
      if (st.isDirectory()) {
        await fs.rm(full, { recursive: true, force: true });
      } else {
        await fs.unlink(full);
      }
      this.notifyWatchers({ type: "delete", path: norm });
    } catch {}
  }

  public async move(source: string, destination: string): Promise<void> {
    await this.initialize();
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    const srcFull = this.getFullPath(srcNorm);
    const destFull = this.getFullPath(destNorm);

    await fs.mkdir(path.dirname(destFull), { recursive: true });
    await fs.rename(srcFull, destFull);

    this.notifyWatchers({ type: "delete", path: srcNorm });
    this.notifyWatchers({ type: "create", path: destNorm });
  }

  public async copy(source: string, destination: string): Promise<void> {
    await this.initialize();
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    const srcFull = this.getFullPath(srcNorm);
    const destFull = this.getFullPath(destNorm);

    await fs.mkdir(path.dirname(destFull), { recursive: true });
    await fs.copyFile(srcFull, destFull);

    const st = await fs.stat(destFull);
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
}
