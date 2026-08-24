/**
 * @file WorkspaceBackendFactory.ts
 * @description Factory resolving decoupled Data Providers and Storage Providers for any storage mode.
 */

import {
  BackendConnectionConfig,
  IWorkspaceBackend,
  IWorkspaceDataProvider,
  IStorageProvider,
  StorageMode,
  DatabaseProviderConfig,
  StorageProviderConfig
} from "./types.js";
import { SQLiteDataProvider } from "./providers/data/SQLiteDataProvider.js";
import { PostgresDataProvider } from "./providers/data/PostgresDataProvider.js";
import { SupabaseDataProvider } from "./providers/data/SupabaseDataProvider.js";
import { PocketBaseDataProvider } from "./providers/data/PocketBaseDataProvider.js";
import { FirebaseDataProvider } from "./providers/data/FirebaseDataProvider.js";
import { FilesystemStorageProvider } from "./providers/storage/FilesystemStorageProvider.js";
import { SupabaseStorageProvider } from "./providers/storage/SupabaseStorageProvider.js";
import { S3StorageProvider } from "./providers/storage/S3StorageProvider.js";
import { PocketBaseStorageProvider } from "./providers/storage/PocketBaseStorageProvider.js";
import { FirebaseStorageProvider } from "./providers/storage/FirebaseStorageProvider.js";

export class WorkspaceBackendFactory {
  static create(config: BackendConnectionConfig): IWorkspaceBackend {
    const dataProvider = WorkspaceBackendFactory.resolveDataProvider(config);
    const storageProvider = WorkspaceBackendFactory.resolveStorageProvider(config);

    return {
      id: config.id,
      mode: config.mode,
      data: dataProvider,
      storage: storageProvider,
      async initialize(): Promise<void> {
        await dataProvider.connect();
      },
      async dispose(): Promise<void> {
        await dataProvider.disconnect();
      }
    };
  }

  static createLocal(filePath = "./workspace.sqlite", storagePath = "./storage"): IWorkspaceBackend {
    return WorkspaceBackendFactory.create({
      id: "local-workspace",
      provider: "sqlite",
      mode: "local",
      database: { type: "sqlite", filePath, enableWAL: true },
      storage: { type: "filesystem", basePath: storagePath }
    });
  }

  static resolveDataProvider(config: BackendConnectionConfig): IWorkspaceDataProvider {
    const dbConfig: DatabaseProviderConfig = config.database || { type: config.provider as any };

    switch (dbConfig.type) {
      case "sqlite":
        return new SQLiteDataProvider(dbConfig);
      case "postgres":
        return new PostgresDataProvider(dbConfig);
      case "supabase":
        return new SupabaseDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          apiKey: dbConfig.apiKey || config.auth?.apiKey
        });
      case "pocketbase":
        return new PocketBaseDataProvider({
          ...dbConfig,
          endpoint: dbConfig.endpoint || config.endpoint,
          apiKey: dbConfig.apiKey || config.auth?.token
        });
      case "firebase":
        return new FirebaseDataProvider({
          ...dbConfig,
          apiKey: dbConfig.apiKey || config.auth?.apiKey
        });
      default:
        return new SQLiteDataProvider("./workspace.sqlite");
    }
  }

  static resolveStorageProvider(config: BackendConnectionConfig): IStorageProvider {
    const storageConfig: StorageProviderConfig = config.storage || { type: "filesystem" };

    switch (storageConfig.type) {
      case "filesystem":
        return new FilesystemStorageProvider(storageConfig);
      case "supabase_storage":
        return new SupabaseStorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint,
          apiKey: storageConfig.apiKey || config.auth?.apiKey
        });
      case "s3":
        return new S3StorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint
        });
      case "pocketbase_storage":
        return new PocketBaseStorageProvider({
          ...storageConfig,
          endpoint: storageConfig.endpoint || config.endpoint
        });
      case "firebase_storage":
        return new FirebaseStorageProvider({
          ...storageConfig,
          apiKey: storageConfig.apiKey || config.auth?.apiKey
        });
      default:
        return new FilesystemStorageProvider("./storage");
    }
  }
}
