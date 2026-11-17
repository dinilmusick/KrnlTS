import { UserAccount, UserSession, UserRole, AuthState, UserWorkspaceRecord } from '@kloks/state-graph';
import { UserStorageConnection } from '@kloks/state-graph';
import { AuthListener } from './types';
import * as session from './session';
import * as authOps from './authOps';
import * as workspaceOps from './workspaceOps';
import { AuthServiceUISchema } from './auth.ui.js';
import type { ServiceUISchema } from '@kloks/contracts';

const STORAGE_KEY_USER = 'docustack_user_account';

export class AuthService {
  static readonly ui: ServiceUISchema = AuthServiceUISchema;
  readonly ui: ServiceUISchema = AuthServiceUISchema;

  users: Map<string, UserAccount> = new Map();
  currentUser: Omit<UserAccount, 'passwordHash'> | null = null;
  token: string | null = null;
  listeners: Set<AuthListener> = new Set();

  constructor() {
    this.loadDatabase();
    this.restoreSession();
  }

  async loadDatabase() {
    await session.loadDatabase(this);
  }

  persistDatabase() {
    session.persistDatabase(this);
  }

  restoreSession() {
    session.restoreSession(this);
  }

  setSession(user: Omit<UserAccount, 'passwordHash'> | UserAccount, customToken?: string) {
    session.setSession(this, user, customToken);
  }

  getRegisteredUsers(): Omit<UserAccount, 'passwordHash'>[] {
    const seenIds = new Set<string>();
    const uniqueUsers: Omit<UserAccount, 'passwordHash'>[] = [];
    for (const user of this.users.values()) {
      const { passwordHash: _, ...safeUser } = user;
      if (!seenIds.has(safeUser.id)) {
        seenIds.add(safeUser.id);
        uniqueUsers.push(safeUser);
      }
    }
    return uniqueUsers;
  }

  deleteUser(userId: string): boolean {
    let foundEmail: string | null = null;
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        foundEmail = email;
        break;
      }
    }
    if (foundEmail) {
      this.users.delete(foundEmail);
      this.persistDatabase();
      this.notify();
      return true;
    }
    return false;
  }

  subscribe(listener: AuthListener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  getState(): AuthState {
    return {
      currentUser: this.currentUser,
      token: this.token,
      isAuthenticated: Boolean(this.currentUser && this.token),
      isAdmin: this.currentUser?.role === 'admin',
    };
  }

  getCurrentUser(): Omit<UserAccount, 'passwordHash'> | null {
    return this.currentUser;
  }

  verifyPassword(inputPassword: string, storedHash: string | null | undefined): boolean {
    return authOps.verifyPassword(inputPassword, storedHash);
  }

  async loginAdmin(email: string, password: string) {
    return authOps.loginAdmin(this, email, password);
  }

  async loginUser(email: string, password: string) {
    return authOps.loginUser(this, email, password);
  }

  async login(email: string, password: string, requiredRole?: UserRole) {
    if (requiredRole === 'admin') {
      return this.loginAdmin(email, password);
    }
    return this.loginUser(email, password);
  }

  async register(params: { email: string; password: string; name: string; role?: UserRole }) {
    return authOps.register(this, params);
  }

  logout() {
    this.currentUser = null;
    this.token = null;
    session.clearSession();
    this.notify();
  }

  updateCurrentUserStorage(connections: UserStorageConnection[]) {
    if (!this.currentUser) return;
    const email = this.currentUser.email.toLowerCase();
    const existing = this.users.get(email);
    if (existing) {
      existing.storage_connections = connections;
      this.users.set(email, existing);
      this.persistDatabase();
    }
    this.currentUser.storage_connections = connections;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(this.currentUser));
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  getUserStorageConnections(): UserStorageConnection[] {
    return this.currentUser?.storage_connections || [];
  }

  async fetchWorkspaces() {
    return workspaceOps.fetchWorkspaces(this);
  }

  async createWorkspace(params: {
    name: string;
    description?: string;
    engine?: any;
    storageProvider?: any;
    storageConnectionId?: string;
    localFolderName?: string;
    localFolderKey?: string;
    workspacePath?: string;
  }) {
    return workspaceOps.createWorkspace(this, params);
  }

  async updateWorkspace(workspaceId: string, updates: Partial<UserWorkspaceRecord>) {
    return workspaceOps.updateWorkspace(this, workspaceId, updates);
  }

  async deleteWorkspace(workspaceId: string) {
    return workspaceOps.deleteWorkspace(this, workspaceId);
  }

  setActiveWorkspace(workspaceId: string) {
    workspaceOps.setActiveWorkspace(this, workspaceId);
  }
}

export const authService = new AuthService();
export type { AuthState, UserAccount, UserRole, UserSession, UserWorkspaceRecord } from '@kloks/state-graph';
