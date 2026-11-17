// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM DATABASE & ENVIRONMENT CONFIGURATION SERVICE (SKIPO INVARIANT I2)
// ══════════════════════════════════════════════════════════════════════════════
import { AdminDatabaseClusterConfig, DatabaseConnectionEntry } from '@kloks/state-graph';

export interface SystemEnvironmentStatus {
  databaseUrlConfigured: boolean;
  databaseUrlMasked: string | null;
  systemDbEngine: string;
  adminEmail: string;
  hasAdminPasswordConfigured: boolean;
  hasReplicas: boolean;
  replicaCount: number;
  databaseAuthTokenConfigured: boolean;
  appUrl: string;
}

export interface SystemTelemetry {
  memoryUsageMb: number;
  uptimeSeconds: number;
  nodeVersion?: string;
  activeConnections: number;
}

import { SystemDbServiceUISchema } from './systemDb.ui.js';
import type { ServiceUISchema } from '@kloks/contracts';

export class SystemDbService {
  static readonly ui: ServiceUISchema = SystemDbServiceUISchema;
  readonly ui: ServiceUISchema = SystemDbServiceUISchema;
  private envStatus: SystemEnvironmentStatus = {
    databaseUrlConfigured: false,
    databaseUrlMasked: null,
    systemDbEngine: 'postgres',
    adminEmail: 'admin@depm.vault',
    hasAdminPasswordConfigured: true,
    hasReplicas: false,
    replicaCount: 0,
    databaseAuthTokenConfigured: false,
    appUrl: 'http://localhost:3000',
  };

  private telemetry: SystemTelemetry = {
    memoryUsageMb: 42,
    uptimeSeconds: 120,
    activeConnections: 1,
  };

  private cluster: AdminDatabaseClusterConfig = {
    syncPolicy: 'async_replication',
    autoFailover: true,
    healthCheckIntervalSeconds: 30,
    databases: [],
  };

  private listeners: Set<() => void> = new Set();

  constructor() {}

  async refreshStatus() {
    try {
      const res = await fetch('/api/system/env-config');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.envStatus = data.environment;
          if (data.telemetry) this.telemetry = data.telemetry;
        }
      }
    } catch {
      // Fallback in case of client-only mode
    }

    try {
      const clusterRes = await fetch('/api/admin/backend');
      if (clusterRes.ok) {
        const data = await clusterRes.json();
        if (data.success && data.cluster) {
          this.cluster = data.cluster;
          if (data.telemetry) this.telemetry = { ...this.telemetry, ...data.telemetry };
        }
      }
    } catch {
      // Fallback
    }

    this.notify();
  }

  getEnvStatus(): SystemEnvironmentStatus {
    return { ...this.envStatus };
  }

  getTelemetry(): SystemTelemetry {
    return { ...this.telemetry };
  }

  getCluster(): AdminDatabaseClusterConfig {
    return { ...this.cluster };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async testEntry(entry: DatabaseConnectionEntry): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    try {
      const res = await fetch('/api/admin/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_entry', entry }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Probe failed' };
    }
  }

  async testAllDatabases(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_cluster' }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Cluster test failed' };
    }
  }

  async syncRedundancy(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_redundancy' }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Sync failed' };
    }
  }

  async addDatabase(entry: Partial<DatabaseConnectionEntry>): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/admin/backend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_database', entry }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return { success: data.success };
    } catch {
      return { success: false };
    }
  }

  async setPrimaryDatabase(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/admin/backend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_database', id, updates: { role: 'primary', enabled: true } }),
      });
      const data = await res.json();
      await this.refreshStatus();
      return { success: data.success };
    } catch {
      return { success: false };
    }
  }

  async deleteDatabase(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/admin/backend?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      await this.refreshStatus();
      return { success: data.success };
    } catch {
      return { success: false };
    }
  }
}

export const systemDbService = new SystemDbService();
