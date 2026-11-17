// ══════════════════════════════════════════════════════════════════════════════
// SRKL CREDENTIAL REGISTRY (VOLATILE IN-MEMORY ONLY)
// Zero disk persistence. Plaintext resides exclusively in JavaScript RAM.
// ══════════════════════════════════════════════════════════════════════════════

import { ServiceAccountEntry, CredentialRegistryMap } from './types.js';

export class SrklCredentialRegistry {
  private registry: Map<string, ServiceAccountEntry[]> = new Map();

  constructor() {}

  /**
   * Populate the in-memory registry directly from an initialized sql.js Database instance.
   * Performs the set intersection: DB.services ∩ DEPM.supported_services.
   */
  public populateFromSqlite(db: any, supportedServices: string[]): void {
    this.registry.clear();
    const normalizedSupported = new Set(supportedServices.map((s) => s.toLowerCase().trim()));

    try {
      const res = db.exec('SELECT * FROM srkl_service_accounts');
      if (!res || !res.length) return;

      const { columns, values } = res[0];
      for (const row of values) {
        const item: any = {};
        columns.forEach((col: string, idx: number) => {
          item[col] = row[idx];
        });

        const serviceId = (item.service_id || '').toLowerCase().trim();

        // Enforce intersection: only load credentials for supported services
        if (normalizedSupported.size > 0 && !normalizedSupported.has(serviceId)) {
          continue;
        }

        let credentials = {};
        let metadata = {};
        try { credentials = JSON.parse(item.credentials_json || '{}'); } catch {}
        try { metadata = JSON.parse(item.metadata_json || '{}'); } catch {}

        const entry: ServiceAccountEntry = {
          id: item.id,
          serviceId: item.service_id,
          name: item.name,
          credentials,
          status: item.status,
          lastSync: item.last_sync,
          metadata,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };

        const existing = this.registry.get(entry.serviceId) || [];
        existing.push(entry);
        this.registry.set(entry.serviceId, existing);
      }
    } catch (err: any) {
      console.warn('[SrklCredentialRegistry] Failed to query srkl_service_accounts table:', err.message);
    }
  }

  /**
   * Register a service account in volatile memory (for manual entry or synced accounts)
   */
  public registerServiceAccount(account: ServiceAccountEntry): void {
    const serviceId = (account.serviceId || '').toLowerCase().trim();
    if (!serviceId) return;

    if (!this.registry.has(serviceId)) {
      this.registry.set(serviceId, []);
    }
    const existing = this.registry.get(serviceId)!;
    const idx = existing.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      existing[idx] = account;
    } else {
      existing.push(account);
    }
  }

  public getAccountsForService(serviceId: string): ServiceAccountEntry[] {
    return this.registry.get(serviceId.toLowerCase().trim()) || [];
  }

  public getPrimaryAccount(serviceId: string): ServiceAccountEntry | null {
    const list = this.getAccountsForService(serviceId);
    return list[0] || null;
  }

  public hasCredentials(serviceId: string): boolean {
    const list = this.getAccountsForService(serviceId);
    return list.length > 0;
  }

  public listAvailableServices(): string[] {
    return Array.from(this.registry.keys());
  }

  public toMap(): CredentialRegistryMap {
    const obj: CredentialRegistryMap = {};
    for (const [sId, accounts] of this.registry.entries()) {
      obj[sId] = accounts;
    }
    return obj;
  }

  public clear(): void {
    this.registry.clear();
  }
}

export const globalCredentialRegistry = new SrklCredentialRegistry();
