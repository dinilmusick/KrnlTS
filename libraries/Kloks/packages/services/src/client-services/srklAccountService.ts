/**
 * Canonical SRKL account client used by ecosystem applications.
 * SRKL is authoritative; applications explicitly synchronize into local state.
 */
export type EcosystemServiceCategory =
  | 'deployment' | 'storage' | 'vcs' | 'ai' | 'database' | 'general';

export interface SrklAccount {
  id: string;
  serviceId: string;
  provider: string;
  category: EcosystemServiceCategory;
  name: string;
  emailOrSlug?: string;
  status: string;
  credentials?: Record<string, unknown>;
  groupIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SrklAccountManifest {
  appId?: string;
  appName?: string;
  categories?: EcosystemServiceCategory[];
  requiredServices?: string[];
  includeCredentials?: boolean;
}

export interface SrklAccountClientOptions {
  baseUrl: string;
  userId: string;
  appId: string;
  token?: string;
  sessionToken?: string;
  fetchImpl?: typeof fetch;
}

export interface SrklAccountSyncResult {
  success: boolean;
  count: number;
  accounts: SrklAccount[];
  workspaceId: string;
}

export class SrklAccountClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly userId: string;
  private readonly appId: string;
  private readonly token?: string;
  private readonly sessionToken?: string;
  private cachedAccounts: SrklAccount[] = [];

  constructor(options: SrklAccountClientOptions) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.userId = options.userId;
    this.appId = options.appId;
    this.token = options.token;
    this.sessionToken = options.sessionToken;
  }

  async sync(manifest: SrklAccountManifest = {}): Promise<SrklAccountSyncResult> {
    const payload = {
      ...manifest,
      appId: manifest.appId || this.appId,
      includeCredentials: manifest.includeCredentials ?? true,
    };
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-user-id': this.userId,
      'x-app-id': this.appId,
    };
    if (this.token) {
      headers.authorization = this.token.startsWith('Bearer ') ? this.token : `Bearer ${this.token}`;
    }
    if (this.sessionToken) {
      headers['x-session-token'] = this.sessionToken;
    }
    const response = await this.fetchImpl(`${this.baseUrl}/api/ecosystem/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`SRKL account sync failed: ${response.status}`);
    const result = (await response.json()) as SrklAccountSyncResult;
    this.cachedAccounts = result.accounts || [];
    return result;
  }

  async list(manifest: SrklAccountManifest = {}): Promise<SrklAccountSyncResult> {
    return this.sync({
      ...manifest,
      includeCredentials: manifest.includeCredentials ?? false,
    });
  }

  getCachedAccounts(): SrklAccount[] {
    return this.cachedAccounts;
  }

  getCachedByService(serviceId: string): SrklAccount | undefined {
    return this.cachedAccounts.find((account) =>
      account.serviceId.toLowerCase() === serviceId.toLowerCase() ||
      account.provider.toLowerCase() === serviceId.toLowerCase()
    );
  }

  async getByService(serviceId: string, options?: { forceSync?: boolean }): Promise<SrklAccount | undefined> {
    if (!options?.forceSync) {
      const cached = this.getCachedByService(serviceId);
      if (cached) return cached;
    }
    const result = await this.sync({ requiredServices: [serviceId], includeCredentials: true });
    return result.accounts.find((account) =>
      account.serviceId.toLowerCase() === serviceId.toLowerCase() ||
      account.provider.toLowerCase() === serviceId.toLowerCase()
    );
  }
}

export function createSrklAccountClient(options: SrklAccountClientOptions): SrklAccountClient {
  return new SrklAccountClient(options);
}

export function mergeSrklAccounts<T extends { srklAccountId?: string; id?: string }>(
  local: T[],
  remote: SrklAccount[],
): T[] {
  const remoteIds = new Set(remote.map((account) => account.id));
  const byRemoteId = new Map(local.filter((item) => item.srklAccountId).map((item) => [item.srklAccountId!, item]));
  const merged = remote.map((account) => ({
    ...(byRemoteId.get(account.id) || {}),
    ...account,
    srklAccountId: account.id,
    syncedAt: new Date().toISOString(),
    source: 'SRKL' as const,
  })) as unknown as T[];

  // Preserve unrelated local records; synchronized SRKL records are replaced above.
  for (const item of local) {
    if (item.srklAccountId && remoteIds.has(item.srklAccountId)) continue;
    if (!item.srklAccountId) merged.push(item);
  }
  return merged;
}
