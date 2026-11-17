import {
  UserStorageConnection,
  AdminDatabaseClusterConfig,
  DatabaseConnectionEntry,
} from '@kloks/state-graph';
import { authService } from '../authService';
import { systemDbService } from '../systemDbService';
import {
  STORAGE_KEY_CONNECTIONS,
  CLEAN_DATABASE_CLUSTER,
  DEFAULT_CONNECTIONS,
} from './helpers';
import { StorageServiceUISchema } from './storage.ui.js';
import type { ServiceUISchema } from '@kloks/contracts';

type StorageListener = () => void;

class StorageService {
  static readonly ui: ServiceUISchema = StorageServiceUISchema;
  readonly ui: ServiceUISchema = StorageServiceUISchema;

  private connections: UserStorageConnection[] = [];
  private clusterConfig: AdminDatabaseClusterConfig = CLEAN_DATABASE_CLUSTER;
  private listeners: Set<StorageListener> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof window !== 'undefined') {
        const storedConn = localStorage.getItem(STORAGE_KEY_CONNECTIONS);
        if (storedConn) {
          this.connections = JSON.parse(storedConn);
        } else {
          const userConns = authService.getUserStorageConnections();
          if (userConns.length > 0) {
            this.connections = userConns;
          } else {
            this.connections = [...DEFAULT_CONNECTIONS];
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private persistState() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(this.connections));
      }
      authService.updateCurrentUserStorage(this.connections);
    } catch {
      // ignore
    }
    this.notify();
  }

  subscribe(listener: StorageListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getConnections(): UserStorageConnection[] {
    return [...this.connections];
  }

  getConnectionById(id?: string): UserStorageConnection | undefined {
    if (!id) return undefined;
    return this.connections.find((c) => c.id === id);
  }

  getPrimaryConnection(): UserStorageConnection | undefined {
    return this.connections.find((c) => c.role === 'primary') || this.connections[0];
  }

  getStorageLocationInfo(ws: {
    id?: string;
    name?: string;
    storageProvider?: string;
    storageConnectionId?: string;
    localFolderName?: string;
    workspacePath?: string;
    b2BucketName?: string;
    b2Endpoint?: string;
    b2Region?: string;
  }): {
    provider: string;
    providerLabel: string;
    displayLabel: string;
    targetUrl: string | null;
    localPath: string;
    bucketName?: string;
    isLocal: boolean;
    isCloud: boolean;
    connection?: UserStorageConnection;
  } {
    const conn = ws.storageConnectionId ? this.getConnectionById(ws.storageConnectionId) : this.getPrimaryConnection();
    const provider = ws.storageProvider || conn?.provider || 'local_fs';
    const isLocal = provider === 'local_fs';
    const isCloud = !isLocal;
    const wsId = ws.id || 'default';
    const folderName = ws.localFolderName || conn?.localFolderName || ws.name || 'Depm-Vault';
    const localPath = `data/workspaces/${wsId}`;

    if (provider === 'backblaze_b2') {
      const bucket = ws.b2BucketName || conn?.b2BucketName || 'ultrst-apps';
      const endpoint = ws.b2Endpoint || conn?.b2Endpoint || 's3.eu-central-003.backblazeb2.com';
      // Direct Backblaze bucket / file browse URL
      const targetUrl = `https://secure.backblaze.com/b2_browse_files.htm?bucketName=${encodeURIComponent(bucket)}`;
      return {
        provider: 'backblaze_b2',
        providerLabel: 'Backblaze B2',
        displayLabel: `B2 Bucket: ${bucket}`,
        targetUrl,
        localPath,
        bucketName: bucket,
        isLocal: false,
        isCloud: true,
        connection: conn,
      };
    }

    if (provider === 'cloudflare_r2') {
      const bucket = conn?.r2BucketName || 'depm-node-graphs';
      return {
        provider: 'cloudflare_r2',
        providerLabel: 'Cloudflare R2',
        displayLabel: `R2 Bucket: ${bucket}`,
        targetUrl: 'https://dash.cloudflare.com/',
        localPath,
        bucketName: bucket,
        isLocal: false,
        isCloud: true,
        connection: conn,
      };
    }

    if (provider === 'aws_s3') {
      const bucket = conn?.s3BucketName || 'depm-node-graphs';
      const region = conn?.s3Region || 'us-east-1';
      return {
        provider: 'aws_s3',
        providerLabel: 'AWS S3',
        displayLabel: `S3 Bucket: ${bucket}`,
        targetUrl: `https://s3.console.aws.amazon.com/s3/buckets/${bucket}?region=${region}&prefix=${wsId}/`,
        localPath,
        bucketName: bucket,
        isLocal: false,
        isCloud: true,
        connection: conn,
      };
    }

    if (provider === 'supabase_storage') {
      const bucket = conn?.supabaseBucketName || 'depm-graphs';
      const baseUrl = conn?.supabaseUrl ? conn.supabaseUrl.replace(/\/+$/, '') : 'https://supabase.com/dashboard';
      return {
        provider: 'supabase_storage',
        providerLabel: 'Supabase Storage',
        displayLabel: `Supabase Bucket: ${bucket}`,
        targetUrl: `${baseUrl}/storage/buckets/${bucket}`,
        localPath,
        bucketName: bucket,
        isLocal: false,
        isCloud: true,
        connection: conn,
      };
    }

    // Default: local_fs
    return {
      provider: 'local_fs',
      providerLabel: 'Local Folder',
      displayLabel: `Local Vault: ${folderName}`,
      targetUrl: null,
      localPath,
      isLocal: true,
      isCloud: false,
      connection: conn,
    };
  }


  saveConnection(conn: UserStorageConnection): UserStorageConnection {
    const existingIndex = this.connections.findIndex((c) => c.id === conn.id);
    if (existingIndex >= 0) {
      this.connections[existingIndex] = { ...conn, updatedAt: new Date().toISOString() };
    } else {
      if (this.connections.length === 0 || conn.role === 'primary') {
        this.connections.forEach((c) => (c.role = 'redundant_clone'));
        conn.role = 'primary';
      } else if (!conn.role) {
        conn.role = 'redundant_clone';
      }
      this.connections.push(conn);
    }
    this.persistState();
    return conn;
  }

  setPrimaryConnection(id: string) {
    this.connections = this.connections.map((c) => ({
      ...c,
      role: c.id === id ? 'primary' : 'redundant_clone',
    }));
    this.persistState();
  }

  deleteConnection(id: string) {
    this.connections = this.connections.filter((c) => c.id !== id);
    if (this.connections.length > 0 && !this.connections.some((c) => c.role === 'primary')) {
      this.connections[0].role = 'primary';
    }
    this.persistState();
  }

  async testConnection(conn: UserStorageConnection): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    try {
      const res = await fetch('/api/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection: conn }),
      });
      const data = await res.json();
      const latencyMs = data.latencyMs || 10;

      const match = this.connections.find((c) => c.id === conn.id);
      if (match) {
        match.testedAt = new Date().toISOString();
        match.testStatus = data.success ? 'ok' : 'failed';
        match.latencyMs = latencyMs;
        this.persistState();
      }

      if (data.success) {
        return { success: true, latencyMs };
      } else {
        return { success: false, latencyMs, error: data.error || 'Connection probe failed' };
      }
    } catch (err: any) {
      return { success: false, latencyMs: 50, error: err.message || 'Storage probe connection failed' };
    }
  }

  getClusterConfig(): AdminDatabaseClusterConfig {
    return systemDbService.getCluster();
  }

  addDatabaseEntry(entry: Omit<DatabaseConnectionEntry, 'id'>): DatabaseConnectionEntry {
    const newEntry: DatabaseConnectionEntry = {
      ...entry,
      id: `db_${entry.engine}_${Date.now()}`,
      status: 'connected',
      latencyMs: Math.round(15 + Math.random() * 30),
      recordsCloned: 24,
      lastSyncedAt: new Date().toISOString(),
    };
    systemDbService.addDatabase(newEntry);
    return newEntry;
  }

  updateDatabaseEntry(id: string, updates: Partial<DatabaseConnectionEntry>) {
    if (updates.role === 'primary') {
      systemDbService.setPrimaryDatabase(id);
    }
  }

  deleteDatabaseEntry(id: string) {
    systemDbService.deleteDatabase(id);
  }

  async syncRedundancyCluster(): Promise<{ success: boolean; message: string }> {
    return systemDbService.syncRedundancy();
  }
}

export const storageService = new StorageService();
export { StorageService };
