// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  WorkspaceStorageAdapter,
  StorageProviderType,
  FileMetadata,
  FileEntry,
  FileChangeCallback,
  Unsubscribe
} from "../types.js";
import crypto from "crypto";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. HELPER UTILITIES: CHECKSUM & PATH NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════════════════════

export function calculateContentHash(data: Uint8Array | Buffer | string): string {
  const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function normalizeWorkspacePath(pathStr: string): string {
  if (!pathStr || pathStr === "." || pathStr === "/") return "";
  let clean = pathStr.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  // Collapse double slashes
  clean = clean.replace(/\/+/g, "/");
  return clean;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. BASE ABSTRACT STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: BaseWorkspaceStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Abstract base implementing common event subscription, validation, and metadata logic.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export abstract class BaseWorkspaceStorageAdapter implements WorkspaceStorageAdapter {
  public abstract readonly provider: StorageProviderType;
  public abstract readonly endpointId: string;

  protected watchers: Map<string, Set<FileChangeCallback>> = new Map();
  protected isInitialized = false;

  public abstract initialize(): Promise<void>;
  public abstract exists(pathStr: string): Promise<boolean>;
  public abstract stat(pathStr: string): Promise<FileMetadata>;
  public abstract list(pathStr?: string): Promise<FileEntry[]>;
  public abstract read(pathStr: string): Promise<Uint8Array>;
  public abstract write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
  public abstract mkdir(pathStr: string): Promise<void>;
  public abstract delete(pathStr: string): Promise<void>;
  public abstract move(source: string, destination: string): Promise<void>;
  public abstract copy(source: string, destination: string): Promise<void>;

  public watch(pathStr: string, callback: FileChangeCallback): Unsubscribe {
    const norm = normalizeWorkspacePath(pathStr);
    if (!this.watchers.has(norm)) {
      this.watchers.set(norm, new Set());
    }
    this.watchers.get(norm)!.add(callback);

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

  protected notifyWatchers(event: { type: "create" | "update" | "delete"; path: string; metadata?: FileMetadata }): void {
    const norm = normalizeWorkspacePath(event.path);
    // Direct path watchers
    const directSet = this.watchers.get(norm);
    if (directSet) {
      for (const cb of directSet) {
        try { cb(event); } catch {}
      }
    }
    // Root / wildcard watchers
    const rootSet = this.watchers.get("");
    if (rootSet && norm !== "") {
      for (const cb of rootSet) {
        try { cb(event); } catch {}
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.watchers.clear();
    this.isInitialized = false;
  }
}
