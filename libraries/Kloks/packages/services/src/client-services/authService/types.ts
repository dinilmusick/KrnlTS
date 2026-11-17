import { UserAccount, AuthState, UserRole } from '@kloks/state-graph';

export type AuthListener = (state: AuthState) => void;

export interface IAuthStore {
  users: Map<string, UserAccount>;
  currentUser: Omit<UserAccount, 'passwordHash'> | null;
  token: string | null;
  listeners: Set<AuthListener>;
  
  loadDatabase(): Promise<void>;
  persistDatabase(): void;
  restoreSession(): void;
  setSession(user: Omit<UserAccount, 'passwordHash'> | UserAccount, customToken?: string): void;
  notify(): void;
  getState(): AuthState;
  getRegisteredUsers(): Omit<UserAccount, 'passwordHash'>[];
  verifyPassword(inputPassword: string, storedHash: string | null | undefined): boolean;
}
