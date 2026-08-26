/**
 * @file HostedAccountProvider.ts
 * @description Hosted Control Plane Account Provider for cloud authentication services.
 */

import { IAccountProvider, UserProfile, AuthSession, AuthCredentials, WorkspaceDescriptor, AuthConfig } from "../types.js";
import { KrnlHTTP } from "../../tools/KrnlHTTP.js";

export class HostedAccountProvider implements IAccountProvider {
  private endpoint: string;
  private apiKey?: string;

  constructor(config: AuthConfig) {
    this.endpoint = (config.endpoint || "").replace(/\/+$/, "");
    this.apiKey = config.apiKey || config.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      headers["apikey"] = this.apiKey;
    }
    return headers;
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    const res = await KrnlHTTP.get<UserProfile>(`${this.endpoint}/api/auth/users/${userId}`, { headers: this.getHeaders() });
    return res.status === "success" && res.data ? res.data : null;
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthSession> {
    const res = await KrnlHTTP.post<AuthSession>(`${this.endpoint}/api/auth/login`, credentials, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Authentication failed against hosted account backend.");
  }

  async verifySession(token: string | null): Promise<AuthSession | null> {
    if (!token) return null;
    const res = await KrnlHTTP.post<AuthSession>(`${this.endpoint}/api/auth/verify`, { token }, { headers: this.getHeaders() });
    return res.status === "success" && res.data ? res.data : null;
  }

  async listWorkspaces(userId: string): Promise<WorkspaceDescriptor[]> {
    const res = await KrnlHTTP.get<WorkspaceDescriptor[]>(`${this.endpoint}/api/workspaces?userId=${userId}`, { headers: this.getHeaders() });
    return res.status === "success" && Array.isArray(res.data) ? res.data : [];
  }

  async createWorkspace(userId: string, descriptor: Partial<WorkspaceDescriptor>): Promise<WorkspaceDescriptor> {
    const res = await KrnlHTTP.post<WorkspaceDescriptor>(`${this.endpoint}/api/workspaces`, { userId, ...descriptor }, { headers: this.getHeaders() });
    if (res.status === "success" && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to create workspace on hosted account backend.");
  }

  async deleteWorkspace(_userId: string, workspaceId: string): Promise<boolean> {
    const res = await KrnlHTTP.del(`${this.endpoint}/api/workspaces/${workspaceId}`, { headers: this.getHeaders() });
    return res.status === "success";
  }
}
