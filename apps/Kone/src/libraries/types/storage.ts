// ══════════════════════════════════════════════════════════════════════════════
// SKIPO / DEPM WORKSPACE STORAGE & DATABASE CLUSTER TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type UserStorageProvider =
  | 'local_fs'
  | 'backblaze_b2'
  | 'supabase_storage'
  | 'google_drive';

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
