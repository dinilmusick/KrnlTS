// ══════════════════════════════════════════════════════════════════════════════
// AUTH SERVICE BACKWARD-COMPATIBLE BARREL FACADE
// ══════════════════════════════════════════════════════════════════════════════

export * from './authService/index';
export type { AuthState, UserAccount, UserRole, UserSession, UserWorkspaceRecord } from './authService/index';
export type { UserStorageConnection } from '@kloks/state-graph';
