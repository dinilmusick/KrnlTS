/**
 * Canonical storage provider and user-owned connection contracts.
 * Secrets are server-only fields and are never part of StorageConnectionPublic.
 */

export type StorageProviderId =
  | 'local_fs'
  | 'backblaze_b2'
  | 'google_drive'
  | 'cloudflare_r2'
  | 'aws_s3';

export type StorageAuthorizationMode = 'none' | 'credentials' | 'oauth2';

export interface StorageConfigurationField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'email';
  required: boolean;
  secret?: boolean;
  placeholder?: string;
}

export interface StorageProviderCapability {
  id: StorageProviderId;
  displayName: string;
  description: string;
  enabled: boolean;
  unavailableReason?: string;
  canSelectExistingConnection: boolean;
  canCreateConnection: boolean;
  authorizationMode: StorageAuthorizationMode;
  configurationFields: StorageConfigurationField[];
  supportsAccountDiscovery: boolean;
  supportsBucketDiscovery: boolean;
  supportsFolderDiscovery: boolean;
}

export interface StorageConnectionPublic {
  id: string;
  provider: StorageProviderId;
  label: string;
  role?: 'primary' | 'redundant_clone';
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  testedAt?: string;
  testStatus?: 'ok' | 'error';
  latencyMs?: number;
  bucketName?: string;
  b2BucketName?: string;
  b2Region?: string;
  b2Endpoint?: string;
  bucketNames?: string[];
  googleEmail?: string;
  googleAccountId?: string;
  googleRootFolderId?: string;
  googleRootFolderName?: string;
  authorizationState?: 'connected' | 'expired' | 'pending' | 'error';
  metadata?: Record<string, unknown>;
}

export interface BackblazeBucketInfo {
  bucketId: string;
  bucketName: string;
  bucketType?: string;
  accountId?: string;
}

export interface GoogleDriveConnectionTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

/** Internal-only shape. Never return this from an HTTP/browser-facing operation. */
export interface StorageConnectionInternal extends StorageConnectionPublic {
  b2KeyId?: string;
  b2ApplicationKey?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  googleAccessToken?: string;
  googleAccessTokenExpiresAt?: number;
  googleRefreshToken?: string;
}
