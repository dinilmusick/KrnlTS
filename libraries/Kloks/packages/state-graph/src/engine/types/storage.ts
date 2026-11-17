// ══════════════════════════════════════════════════════════════════════════════
// SKIPO / DEPM WORKSPACE STORAGE & DATABASE CLUSTER TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type UserStorageProvider =
  | 'local_fs'
  | 'backblaze_b2'
  | 'cloudflare_r2'
  | 'supabase_storage'
  | 'aws_s3';

export type StorageRole = 'primary' | 'redundant_clone';

export interface UserStorageConnection {
  id: string;
  provider: UserStorageProvider;
  label: string;
  role?: StorageRole;
  enabled?: boolean;
  createdAt: string;
  updatedAt?: string;
  testedAt?: string;
  testStatus?: 'ok' | 'failed';
  testError?: string;
  latencyMs?: number;

  // Backblaze B2 (S3-compatible)
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2BucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;

  // Cloudflare R2 (S3-compatible)
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;

  // AWS S3
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3BucketName?: string;
  s3Region?: string;
  s3Endpoint?: string;

  // Supabase Storage
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  supabaseBucketName?: string;

  // Local FS Browser Handle reference metadata
  localFolderKey?: string;
  localFolderName?: string;
  localFolderPathHint?: string;
}

export type DatabaseEngine =
  | 'local_fs'
  | 's3_blob'
  | 'postgres'
  | 'supabase'
  | 'neon'
  | 'firebase';

export type AdminBackendEngine = 'postgres' | 'supabase' | 'neon' | 'firebase' | 'remote_auth';
export type DatabaseRole = 'primary' | 'redundant_clone' | 'failover_standby';
export type DatabaseTargetScope = 'all' | 'accounts_only' | 'workspaces_only';

export interface DatabaseConnectionEntry {
  id: string;
  name: string;
  engine: AdminBackendEngine;
  role: DatabaseRole;
  target?: DatabaseTargetScope;
  enabled: boolean;
  status: 'connected' | 'error' | 'testing' | 'offline';
  latencyMs?: number;
  recordsCloned?: number;
  lastSyncedAt?: string;
  lastTestedAt?: string;
  isFromEnv?: boolean;
  envVarKey?: string;

  postgres?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean;
    connectionString?: string;
  };

  supabase?: {
    url: string;
    serviceRoleKey?: string;
    anonKey?: string;
    tableName?: string;
    connectionString?: string;
  };

  neon?: {
    connectionString?: string;
    tableName?: string;
  };

  firebase?: {
    projectId: string;
    apiKey?: string;
    collectionName?: string;
  };

  remote_auth?: {
    endpointUrl: string;
    apiKey?: string;
  };
}

export interface AdminDatabaseClusterConfig {
  databases: DatabaseConnectionEntry[];
  activePrimaryId?: string;
  autoReplication?: boolean;
  syncIntervalSec?: number;
  syncPolicy?: string;
  autoFailover?: boolean;
  healthCheckIntervalSeconds?: number;
}
