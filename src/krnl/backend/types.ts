// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS: KrnlTS Universal Backend Architecture & Workspace Storage Spec
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Complete type contracts for Control Plane (RBAC, Audit Logging, Multi-App User Context,
 *          Database Clusters), Workspace Storage Architecture (Decoupled Storage Adapters,
 *          Provider-Independent WorkspaceFS, Multi-Cloud Sync Engine, Conflict Resolution).
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
  | "google_drive"
  | "onedrive"
  | "icloud"
  | "custom";

export type StorageProviderType =
  | "local"
  | "icloud"
  | "google_drive"
  | "onedrive"
  | "supabase_storage"
  | "firebase_storage"
  | "s3"
  | "vercel_blob"
  | "custom";

export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "user" | "moderator" | "admin";

export type ClusterDatabaseRole = "primary" | "redundant_clone" | "read_replica";

export type SyncMode = "on_write" | "interval" | "manual";

export type ConflictStrategy = "primary_wins" | "newest_wins" | "manual";

export type StorageEndpointStatus = "CONNECTED" | "DISCONNECTED" | "SYNCING" | "ERROR";

export type StorageEndpointSyncState = "SYNCED" | "OUT_OF_SYNC" | "PENDING" | "ERROR";

export type Unsubscribe = () => void;

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
  type: "filesystem" | "s3" | "supabase_storage" | "pocketbase_storage" | "firebase_storage" | "vercel_blob" | "google_drive" | "onedrive" | "custom";
  basePath?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
  apiKey?: string;
  token?: string;
  projectId?: string;
  accountId?: string;
  rootFolderId?: string;
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
// 4. WORKSPACE STORAGE ARCHITECTURE SPEC CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface SecretReference {
  vaultKey: string;
  envVar?: string;
}

export interface LocalStorageConfiguration {
  provider: "local";
  directoryHandle?: any; // Browser FileSystemDirectoryHandle
  basePath?: string; // Node.js local path
  displayPath?: string;
}

export interface GoogleDriveConfiguration {
  provider: "google_drive";
  accountId: string;
  rootFolderId: string;
  authenticationReference?: SecretReference;
  accessToken?: string;
}

export interface OneDriveConfiguration {
  provider: "onedrive";
  accountId: string;
  rootFolderId: string;
  authenticationReference?: SecretReference;
  accessToken?: string;
}

export interface SupabaseStorageConfiguration {
  provider: "supabase_storage";
  projectUrl: string;
  bucket: string;
  authenticationReference?: SecretReference;
  apiKey?: string;
}

export interface FirebaseStorageConfiguration {
  provider: "firebase_storage";
  projectId: string;
  bucket: string;
  authenticationReference?: SecretReference;
  apiKey?: string;
}

export interface S3StorageConfiguration {
  provider: "s3";
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
}

export interface CustomStorageConfiguration {
  provider: "custom";
  [key: string]: any;
}

export interface ICloudStorageConfiguration {
  provider: "icloud";
  containerId?: string;
  basePath?: string;
  displayPath?: string;
  authenticationReference?: SecretReference;
}

export type ProviderConfiguration =
  | LocalStorageConfiguration
  | ICloudStorageConfiguration
  | GoogleDriveConfiguration
  | OneDriveConfiguration
  | SupabaseStorageConfiguration
  | FirebaseStorageConfiguration
  | S3StorageConfiguration
  | CustomStorageConfiguration;

export interface StorageEndpoint {
  id: string;
  provider: StorageProviderType;
  configuration: ProviderConfiguration;
  enabled: boolean;
  status: StorageEndpointStatus;
  lastSyncAt?: number;
  syncState?: StorageEndpointSyncState;
  errorMessage?: string;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 5. FILE SYSTEM, METADATA & ADAPTER INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface FileMetadata {
  path: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: number;
  contentHash?: string; // SHA-256
  revision?: string;
  mimeType?: string;
}

export interface FileEntry {
  path: string;
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: number;
}

export type FileChangeCallback = (event: { type: "create" | "update" | "delete"; path: string; metadata?: FileMetadata }) => void;

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * INTERFACE: WorkspaceStorageAdapter
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Provider-independent contract implemented by Local, Google Drive, OneDrive,
 *          Supabase, and Firebase storage providers.
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export interface WorkspaceStorageAdapter {
  readonly provider: StorageProviderType;
  readonly endpointId: string;
  initialize(): Promise<void>;
  exists(pathStr: string): Promise<boolean>;
  stat(pathStr: string): Promise<FileMetadata>;
  list(pathStr?: string): Promise<FileEntry[]>;
  read(pathStr: string): Promise<Uint8Array>;
  write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
  mkdir(pathStr: string): Promise<void>;
  delete(pathStr: string): Promise<void>;
  move(source: string, destination: string): Promise<void>;
  copy(source: string, destination: string): Promise<void>;
  watch?(pathStr: string, callback: FileChangeCallback): Unsubscribe;
  disconnect(): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 6. SYNC ENGINE & REPLICATION CONTRACTS
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface RetryConfiguration {
  maxAttempts: number;
  backoffMs: number;
}

export interface VerificationConfiguration {
  verifyChecksums: boolean;
  intervalMs?: number;
}

export interface SyncConfiguration {
  enabled: boolean;
  mode: SyncMode;
  intervalMs?: number;
  conflictStrategy: ConflictStrategy;
  deletePropagation: boolean;
  retry: RetryConfiguration;
  verification: VerificationConfiguration;
}

export interface SyncResult {
  ok: boolean;
  syncedFiles: string[];
  failedEndpoints: Array<{ endpointId: string; error: string }>;
  timestamp: number;
  durationMs: number;
}

export interface RestoreResult {
  ok: boolean;
  restoredFromEndpointId: string;
  filesRestoredCount: number;
  timestamp: number;
  errorMessage?: string;
}

export interface VerificationResult {
  ok: boolean;
  totalFiles: number;
  matchedFiles: number;
  divergentFiles: Array<{ path: string; primaryHash?: string; backupHashes: Record<string, string> }>;
  timestamp: number;
}

export interface ISyncEngine {
  initialize(workspace: Workspace, primary: WorkspaceStorageAdapter, backups: WorkspaceStorageAdapter[]): Promise<void>;
  sync(workspace: Workspace): Promise<SyncResult>;
  syncFile(pathStr: string): Promise<SyncResult>;
  restore(backup: StorageEndpoint): Promise<RestoreResult>;
  verify(workspace: Workspace): Promise<VerificationResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  shutdown(): Promise<void>;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 7. WORKSPACE, PREFERENCES & APP USER CONTEXT
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface WorkspacePreferences {
  theme?: string;
  autoSave?: boolean;
  defaultView?: string;
  customSettings?: Record<string, any>;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  primaryStorage: StorageEndpoint;
  backupStorages: StorageEndpoint[];
  sync: SyncConfiguration;
  preferences: WorkspacePreferences;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface AppPreferences {
  workspaceOrder?: string[]; // WorkspaceID[] for dnd-kit ordering
  defaultWorkspaceId?: string;
  customTheme?: string;
  [key: string]: any;
}

export interface AppUserContext {
  appId: string;
  enabled: boolean;
  preferences: AppPreferences;
  workspaces: Workspace[];
  createdAt: number;
  updatedAt: number;
}

export interface GlobalUserIdentity {
  displayName?: string;
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
}

export interface User {
  id: string;
  credentials: AuthCredentials;
  identity: GlobalUserIdentity;
  role: UserRole;
  apps: Record<string, AppUserContext>; // appId -> AppUserContext
  createdAt: number;
  updatedAt: number;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 8. WORKSPACE RUNTIME & APPLICATION RUNTIME
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface IWorkspaceFS {
  exists(pathStr: string): Promise<boolean>;
  stat(pathStr: string): Promise<FileMetadata>;
  list(pathStr?: string): Promise<FileEntry[]>;
  read(pathStr: string): Promise<Uint8Array>;
  readText(pathStr: string): Promise<string>;
  write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void>;
  mkdir(pathStr: string): Promise<void>;
  delete(pathStr: string): Promise<void>;
  move(source: string, destination: string): Promise<void>;
  copy(source: string, destination: string): Promise<void>;
}

export interface IWorkspaceRuntime {
  readonly workspace: Workspace;
  readonly primary: WorkspaceStorageAdapter;
  readonly backups: WorkspaceStorageAdapter[];
  readonly filesystem: IWorkspaceFS;
  readonly syncEngine: ISyncEngine;
  initialize(): Promise<void>;
  changePrimary(newPrimaryEndpointId: string): Promise<void>;
  addBackup(endpoint: StorageEndpoint): Promise<void>;
  detachStorage(endpointId: string): Promise<void>;
  dispose(): Promise<void>;
}

export interface ApplicationRuntimeState {
  currentUser: User;
  currentApp: AppUserContext;
  currentWorkspace?: Workspace;
  workspaceRuntime?: IWorkspaceRuntime;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// 9. DATABASE CLUSTER & REDUNDANCY TYPES
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
// 10. AUDIT LOGGING TYPES
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
// 11. USER, AUTH & SESSION PROFILES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface WorkspaceDescriptor {
  id: string;
  ownerId: string;
  name: string;
  backendConfig?: BackendConnectionConfig;
  workspaceSpec?: Workspace;
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
  apps?: Record<string, AppUserContext>;
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
// 12. PROVIDER INTERFACES
// ══════════════════════════════════════════════════════════════════════════════════════════

export interface IAccountProvider {
  getUser(userId: string): Promise<UserProfile | null>;
  getFullUser?(userId: string): Promise<User | null>;
  authenticate(credentials: AuthCredentials): Promise<AuthSession>;
  verifySession(token: string | null): Promise<AuthSession | null>;
  listWorkspaces(userId: string, appId?: string): Promise<WorkspaceDescriptor[]>;
  createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>, appId?: string): Promise<WorkspaceDescriptor>;
  deleteWorkspace(userId: string, workspaceId: string, appId?: string): Promise<boolean>;
  getAppUserContext?(userId: string, appId: string): Promise<AppUserContext | null>;
  updateAppPreferences?(userId: string, appId: string, preferences: Partial<AppPreferences>): Promise<AppPreferences>;
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
  uploadFile(pathStr: string, content: Buffer | Uint8Array | string | ReadableStream, mimeType?: string): Promise<{ url: string; size: number }>;
  downloadFile(pathStr: string): Promise<Buffer>;
  deleteFile(pathStr: string): Promise<boolean>;
  getPublicUrl(pathStr: string): string;
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
// 13. BUILT-IN FUNCTIONALITY TABLE INTERFACE
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
  google_drive?: StorageProviderConfig;
  onedrive?: StorageProviderConfig;
  custom?: Record<string, any>;
}
