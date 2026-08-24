---
name: backend-provider-interfaces
description: Abstract provider interfaces for Decoupled Data Providers and Storage Providers, normalized connection schemas, and runtime adapter patterns.
---

# DECOUPLED DATA & STORAGE PROVIDER INTERFACES

The application must **never** scatter vendor-specific SDK calls across business logic. All database and file operations flow through decoupled provider abstractions.

---

## 1. Provider Decoupling Principle

$$\text{WorkspaceBackend} = \text{DataProvider (Structured Records)} \oplus \text{StorageProvider (Binary Blobs/Media)}$$

```
WORKSPACE BACKEND
│
├── DATA PROVIDER     → SQLite | PostgreSQL | Supabase DB | PocketBase
│
└── STORAGE PROVIDER  → Local Filesystem | Supabase Storage | AWS S3 | Cloudflare R2 | MinIO
```

---

## 2. Conceptual TypeScript Interfaces

```typescript
/**
 * 1. ACCOUNT PROVIDER (Control Plane)
 */
export interface IAccountProvider {
  getUser(userId: string): Promise<UserProfile | null>;
  authenticate(credentials: AuthCredentials): Promise<AuthSession>;
  verifySession(token: string | null): Promise<AuthSession | null>;
  listWorkspaces(userId: string): Promise<WorkspaceDescriptor[]>;
  createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor>;
}

/**
 * 2. WORKSPACE DATA PROVIDER (Structured/Relational Data Plane)
 */
export interface IWorkspaceDataProvider {
  readonly engine: "sqlite" | "postgres" | "supabase" | "pocketbase" | "custom";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number }>;
  query<T = any>(queryStr: string, params?: any[]): Promise<T[]>;
  execute(commandStr: string, params?: any[]): Promise<{ affectedRows: number; lastInsertId?: string | number }>;
  transaction<T>(fn: (tx: IWorkspaceDataProvider) => Promise<T>): Promise<T>;
}

/**
 * 3. STORAGE PROVIDER (Large Binary Files/Media)
 */
export interface IStorageProvider {
  readonly driver: "filesystem" | "s3" | "supabase_storage" | "minio";
  uploadFile(path: string, content: Buffer | Uint8Array | ReadableStream, mimeType: string): Promise<{ url: string; size: number }>;
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<boolean>;
  getPublicUrl(path: string): string;
  listFiles(prefix?: string): Promise<Array<{ path: string; size: number; updatedAt: number }>>;
}

/**
 * 4. WORKSPACE BACKEND AGGREGATE
 */
export interface IWorkspaceBackend {
  readonly id: string;
  readonly mode: "local" | "local_hosted" | "remote";
  readonly data: IWorkspaceDataProvider;
  readonly storage: IStorageProvider;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
```

---

## 3. Normalized Backend Connection Configuration

```typescript
export interface BackendConnectionConfig {
  id: string;
  name: string;
  provider: "filesystem" | "sqlite" | "postgres" | "supabase" | "pocketbase" | "custom";
  mode: "local" | "local_hosted" | "remote";
  endpoint?: string;
  
  // Database sub-provider configuration
  database?: {
    type: "sqlite" | "postgres" | "supabase";
    filePath?: string;            // For SQLite, e.g. "./data/workspace.db"
    connectionString?: string;    // Postgres URI
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    poolSize?: number;
  };

  // Storage sub-provider configuration
  storage?: {
    type: "filesystem" | "s3" | "supabase_storage";
    basePath?: string;            // For Filesystem, e.g. "./data/storage"
    bucket?: string;              // For S3/Supabase Storage
    region?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;            // For custom S3 / MinIO
  };

  // Authentication configuration
  auth?: {
    jwtSecret?: string;
    apiKey?: string;
    token?: string;
  };
}
```

---

## 4. Factory Resolution Pattern

```typescript
export class WorkspaceBackendFactory {
  static create(config: BackendConnectionConfig): IWorkspaceBackend {
    const dataProvider = this.resolveDataProvider(config);
    const storageProvider = this.resolveStorageProvider(config);
    
    return {
      id: config.id,
      mode: config.mode,
      data: dataProvider,
      storage: storageProvider,
      async initialize() {
        await dataProvider.connect();
      },
      async dispose() {
        await dataProvider.disconnect();
      }
    };
  }

  private static resolveDataProvider(config: BackendConnectionConfig): IWorkspaceDataProvider {
    switch (config.database?.type) {
      case "sqlite":
        return new SQLiteDataProvider(config.database.filePath || "./workspace.sqlite");
      case "postgres":
        return new PostgresDataProvider(config.database);
      default:
        throw new Error(`Unsupported data provider: ${config.database?.type}`);
    }
  }

  private static resolveStorageProvider(config: BackendConnectionConfig): IStorageProvider {
    switch (config.storage?.type) {
      case "filesystem":
        return new FilesystemStorageProvider(config.storage.basePath || "./storage");
      case "s3":
        return new S3StorageProvider(config.storage);
      case "supabase_storage":
        return new SupabaseStorageProvider(config.storage);
      default:
        return new FilesystemStorageProvider("./storage");
    }
  }
}
```
