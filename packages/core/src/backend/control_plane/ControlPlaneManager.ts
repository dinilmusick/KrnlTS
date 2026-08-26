/**
 * @file ControlPlaneManager.ts
 * @description High-level manager coordinating user accounts, workspace registry, and session resolution.
 */

import { IAccountProvider, AuthSession, AuthCredentials, WorkspaceDescriptor, UserProfile } from "../types.js";
import { LocalSQLiteAccountProvider } from "./LocalSQLiteAccountProvider.js";
import { HostedAccountProvider } from "./HostedAccountProvider.js";

export class ControlPlaneManager {
  readonly accountProvider: IAccountProvider;

  constructor(providerOrPath?: IAccountProvider | string) {
    if (!providerOrPath || typeof providerOrPath === "string") {
      this.accountProvider = new LocalSQLiteAccountProvider(providerOrPath || "./accounts.sqlite");
    } else {
      this.accountProvider = providerOrPath;
    }
  }

  static createLocal(filePath = "./accounts.sqlite"): ControlPlaneManager {
    return new ControlPlaneManager(new LocalSQLiteAccountProvider(filePath));
  }

  static createHosted(endpoint: string, apiKey?: string): ControlPlaneManager {
    return new ControlPlaneManager(new HostedAccountProvider({ endpoint, apiKey }));
  }

  async login(credentials: AuthCredentials): Promise<AuthSession> {
    return await this.accountProvider.authenticate(credentials);
  }

  async verifyToken(token: string | null): Promise<AuthSession | null> {
    return await this.accountProvider.verifySession(token);
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    return await this.accountProvider.getUser(userId);
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceDescriptor[]> {
    return await this.accountProvider.listWorkspaces(userId);
  }

  async registerWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor> {
    return await this.accountProvider.createWorkspace(userId, descriptor);
  }
}
