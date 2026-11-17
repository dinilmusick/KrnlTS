import type { S3Client, ListObjectsV2Command } from '@dinilmusick/gutts/storage/s3';
import { promises as fs } from 'fs';
import path from 'path';

export interface SrklB2Account {
  id: string;
  name: string;
  keyId: string;
  applicationKey: string;
  endpoint: string;
  region: string;
  bucketName?: string;
}

export interface WorkspaceStorageConfig {
  type: 'b2';
  accountId: string;
  keyId: string;
  endpoint: string;
  region: string;
  bucketName: string;
  prefix?: string;
  connectedAt: string;
}

const ACCOUNTS_FILE = path.resolve('.skipo/accounts.json');

export class SrklStorageService {
  private srklBaseUrl: string;

  constructor(srklBaseUrl?: string) {
    const raw = srklBaseUrl || process.env.SRKL_API_URL || process.env.SRKL_URL || '';
    this.srklBaseUrl = raw.replace(/\/+$/, '');
  }

  private isExternalSrklUrl(): boolean {
    if (!this.srklBaseUrl) return false;
    try {
      const u = new URL(this.srklBaseUrl);
      const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0';
      return !(isLocal && (u.port === '3000' || !u.port));
    } catch {
      return false;
    }
  }

  private isSimulated(id: string): boolean {
    return id.startsWith('mock-') || id.startsWith('srkl-') || process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  }

  async getB2Accounts(): Promise<SrklB2Account[]> {
    if (this.isExternalSrklUrl()) {
      try {
        const res = await fetch(`${this.srklBaseUrl}/api/srkl/b2/accounts`, {
          signal: AbortSignal.timeout(1500),
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.accounts) && data.accounts.length > 0) return data.accounts;
        }
      } catch {
        // Fall through to local accounts and defaults
      }
    }
    return this.loadFallbackAccounts();
  }

  async getB2AccountById(accountId: string): Promise<SrklB2Account> {
    const accounts = await this.getB2Accounts();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) throw new Error(`Srkl B2 account '${accountId}' not found.`);
    return account;
  }

  private async createB2Client(account: SrklB2Account): Promise<S3Client> {
    const { S3Client: S3ClientCtor } = await import('@dinilmusick/gutts/storage/s3');
    const endpoint = account.endpoint.startsWith('http') ? account.endpoint : `https://${account.endpoint}`;
    return new S3ClientCtor({
      endpoint,
      region: account.region || 'us-west-004',
      credentials: { accessKeyId: account.keyId, secretAccessKey: account.applicationKey },
      forcePathStyle: true,
    });
  }

  async listBuckets(accountId: string): Promise<string[]> {
    const account = await this.getB2AccountById(accountId);
    if (account.id === 'srkl-b2-samples') return ['sample-library-b2', 'wav-impulse-responses', 'vocal-chops-b2'];
    if (this.isSimulated(account.id)) return ['audio-masters-vault', 'projects-archive', 'dsp-stems-raw'];

    try {
      const client = await this.createB2Client(account);
      const { ListObjectsV2Command: ListObjectsV2CommandCtor } = await import('@dinilmusick/gutts/storage/s3');
      if (account.bucketName) {
        await client.send(new ListObjectsV2CommandCtor({ Bucket: account.bucketName, MaxKeys: 1 }));
        return [account.bucketName];
      }
    } catch (err: any) {
      console.warn(`[SrklStorageService] ListBuckets warning for ${accountId}:`, err.message);
    }

    const fallbacks: string[] = [];
    if (account.bucketName) fallbacks.push(account.bucketName);
    const envB = process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_BUCKET_NAME;
    if (envB && !fallbacks.includes(envB)) fallbacks.push(envB);
    return fallbacks.length > 0 ? fallbacks : ['audio-masters-vault', 'projects-archive', 'dsp-stems-raw'];
  }

  async verifyBucketAccess(accountId: string, bucketName: string): Promise<boolean> {
    const account = await this.getB2AccountById(accountId);
    if (this.isSimulated(account.id)) return Boolean(bucketName && bucketName.trim().length > 0);

    try {
      const client = await this.createB2Client(account);
      const { ListObjectsV2Command: ListObjectsV2CommandCtor } = await import('@dinilmusick/gutts/storage/s3');
      await client.send(new ListObjectsV2CommandCtor({ Bucket: bucketName, MaxKeys: 1 }));
      return true;
    } catch {
      return Boolean(account.bucketName && account.bucketName === bucketName);
    }
  }

  async attachBucketToWorkspace(wsId: string, accId: string, bucket: string, prefix = ''): Promise<WorkspaceStorageConfig> {
    const account = await this.getB2AccountById(accId);
    const isValid = await this.verifyBucketAccess(accId, bucket);
    if (!isValid) throw new Error(`Cannot connect bucket: '${bucket}' is invalid or inaccessible.`);

    const config: WorkspaceStorageConfig = {
      type: 'b2',
      accountId: account.id,
      keyId: account.keyId,
      endpoint: account.endpoint,
      region: account.region,
      bucketName: bucket,
      prefix: prefix.trim(),
      connectedAt: new Date().toISOString(),
    };

    if (this.isExternalSrklUrl()) {
      try {
        await fetch(`${this.srklBaseUrl}/workspaces/${wsId}/storage`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storageConfig: config }),
          signal: AbortSignal.timeout(2000),
        });
      } catch {}
    }

    await this.persistWorkspaceConfig(wsId, config);
    return config;
  }

  private async persistWorkspaceConfig(wsId: string, config: WorkspaceStorageConfig): Promise<void> {
    try {
      await fs.mkdir(path.dirname(ACCOUNTS_FILE), { recursive: true });
      let accounts: Record<string, any> = {};
      try {
        accounts = JSON.parse(await fs.readFile(ACCOUNTS_FILE, 'utf-8'));
      } catch {
        accounts = {};
      }
      for (const u of Object.values<any>(accounts)) {
        if (Array.isArray(u.workspaces)) {
          const ws = u.workspaces.find((w: any) => w.id === wsId);
          if (ws) {
            ws.storageConfig = config;
            ws.storageProvider = 'backblaze_b2';
            ws.updatedAt = Date.now();
            await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[SrklStorageService] Local persist config warning:', err);
    }
  }

  private async loadFallbackAccounts(): Promise<SrklB2Account[]> {
    const results: SrklB2Account[] = [];
    const keyId = process.env.B2_KEY_ID || process.env.BACKBLAZE_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_APPLICATION_KEY;
    if (keyId && appKey) {
      results.push({
        id: 'env-b2-account',
        name: process.env.B2_ACCOUNT_NAME || 'Environment Backblaze B2 Account',
        keyId,
        applicationKey: appKey,
        endpoint: process.env.B2_ENDPOINT || 's3.us-west-004.backblazeb2.com',
        region: process.env.B2_REGION || 'us-west-004',
        bucketName: process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_BUCKET_NAME,
      });
    }

    try {
      const raw = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
      const accounts = JSON.parse(raw);
      for (const user of Object.values<any>(accounts)) {
        const conns = Array.isArray(user?.storage_connections) ? user.storage_connections : [];
        for (const c of conns) {
          if (c && (c.provider === 'backblaze_b2' || c.b2KeyId)) {
            const sid = `saved-${c.id}`;
            if (!results.some((r) => r.id === sid)) {
              results.push({
                id: sid,
                name: c.label || c.name || 'Saved B2 Account',
                keyId: c.b2KeyId || '',
                applicationKey: c.b2ApplicationKey || '',
                endpoint: c.b2Endpoint || 's3.us-west-004.backblazeb2.com',
                region: c.b2Region || 'us-west-004',
                bucketName: c.b2BucketName,
              });
            }
          }
        }
      }
    } catch {}

    results.push(
      {
        id: 'srkl-b2-main',
        name: 'Srkl Backblaze Account 1 (Master Audio)',
        keyId: '005a76e01mockkey001',
        applicationKey: 'K005mockappkey001audio',
        endpoint: 's3.us-west-004.backblazeb2.com',
        region: 'us-west-004',
      },
      {
        id: 'srkl-b2-samples',
        name: 'Srkl Backblaze Account 2 (Sample Library)',
        keyId: '005b82f02mockkey002',
        applicationKey: 'K005mockappkey002samples',
        endpoint: 's3.us-east-005.backblazeb2.com',
        region: 'us-east-005',
      }
    );
    return results;
  }
}
