/**
 * @file LocalSQLiteAccountProvider.ts
 * @description Local SQLite/JSON-backed Control Plane Account Provider for user accounts and workspace registry.
 */

import { IAccountProvider, UserProfile, AuthSession, AuthCredentials, WorkspaceDescriptor, UserRole } from "../types.js";
import { KrnlFS, FileLock } from "../../tools/KrnlFS.js";
import path from "path";

interface AccountsDBFile {
  users: Record<string, UserProfile & { passwordHash?: string }>;
  workspaces: Record<string, WorkspaceDescriptor[]>; // userId -> workspaces
}

export class LocalSQLiteAccountProvider implements IAccountProvider {
  private filePath: string;
  private isLoaded = false;
  private db: AccountsDBFile = { users: {}, workspaces: {} };

  constructor(filePath = "./accounts.sqlite") {
    this.filePath = path.resolve(filePath);
  }

  private async load(): Promise<void> {
    if (this.isLoaded) return;
    await KrnlFS.ensureDir(path.dirname(this.filePath));
    if (await KrnlFS.fileExists(this.filePath)) {
      try {
        const raw = await KrnlFS.readJSON<AccountsDBFile>(this.filePath);
        if (raw && typeof raw === "object") {
          this.db = {
            users: raw.users || {},
            workspaces: raw.workspaces || {}
          };
        }
      } catch {
        this.db = { users: {}, workspaces: {} };
      }
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    const release = await FileLock.acquire(this.filePath);
    try {
      await KrnlFS.writeJSON(this.filePath, this.db, 2);
    } finally {
      release();
    }
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    await this.load();
    const user = this.db.users[userId];
    if (!user) return null;
    const { passwordHash, ...profile } = user;
    return profile;
  }

  async registerUser(credentials: AuthCredentials & { role?: UserRole }): Promise<UserProfile> {
    await this.load();
    const userId = credentials.username || credentials.email || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profile: UserProfile & { passwordHash?: string } = {
      id: userId,
      email: credentials.email,
      username: credentials.username || credentials.email,
      role: credentials.role || "USER",
      passwordHash: credentials.password,
      metadata: credentials.metadata || {},
      createdAt: Date.now()
    };

    this.db.users[userId] = profile;
    if (!this.db.workspaces[userId]) {
      this.db.workspaces[userId] = [];
    }
    await this.persist();

    const { passwordHash, ...safeProfile } = profile;
    return safeProfile;
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthSession> {
    await this.load();
    const userId = credentials.username || credentials.email;
    let user = userId ? this.db.users[userId] : null;

    if (!user && (credentials.email || credentials.username)) {
      // Auto-register first user as admin if database is empty
      const isFirst = Object.keys(this.db.users).length === 0;
      user = await this.registerUser({
        ...credentials,
        role: isFirst ? "ADMIN" : "USER"
      }) as any;
    }

    if (!user) {
      throw new Error("Invalid user credentials.");
    }

    const token = `sess::${user.id}::${Date.now()}::${Math.random().toString(36).substring(2, 9)}`;
    const { passwordHash, ...profile } = user;

    return {
      userId: user.id,
      role: user.role,
      token,
      expiresAt: Date.now() + 86400000,
      user: profile
    };
  }

  async verifySession(token: string | null): Promise<AuthSession | null> {
    if (!token) return null;
    await this.load();
    const parts = token.split("::");
    if (parts.length >= 4 && parts[0] === "sess") {
      const userId = parts[1];
      const user = this.db.users[userId];
      if (user) {
        const { passwordHash, ...profile } = user;
        return {
          userId: user.id,
          role: user.role,
          token,
          expiresAt: Date.now() + 86400000,
          user: profile
        };
      }
    }
    return null;
  }

  async listWorkspaces(userId: string): Promise<WorkspaceDescriptor[]> {
    await this.load();
    return this.db.workspaces[userId] || [];
  }

  async createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor> {
    await this.load();
    if (!this.db.workspaces[userId]) {
      this.db.workspaces[userId] = [];
    }

    const newWs: WorkspaceDescriptor = {
      id: descriptor.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: userId,
      name: descriptor.name || "Default Workspace",
      backendConfig: descriptor.backendConfig || {
        id: "default",
        provider: "sqlite",
        mode: "local",
        database: { type: "sqlite", filePath: "./workspace.sqlite" },
        storage: { type: "filesystem", basePath: "./storage" }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.db.workspaces[userId].push(newWs);
    await this.persist();
    return newWs;
  }

  async deleteWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    await this.load();
    const list = this.db.workspaces[userId] || [];
    const idx = list.findIndex(w => w.id === workspaceId);
    if (idx !== -1) {
      list.splice(idx, 1);
      await this.persist();
      return true;
    }
    return false;
  }
}
