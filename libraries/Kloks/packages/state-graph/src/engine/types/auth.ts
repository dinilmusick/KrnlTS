// ══════════════════════════════════════════════════════════════════════════════
// SKIPO / DEPM AUTH & USER IDENTITY TYPES (§1 CONTROL PLANE INVARIANTS)
// ══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'pro' | 'user';

export type TrustLevel =
  | 'T0_UNVERIFIED'
  | 'T1_EMAIL_VERIFIED'
  | 'T2_ESTABLISHED'
  | 'T3_TRUSTED'
  | 'T4_PRIVILEGED';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'DELETED';

import { DatabaseEngine, UserStorageProvider } from './storage';
export type { DatabaseEngine, UserStorageProvider };

export interface WorkspaceSecondaryClone {
  id: string;
  label: string;
  provider: UserStorageProvider | string;
  b2BucketName?: string;
  b2KeyId?: string;
  b2ApplicationKey?: string;
  b2Region?: string;
  b2Endpoint?: string;
  localFolderName?: string;
  localFolderKey?: string;
  createdAt: string;
  lastSyncedAt?: string;
  filesSynced?: number;
  status?: 'CONNECTED' | 'SYNCED' | 'ERROR';
}

export interface UserWorkspaceRecord {
  id: string;
  name: string;
  description?: string;
  engine: DatabaseEngine;
  workspacePath: string;
  storageConnectionId?: string;
  storageProvider?: UserStorageProvider;
  localFolderName?: string;
  localFolderKey?: string;
  b2BucketName?: string;
  b2Endpoint?: string;
  b2Region?: string;
  secondaryClones?: WorkspaceSecondaryClone[];
  autoSyncClones?: boolean;
  createdAt: string;
  updatedAt?: string;
  ecosystemName?: string;
  appsCount?: number;
  accountsCount?: number;
  deploymentsCount?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatarGlyph?: string;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt?: string;
  passwordHash?: string;
  emailVerified?: boolean;
  trustLevel?: TrustLevel;
  status?: AccountStatus;
  workspacePath?: string;
  workspaceName?: string;
  activeWorkspaceId?: string;
  workspaces?: UserWorkspaceRecord[];
  appProfiles?: Record<string, any>;
  storage_connections?: any[];
}

export interface UserSession {
  user: Omit<UserAccount, 'passwordHash'>;
  token: string;
  expiresAt: number;
}

export interface AuthState {
  currentUser: Omit<UserAccount, 'passwordHash'> | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
