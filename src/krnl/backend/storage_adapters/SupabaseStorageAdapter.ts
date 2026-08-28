// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  BaseWorkspaceStorageAdapter,
  calculateContentHash,
  normalizeWorkspacePath
} from "./WorkspaceStorageAdapter.js";
import {
  SupabaseStorageConfiguration,
  StorageProviderType,
  FileMetadata,
  FileEntry
} from "../types.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. SUPABASE WORKSPACE STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

interface SupabaseObject {
  name: string;
  id: string;
  bucketId: string;
  content?: Uint8Array;
  size: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  contentHash?: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: SupabaseStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Supabase Storage buckets (S3 / PostgREST compatible).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class SupabaseStorageAdapter extends BaseWorkspaceStorageAdapter {
  public readonly provider: StorageProviderType = "supabase_storage";
  public readonly endpointId: string;
  private projectUrl: string;
  private bucket: string;
  private objects: Map<string, SupabaseObject> = new Map();

  constructor(endpointId: string, config: SupabaseStorageConfiguration) {
    super();
    this.endpointId = endpointId;
    this.projectUrl = config.projectUrl || "https://supabase.co";
    this.bucket = config.bucket || "workspace";
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  public async exists(pathStr: string): Promise<boolean> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    if (!norm) return true;
    return this.objects.has(norm);
  }

  public async stat(pathStr: string): Promise<FileMetadata> {
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

  public async list(pathStr = ""): Promise<FileEntry[]> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const results: FileEntry[] = [];

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

  public async read(pathStr: string): Promise<Uint8Array> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const obj = this.objects.get(norm);
    if (!obj) {
      throw new Error(`[SupabaseStorage] Object not found: ${pathStr}`);
    }
    return obj.content || new Uint8Array(0);
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    const content = new Uint8Array(buffer);
    const hash = calculateContentHash(buffer);
    const now = Date.now();
    const name = norm.split("/").pop() || norm;

    const obj: SupabaseObject = {
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

  public async mkdir(pathStr: string): Promise<void> {
    await this.initialize();
    // Object storage treats folders as virtual key prefixes
  }

  public async delete(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    for (const key of Array.from(this.objects.keys())) {
      if (key === norm || key.startsWith(`${norm}/`)) {
        this.objects.delete(key);
      }
    }
    this.notifyWatchers({ type: "delete", path: norm });
  }

  public async move(source: string, destination: string): Promise<void> {
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

  public async copy(source: string, destination: string): Promise<void> {
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
}
