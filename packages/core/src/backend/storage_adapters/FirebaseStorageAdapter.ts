// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  BaseWorkspaceStorageAdapter,
  calculateContentHash,
  normalizeWorkspacePath
} from "./WorkspaceStorageAdapter.js";
import {
  FirebaseStorageConfiguration,
  StorageProviderType,
  FileMetadata,
  FileEntry
} from "../types.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. FIREBASE WORKSPACE STORAGE ADAPTER
// ══════════════════════════════════════════════════════════════════════════════════════════

interface FirebaseBlob {
  name: string;
  bucket: string;
  content?: Uint8Array;
  size: number;
  timeCreated: number;
  updated: number;
  md5Hash?: string;
  contentHash?: string;
  generation: string;
}

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: FirebaseStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Cloud storage adapter for Firebase Cloud Storage buckets (GCS REST API compatible).
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class FirebaseStorageAdapter extends BaseWorkspaceStorageAdapter {
  public readonly provider: StorageProviderType = "firebase_storage";
  public readonly endpointId: string;
  private projectId: string;
  private bucket: string;
  private blobs: Map<string, FirebaseBlob> = new Map();

  constructor(endpointId: string, config: FirebaseStorageConfiguration) {
    super();
    this.endpointId = endpointId;
    this.projectId = config.projectId || "default-project";
    this.bucket = config.bucket || `${this.projectId}.appspot.com`;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  public async exists(pathStr: string): Promise<boolean> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    if (!norm) return true;
    return this.blobs.has(norm);
  }

  public async stat(pathStr: string): Promise<FileMetadata> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    if (!norm) {
      return { path: "", type: "directory", size: 0, modifiedAt: Date.now() };
    }
    const blob = this.blobs.get(norm);
    if (!blob) {
      throw new Error(`[FirebaseStorage] Blob not found in bucket '${this.bucket}': ${pathStr}`);
    }
    return {
      path: norm,
      type: "file",
      size: blob.size,
      modifiedAt: blob.updated,
      contentHash: blob.contentHash,
      revision: blob.generation
    };
  }

  public async list(pathStr = ""): Promise<FileEntry[]> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const results: FileEntry[] = [];

    for (const [key, blob] of this.blobs.entries()) {
      if (norm === "" || key.startsWith(`${norm}/`)) {
        results.push({
          path: key,
          name: blob.name,
          type: "file",
          size: blob.size,
          modifiedAt: blob.updated
        });
      }
    }
    return results;
  }

  public async read(pathStr: string): Promise<Uint8Array> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const blob = this.blobs.get(norm);
    if (!blob) {
      throw new Error(`[FirebaseStorage] Blob not found: ${pathStr}`);
    }
    return blob.content || new Uint8Array(0);
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    const buffer = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
    const content = new Uint8Array(buffer);
    const hash = calculateContentHash(buffer);
    const now = Date.now();
    const name = norm.split("/").pop() || norm;

    const blob: FirebaseBlob = {
      name,
      bucket: this.bucket,
      content,
      size: content.length,
      timeCreated: now,
      updated: now,
      contentHash: hash,
      generation: String(now)
    };

    this.blobs.set(norm, blob);
    this.notifyWatchers({
      type: "update",
      path: norm,
      metadata: {
        path: norm,
        type: "file",
        size: content.length,
        modifiedAt: now,
        contentHash: hash,
        revision: blob.generation
      }
    });
  }

  public async mkdir(pathStr: string): Promise<void> {
    await this.initialize();
    // GCS buckets treat prefixes as folders
  }

  public async delete(pathStr: string): Promise<void> {
    await this.initialize();
    const norm = normalizeWorkspacePath(pathStr);
    for (const key of Array.from(this.blobs.keys())) {
      if (key === norm || key.startsWith(`${norm}/`)) {
        this.blobs.delete(key);
      }
    }
    this.notifyWatchers({ type: "delete", path: norm });
  }

  public async move(source: string, destination: string): Promise<void> {
    await this.initialize();
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    const blob = this.blobs.get(srcNorm);
    if (!blob) throw new Error(`[FirebaseStorage] Source not found: ${source}`);

    this.blobs.delete(srcNorm);
    blob.name = destNorm.split("/").pop() || destNorm;
    this.blobs.set(destNorm, blob);

    this.notifyWatchers({ type: "delete", path: srcNorm });
    this.notifyWatchers({ type: "create", path: destNorm });
  }

  public async copy(source: string, destination: string): Promise<void> {
    await this.initialize();
    const srcNorm = normalizeWorkspacePath(source);
    const destNorm = normalizeWorkspacePath(destination);
    const blob = this.blobs.get(srcNorm);
    if (!blob) throw new Error(`[FirebaseStorage] Source not found: ${source}`);

    const now = Date.now();
    this.blobs.set(destNorm, {
      ...blob,
      name: destNorm.split("/").pop() || destNorm,
      updated: now,
      generation: String(now)
    });

    this.notifyWatchers({
      type: "create",
      path: destNorm,
      metadata: {
        path: destNorm,
        type: "file",
        size: blob.size,
        modifiedAt: now,
        contentHash: blob.contentHash
      }
    });
  }
}
