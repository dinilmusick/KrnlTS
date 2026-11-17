/**
 * @file types.ts
 * @description Standardized Skipo Ecosystem Account Manifest & Broker Integration.
 * Defines the canonical contract for ecosystem apps to declare account requirements
 * and for SRKL to fulfill them across deployment, storage, and AI service categories.
 * Strictly adheres to Skipo governance (< 200 lines).
 */

export type EcosystemServiceCategory =
  | 'deployment'
  | 'storage'
  | 'database'
  | 'ai'
  | 'vcs'
  | 'general';

export interface AppAccountManifest {
  appId: string;
  appName: string;
  categories?: EcosystemServiceCategory[];
  requiredServices?: string[];
}

export interface EcosystemAccount {
  id: string;
  serviceId: string;
  provider: string;
  category: EcosystemServiceCategory;
  name: string;
  emailOrSlug?: string;
  status: string;
  credentials: Record<string, any>;
  groupIds?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EcosystemAccountsRequest {
  manifest: AppAccountManifest;
  userId?: string;
  workspaceId?: string;
}

export interface EcosystemAccountsResponse {
  success: boolean;
  appId: string;
  userId: string;
  workspaceId?: string;
  count: number;
  accounts: EcosystemAccount[];
  error?: string;
}

export interface SrklServiceAccount {
  id: string;
  serviceId: string;
  name: string;
  credentials: Record<string, any>;
  status: string;
  lastSync?: string;
  metadata?: Record<string, any>;
  workspaceId?: string;
  workspaceName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SrklClientOptions {
  srklUrl?: string;
  userId?: string;
  token?: string;
  workspaceId?: string;
  getAuthHeaders?: () => Record<string, string>;
}

export interface SrklEcosystemQueryOptions {
  workspaceId?: string;
  types?: string[];
  includeCredentials?: boolean;
}

export interface SrklEcosystemResponse {
  success: boolean;
  userId: string;
  workspaceId: string;
  requestedTypes: string[];
  count: number;
  services: SrklServiceAccount[];
  error?: string;
}

export interface AppServiceDeclaration {
  appName: string;
  declaredTypes: string[];
}

export interface AdaptedStorageConnection {
  id: string;
  provider: 'backblaze_b2' | 'aws_s3' | 'google_drive' | 'local_fs';
  label: string;
  role?: 'primary' | 'redundant_clone';
  enabled?: boolean;
  createdAt: string;
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2BucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3BucketName?: string;
  s3Region?: string;
  s3Endpoint?: string;
  googleEmail?: string;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
  googleRefreshToken?: string;
}

export interface KeyMaterial {
  secretHex: string;
  cipher: 'aes-256-gcm';
  envelope: 'salt_iv_tag_ciphertext';
}

export interface SrklVaultAccessResponse {
  success: boolean;
  appId: string;
  workspaceId: string;
  workspaceName: string;
  folderPrefix: string;
  storageProvider: 'backblaze_b2' | 'cloudflare_r2' | 'aws_s3' | string;
  presignedUrl: string;
  keyMaterial: KeyMaterial;
  supportedServices: string[];
  expiresAt: string;
  ttlSeconds: number;
}

export interface ServiceAccountEntry {
  id: string;
  serviceId: string;
  name: string;
  credentials: Record<string, any>;
  status?: string;
  lastSync?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CredentialRegistryMap {
  [serviceId: string]: ServiceAccountEntry[];
}
