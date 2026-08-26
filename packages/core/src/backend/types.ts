// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS: KrnlTS Universal Backend Architecture (DocuStack Refinements)
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Complete type contracts for Control Plane (RBAC, Audit Logging, Database Clusters,
 *          Redundancy Sync), Workspace Data Plane (Multi-Engine Providers, Failover Cascades),
 *          and Built-in Functionality Table CRUD.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. ENUMS & BASIC TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

export type StorageMode = "local" | "local_hosted" | "remote";

export type BackendServiceType =
  | "sqlite"
  | "postgres"
  | "supabase"
  | "pocketbase"
  | "firebase"
  | "turso"
  | "mongodb"
  | "custom_api"
  | "filesystem"
  | "s3"
  | "vercel_blob"
  | "custom";

export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "user" | "moderator" | "admin";

export type ClusterDatabaseRole = "primary" | "redundant_clone" | "read_replica";

// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. DATABASE & STORAGE CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface DatabaseProviderConfig {
  type: "sqlite" | "postgres" | "supabase" | "pocketbase" | "firebase" | "turso" | "mongodb" | "custom_api" | "custom";
  filePath?: string;
  enableWAL?: boolean;
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  poolSize?: number;
  endpoint?: string;
  apiKey?: string;
  authToken?: string;
  projectId?: string;
  collectionName?: string;
  headers?: Record<string, string>;
}

export interface StorageProviderConfig {
  type: "filesystem" | "s3" | "supabase_storage" | "pocketbase_storage" | "firebase_storage" | "vercel_blob" | "custom";
  basePath?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
  apiKey?: string;
  token?: string;
  projectId?: string;
}

export interface AuthConfig {
  jwtSecret?: string;
  apiKey?: string;
  token?: string;
  endpoint?: string;
}

export interface BackendConnectionConfig {
  id: string;
  name?: string;
  provider: BackendServiceType;
  mode: StorageMode;
  endpoint?: string;
  database?: DatabaseProviderConfig;
  storage?: StorageProviderConfig;
  auth?: AuthConfig;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. DATABASE CLUSTER & REDUNDANCY TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface DatabaseClusterEntry {
  id: string;
  name: string;
  role: ClusterDatabaseRole;
  enabled: boolean;
  config: DatabaseProviderConfig;
  lastSyncTimestamp?: number;
  lastHealthCheckLatencyMs?: number;
  healthStatus?: "HEALTHY" | "DEGRADED" | "OFFLINE";
  errorDetails?: string;
}

export interface DatabaseClusterVault {
  version: string;
  primaryDatabaseId: string;
  clusters: DatabaseClusterEntry[];
  updatedAt: number;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 5. AUDIT LOGGING TYPES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  status: "SUCCESS" | "FAILURE" | "SECURITY_DENIED";
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 6. USER, AUTH & SESSION PROFILES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface WorkspaceDescriptor {
  id: string;
  ownerId: string;
  name: string;
  backendConfig: BackendConnectionConfig;
  createdAt: number;
  updatedAt: number;
}

export interface AuthCredentials {
  email?: string;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  role: UserRole;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  token: string;
  expiresAt: number;
  user?: UserProfile;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 7. PROVIDER INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface IAccountProvider {
  getUser(userId: string): Promise<UserProfile | null>;
  authenticate(credentials: AuthCredentials): Promise<AuthSession>;
  verifySession(token: string | null): Promise<AuthSession | null>;
  listWorkspaces(userId: string): Promise<WorkspaceDescriptor[]>;
  createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor>;
  deleteWorkspace(userId: string, workspaceId: string): Promise<boolean>;
}

export interface IWorkspaceDataProvider {
  readonly engine: BackendServiceType;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; details?: any }>;
  ensureTable(tableName: string, schema?: Record<string, any>): Promise<void>;
  query<T = any>(queryStr: string, params?: any[]): Promise<T[]>;
  execute(commandStr: string, params?: any[]): Promise<{ affectedRows: number; lastInsertId?: string | number }>;
  find<T = any>(table: string, filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): Promise<T[]>;
  findOne<T = any>(table: string, filter: Record<string, any> | string): Promise<T | null>;
  insert<T = any>(table: string, data: T | T[]): Promise<T | T[]>;
  update<T = any>(table: string, filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }>;
  delete(table: string, filter: Record<string, any> | string): Promise<{ affectedRows: number }>;
  count(table: string, filter?: Record<string, any>): Promise<number>;
  clear(table: string): Promise<void>;
}

export interface IStorageProvider {
  readonly driver: string;
  uploadFile(path: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{ url: string; size: number }>;
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<boolean>;
  getPublicUrl(path: string): string;
  listFiles(prefix?: string): Promise<Array<{ path: string; size: number; updatedAt: number }>>;
}

export interface IWorkspaceBackend {
  readonly id: string;
  readonly mode: StorageMode;
  readonly data: IWorkspaceDataProvider;
  readonly storage: IStorageProvider;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 8. BUILT-IN FUNCTIONALITY TABLE INTERFACE
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface IFunctionalityTable<T = any> {
  readonly tableName: string;
  readonly service: BackendServiceType;
  readonly provider: IWorkspaceDataProvider;
  find(filter?: Record<string, any>, options?: { limit?: number; offset?: number; sort?: Record<string, 1 | -1> }): Promise<T[]>;
  findOne(filter: Record<string, any> | string): Promise<T | null>;
  create(record: T): Promise<T>;
  insert(record: T | T[]): Promise<T | T[]>;
  update(filter: Record<string, any> | string, patch: Partial<T>): Promise<{ affectedRows: number }>;
  delete(filter: Record<string, any> | string): Promise<{ affectedRows: number }>;
  upsert(record: T, keyField?: string): Promise<T>;
  count(filter?: Record<string, any>): Promise<number>;
  query(rawQueryOrFilter: any, params?: any[]): Promise<any>;
  clear(): Promise<void>;
}

export type FunctionalityBackendFlag = boolean | BackendServiceType | FunctionalityBackendConfig;

export interface FunctionalityBackendConfig {
  enabled?: boolean;
  service?: BackendServiceType;
  table?: string;
  schema?: Record<string, any>;
  credentials?: DatabaseProviderConfig;
}

export interface EntityBackendSettings {
  defaultService?: BackendServiceType;
  sqlite?: DatabaseProviderConfig;
  postgres?: DatabaseProviderConfig;
  supabase?: DatabaseProviderConfig;
  pocketbase?: DatabaseProviderConfig;
  firebase?: DatabaseProviderConfig;
  turso?: DatabaseProviderConfig;
  mongodb?: DatabaseProviderConfig;
  custom_api?: DatabaseProviderConfig;
  filesystem?: StorageProviderConfig;
  s3?: StorageProviderConfig;
  vercel_blob?: StorageProviderConfig;
  custom?: Record<string, any>;
}
