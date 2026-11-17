/**
 * @file SrklClient.ts
 * @description Universal HTTP Client for querying SRKL Service Account Vaults.
 * Used across the ecosystem by client apps and gateway routers (e.g. Depm, DocuStack).
 * Strictly adheres to Skipo governance (< 200 lines).
 */

import type {
  SrklClientOptions,
  SrklServiceAccount,
  SrklEcosystemQueryOptions,
  SrklEcosystemResponse,
  AdaptedStorageConnection,
  AppAccountManifest,
  EcosystemAccount,
  EcosystemAccountsResponse,
} from './types.js';

export const CANONICAL_SRKL_URL = '';

export class SrklClient {
  private baseUrl: string;
  private userId: string;
  private token?: string;
  private workspaceId?: string;
  private getAuthHeadersCustom?: () => Record<string, string>;

  constructor(options: SrklClientOptions = {}) {
    this.baseUrl = (options.srklUrl || CANONICAL_SRKL_URL).replace(/\/+$/, '');
    this.userId = options.userId || 'usr-anon';
    this.token = options.token;
    this.workspaceId = options.workspaceId;
    this.getAuthHeadersCustom = options.getAuthHeaders;
  }

  public setBaseUrl(url: string): void { this.baseUrl = url.replace(/\/+$/, ''); }
  public getBaseUrl(): string { return this.baseUrl; }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.workspaceId) headers['x-workspace-id'] = this.workspaceId;
    if (this.getAuthHeadersCustom) Object.assign(headers, this.getAuthHeadersCustom());
    return headers;
  }

  public async checkHealth(): Promise<{ ok: boolean; latencyMs: number; status?: string }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/api/ecosystem/health`, { headers: this.buildHeaders() });
      const latencyMs = Date.now() - start;
      if (!res.ok) return { ok: false, latencyMs };
      const data = (await res.json()) as any;
      return { ok: true, latencyMs, status: data.status };
    } catch {
      return { ok: false, latencyMs: Date.now() - start };
    }
  }

  /**
   * Standardized Skipo Ecosystem Accounts Discovery Protocol.
   * Consumes an AppAccountManifest and returns uniform EcosystemAccount[] matching the app's requirements.
   */
  public async fetchEcosystemAccounts(
    manifest: AppAccountManifest,
    options: { workspaceId?: string; timeoutMs?: number } = {}
  ): Promise<EcosystemAccount[]> {
    const wsId = options.workspaceId || this.workspaceId;
    const timeout = options.timeoutMs || 6000;
    try {
      const res = await fetch(`${this.baseUrl}/api/ecosystem/accounts`, {
        method: 'POST',
        headers: { ...this.buildHeaders(), 'x-app-id': manifest.appId },
        body: JSON.stringify({ manifest, workspaceId: wsId }),
        signal: AbortSignal.timeout(timeout),
      });
      if (res.ok) {
        const data = (await res.json()) as EcosystemAccountsResponse;
        if (data.success && Array.isArray(data.accounts)) return data.accounts;
      }
    } catch (err: any) {
      console.warn('[SrklClient] /api/ecosystem/accounts call failed, falling back:', err.message);
    }

    // Fallback: Legacy /api/ecosystem/services aggregator
    try {
      const legacyServices = await this.getServices(manifest.requiredServices || [], { workspaceId: wsId });
      return legacyServices.map((s) => ({
        id: s.id,
        serviceId: s.serviceId,
        provider: (s.serviceId || 'unknown').toUpperCase(),
        category: (s.serviceId.includes('b2') || s.serviceId.includes('backblaze') || s.serviceId.includes('s3') ? 'storage' : 'deployment') as any,
        name: s.name,
        status: s.status || 'CONNECTED',
        credentials: s.credentials || {},
        metadata: s.metadata,
        createdAt: s.createdAt,
      }));
    } catch {
      return [];
    }
  }

  public async getServices(types: string[] = [], options: SrklEcosystemQueryOptions = {}): Promise<SrklServiceAccount[]> {
    const queryTypes = types.length > 0 ? types.join(',') : (options.types || []).join(',');
    const wsId = options.workspaceId || this.workspaceId;
    const url = new URL(`${this.baseUrl}/api/ecosystem/services`);
    if (queryTypes) url.searchParams.set('types', queryTypes);
    if (wsId) url.searchParams.set('workspaceId', wsId);

    const res = await fetch(url.toString(), { method: 'GET', headers: this.buildHeaders() });
    if (!res.ok) throw new Error(`SRKL service query failed (${res.status}): ${await res.text()}`);
    const data = (await res.json()) as SrklEcosystemResponse;
    return data.services || [];
  }

  public async getStorageConnections(userIdOverride?: string): Promise<any[]> {
    const headers = this.buildHeaders();
    if (userIdOverride) headers['x-user-id'] = userIdOverride;
    const res = await fetch(`${this.baseUrl}/api/workspaces/storage/connections`, { method: 'GET', headers });
    if (!res.ok) throw new Error(`SRKL storage connections query failed (${res.status})`);
    const data = (await res.json()) as any;
    return Array.isArray(data.connections) ? data.connections : [];
  }

  public async getBackblazeBuckets(keyId: string, applicationKey: string): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/api/backblaze/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId, applicationKey }),
    });
    if (!res.ok) throw new Error(`SRKL bucket listing failed (${res.status})`);
    const data = (await res.json()) as any;
    return data.buckets || [];
  }

  public static filterRelevantServices(services: SrklServiceAccount[], allowedTypes: string[]): SrklServiceAccount[] {
    const normalized = allowedTypes.map((t) => t.toLowerCase());
    return services.filter((s) => normalized.includes((s.serviceId || '').toLowerCase()));
  }

  public static adaptToStorageConnection(account: SrklServiceAccount): AdaptedStorageConnection {
    const creds = account.credentials || {};
    const sId = (account.serviceId || '').toLowerCase();
    const isB2 = sId.includes('backblaze') || sId === 'b2';
    const isGoogle = sId.includes('google_drive') || sId.includes('googledrive') || sId === 'google';
    return {
      id: `conn-srkl-${account.id}`,
      provider: isB2 ? 'backblaze_b2' : isGoogle ? 'google_drive' : 'aws_s3',
      label: `SRKL: ${account.name || (isB2 ? 'Backblaze' : 'S3')}`,
      role: 'redundant_clone',
      enabled: true,
      createdAt: account.createdAt || new Date().toISOString(),
      b2KeyId: creds.keyId || creds.b2KeyId,
      b2ApplicationKey: creds.applicationKey || creds.b2ApplicationKey,
      b2BucketName: creds.bucketName || creds.bucketId || creds.b2BucketName,
      b2Region: creds.region || creds.b2Region,
      b2Endpoint: creds.endpoint || creds.b2Endpoint,
      s3AccessKeyId: creds.accessKeyId || creds.keyId || creds.s3AccessKeyId,
      s3SecretAccessKey: creds.secretAccessKey || creds.applicationKey || creds.s3SecretAccessKey,
      s3BucketName: creds.bucketName || creds.s3BucketName,
      s3Region: creds.region || creds.s3Region,
      s3Endpoint: creds.endpoint || creds.s3Endpoint,
      googleEmail: creds.email || account.credentials?.email || account.name,
      googleRootFolderId: creds.rootFolderId,
      googleRootFolderName: creds.rootFolderName,
      googleAccessToken: creds.accessToken,
      googleAccessTokenExpiresAt: creds.accessTokenExpiresAt,
      googleRefreshToken: creds.refreshToken,
    };
  }
}

export function createSrklClient(options: SrklClientOptions = {}): SrklClient {
  return new SrklClient(options);
}
