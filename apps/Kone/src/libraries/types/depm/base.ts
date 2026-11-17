// ══════════════════════════════════════════════════════════════════════════════
// DEPM SYSTEM TYPES - BASE SCHEMAS & CONFIGS
// ══════════════════════════════════════════════════════════════════════════════

export type TabType = 'ECOSYSTEM' | 'APPS' | 'ACCOUNTS' | 'SETTINGS';
export type DepmTab = TabType;

export type ProviderType = 'VERCEL' | 'CLOUDFLARE' | 'AWS' | 'GCP' | 'FASTLY' | 'BACKBLAZE_B2' | 'CLOUDFLARE_R2' | 'SUPABASE' | 'NEON' | 'POSTGRESQL';

export type NodeType =
  | 'ECOSYSTEM'
  | 'ECOSYSTEM_HUB'
  | 'SYSTEM_DATABASE'
  | 'SYSTEM_BUCKET'
  | 'ADMIN_CREDENTIALS'
  | 'APP_GRAPH_NODE'
  | 'APP'
  | 'APP_NODE'
  | 'APP_COMPONENT'
  | 'DEPLOYMENT'
  | 'WEIGHT_USER'
  | 'WEIGHT_RESOURCE'
  | 'WEIGHT_ACCOUNT'
  | 'WEIGHT_MULTIPLY'
  | 'WEIGHT_MODIFIER'
  | 'URL_NODE'
  | 'VARIANTS';
export type GraphNodeType = NodeType;

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface SystemDbConfig {
  databaseUrl?: string;
  provider?: string;
  dbName?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
  selectedTable?: string;
  adminTable?: string;
  adminEmailColumn?: string;
  adminPasswordColumn?: string;
  adminUsernameColumn?: string;
  bucketTable?: string;
  connectionStatus?: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';
  lastTestedAt?: string;
  latencyMs?: number;
  serverVersion?: string;
  discoveredTables?: string[];
  updatedAt?: string;
}

export interface SystemBucketConfig {
  bucketName?: string;
  provider?: string;
  endpoint?: string;
  region?: string;
  publicAccess?: boolean;
  updatedAt?: string;
}

export interface AdminCredentialsConfig {
  adminEmail?: string;
  adminSecretKey?: string;
  depmJwtSecret?: string;
  apiKey?: string;
  lastRotatedAt?: string;
  rotationHistoryCount?: number;
}

export type AccountTier = 'hobby' | 'pro' | 'enterprise' | 'free' | 'payg' | 'custom';
