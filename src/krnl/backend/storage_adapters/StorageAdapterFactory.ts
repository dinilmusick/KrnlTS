// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  StorageEndpoint,
  StorageProviderType,
  WorkspaceStorageAdapter
} from "../types.js";
import { LocalStorageAdapter } from "./LocalStorageAdapter.js";
import { GoogleDriveStorageAdapter } from "./GoogleDriveStorageAdapter.js";
import { OneDriveStorageAdapter } from "./OneDriveStorageAdapter.js";
import { SupabaseStorageAdapter } from "./SupabaseStorageAdapter.js";
import { FirebaseStorageAdapter } from "./FirebaseStorageAdapter.js";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. STORAGE ADAPTER FACTORY
// ══════════════════════════════════════════════════════════════════════════════════════════

export type AdapterConstructor = new (endpointId: string, configuration: any) => WorkspaceStorageAdapter;

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * CLASS: StorageAdapterFactory
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Decoupled factory instantiating and caching WorkspaceStorageAdapter instances
 *          for Local, Google Drive, OneDrive, Supabase, and Firebase storage endpoints.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export class StorageAdapterFactory {
  private static registry: Map<string, AdapterConstructor> = new Map();
  private static instanceCache: Map<string, WorkspaceStorageAdapter> = new Map();

  static {
    this.register("local", LocalStorageAdapter as any);
    this.register("google_drive", GoogleDriveStorageAdapter as any);
    this.register("onedrive", OneDriveStorageAdapter as any);
    this.register("supabase_storage", SupabaseStorageAdapter as any);
    this.register("firebase_storage", FirebaseStorageAdapter as any);
    this.register("s3", SupabaseStorageAdapter as any); // S3 compatible
  }

  public static register(provider: string, adapterClass: AdapterConstructor): void {
    this.registry.set(provider, adapterClass);
  }

  public static create(endpoint: StorageEndpoint): WorkspaceStorageAdapter {
    const cacheKey = `${endpoint.id}::${endpoint.provider}`;
    if (this.instanceCache.has(cacheKey)) {
      return this.instanceCache.get(cacheKey)!;
    }

    const AdapterClass = this.registry.get(endpoint.provider);
    if (!AdapterClass) {
      throw new Error(`[StorageAdapterFactory] Unsupported storage provider: '${endpoint.provider}'`);
    }

    const adapter = new AdapterClass(endpoint.id, endpoint.configuration);
    this.instanceCache.set(cacheKey, adapter);
    return adapter;
  }

  public static clearCache(): void {
    this.instanceCache.clear();
  }
}
