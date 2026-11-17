// ══════════════════════════════════════════════════════════════════════════════
// SRKL VAULT ACCESS CLIENT (CLIENT-SIDE ORCHESTRATOR)
// Presigned URL -> Cloud Storage -> Web Crypto AES-256-GCM -> WASM SQLite
// ══════════════════════════════════════════════════════════════════════════════

import { SrklVaultAccessResponse } from './types.js';
import { decryptVaultBufferInBrowser } from './SrklCryptoClient.js';
import { SrklCredentialRegistry } from './SrklCredentialRegistry.js';

export interface VaultAccessClientOptions {
  srklApiBaseUrl: string;
  appId: string;
  supportedServices: string[];
}

export class SrklVaultAccessClient {
  private registry = new SrklCredentialRegistry();
  private activeGrant: SrklVaultAccessResponse | null = null;
  private sqlEngine: any = null;

  constructor(private readonly options: VaultAccessClientOptions) {}

  /**
   * Initialize sql.js engine (WASM).
   * Consumers can pass pre-loaded initSqlJs or let this load from window or CDN.
   */
  public async initSqlEngine(customInitSqlJs?: any): Promise<any> {
    if (this.sqlEngine) return this.sqlEngine;
    const initFn = customInitSqlJs || (typeof window !== 'undefined' && (window as any).initSqlJs);
    if (!initFn) {
      throw new Error(
        'sql.js engine not found. Ensure "sql.js" is installed or <script src="sql-wasm.js"> is loaded.'
      );
    }
    this.sqlEngine = await initFn({
      locateFile: (file: string) => `/${file}`,
    });
    return this.sqlEngine;
  }

  /**
   * Full pipeline: Authorize → Presigned URL → Direct Download → Decrypt → SQLite Query → Registry.
   */
  public async loadCredentials(
    userSessionToken: string,
    workspaceId?: string,
    customInitSqlJs?: any
  ): Promise<SrklCredentialRegistry> {
    await this.initSqlEngine(customInitSqlJs);

    const baseUrl = this.options.srklApiBaseUrl.replace(/\/+$/, '');
    let res: Response;

    // 1. Request presigned URL and decryption key from SRKL server
    try {
      res = await fetch(`${baseUrl}/api/ecosystem/vault-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSessionToken}`,
          'x-app-id': this.options.appId,
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        body: JSON.stringify({
          appId: this.options.appId,
          workspaceId,
          supportedServices: this.options.supportedServices,
        }),
      });
    } catch (fetchErr: any) {
      // If primary SRKL server URL is unreachable (e.g. sandbox without internet or mock mode),
      // try fallback to local backend ecosystem endpoint if available
      try {
        res = await fetch('/api/ecosystem/vault-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSessionToken}`,
            'x-app-id': this.options.appId,
            ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
          },
          body: JSON.stringify({
            appId: this.options.appId,
            workspaceId,
            supportedServices: this.options.supportedServices,
          }),
        });
      } catch {
        throw new Error(`[SrklVaultAccess] Connection to SRKL Engine (${baseUrl}) failed: ${fetchErr.message}`);
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`[SrklVaultAccess] Failed to authorize vault access: ${err.error || res.statusText}`);
    }

    const grant: SrklVaultAccessResponse = await res.json();
    this.activeGrant = grant;

    // 2. Fetch encrypted SQLite database directly from Backblaze B2 / Cloudflare R2 / S3
    const bucketResponse = await fetch(grant.presignedUrl);
    if (!bucketResponse.ok) {
      throw new Error(
        `[SrklVaultAccess] Direct cloud bucket download failed (${bucketResponse.status}): ${bucketResponse.statusText}`
      );
    }

    const encryptedArrayBuffer = await bucketResponse.arrayBuffer();

    // 3. Decrypt in browser memory using Web Crypto API
    const decryptedSqliteBytes = await decryptVaultBufferInBrowser(
      encryptedArrayBuffer,
      grant.keyMaterial.secretHex
    );

    // 4. Open in-memory SQLite database via WebAssembly
    const db = new this.sqlEngine.Database(decryptedSqliteBytes);

    try {
      // 5. Populate in-memory registry with intersection (DEPM.supported_services ∩ SRKL.services)
      this.registry.populateFromSqlite(db, this.options.supportedServices);
    } finally {
      // Free SQLite memory handle after reading credentials
      db.close();
    }

    return this.registry;
  }

  public getRegistry(): SrklCredentialRegistry {
    return this.registry;
  }

  public getActiveGrant(): SrklVaultAccessResponse | null {
    return this.activeGrant;
  }

  public clear(): void {
    this.registry.clear();
    this.activeGrant = null;
  }
}
