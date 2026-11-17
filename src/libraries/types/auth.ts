export type UserRole = 'user' | 'pro' | 'admin';

export type UserStorageProvider = 'local_fs' | 'backblaze_b2' | 'google_drive' | 'cloudflare_r2' | 'aws_s3';

export interface UserStorageConnection {
  id: string;
  provider: UserStorageProvider;
  label: string;
  role?: 'primary' | 'redundant_clone';
  enabled?: boolean;
  createdAt: string;
  updatedAt?: string;
  testedAt?: string;
  testStatus?: 'ok' | 'error';
  latencyMs?: number;
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2BucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  region?: string;
  endpoint?: string;
  googleEmail?: string;
  googleAccountId?: string;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
  googleRefreshToken?: string;
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3BucketName?: string;
  s3Region?: string;
  s3Endpoint?: string;
  localFolderKey?: string;
  localFolderName?: string;
  localFolderPathHint?: string;
}

export interface SrklWorkspace {
  id: string;
  name: string;
  description?: string;
  workspacePath: string;
  storageProvider?: UserStorageProvider;
  storageConnectionId?: string | null;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
  /** Workspace-specific bucket; credentials remain in the server-side connection record. */
  b2BucketName?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SrklAppProfile {
  workspaceName: string;
  workspacePath: string;
  activeWorkspaceId?: string;
  themePreference?: 'black_and_gold' | 'coffee_theme' | 'dark';
  dockPosition?: 'top' | 'bottom' | 'left' | 'right';
  autoHideDock?: boolean;
  autoSyncIntervalSec?: number;
  registeredAt: string;
  lastActiveAt: string;
  workspaces?: SrklWorkspace[];
  storage_connections?: UserStorageConnection[];
  cluster_connections?: any[];
  services?: any[];
  custom_definitions?: any[];
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarGlyph?: string;
  workspaceName?: string;
  workspacePath?: string;
  appProfiles?: {
    srkl?: SrklAppProfile;
    docustack?: Record<string, any>;
    [appId: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export type AdminBackendEngine = 'neon' | 'supabase' | 'postgres' | 'firebase' | 'remote_auth' | 'sqlite' | 'turso';
export type DatabaseRole = 'primary' | 'redundant_clone' | 'failover_standby';
export type DatabaseTargetScope = 'all' | 'users' | 'sessions' | 'logs';

export interface DatabaseConnectionEntry {
  id: string;
  name: string;
  engine: AdminBackendEngine;
  role: DatabaseRole;
  target: DatabaseTargetScope;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'testing';
  latencyMs?: number;
  recordsCloned?: number;
  lastSyncedAt?: string;
  lastTestedAt?: string;
  isFromEnv?: boolean;
  source?: 'env' | 'runtime';
  envVarKey?: string;
  connectionString?: string;
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    ssl: boolean;
    connectionString?: string;
  };
  supabase?: { url: string; serviceRoleKey: string; anonKey?: string; connectionString?: string; tableName: string };
  neon?: { connectionString: string; tableName: string };
  firebase?: { projectId: string; apiKey?: string; collectionName: string };
  remote_auth?: { endpointUrl: string; apiKey?: string };
  sqlite?: { dbPath: string; walMode: boolean };
}

export interface AdminDatabaseClusterConfig { databases: DatabaseConnectionEntry[]; }

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor_user_id: string;
  ip_address?: string;
  details?: string;
  target_type?: string;
}
