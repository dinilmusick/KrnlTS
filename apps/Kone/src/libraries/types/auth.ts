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
  emailVerified?: boolean;
  trustLevel?: TrustLevel;
  status?: AccountStatus;
  workspacePath?: string;
  workspaceName?: string;
  activeWorkspaceId?: string;
  workspaces?: UserWorkspaceRecord[];
  appProfiles?: Record<string, any>;
}

export interface UserSession {
  user: UserAccount;
  authenticated: boolean;
}

export interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
