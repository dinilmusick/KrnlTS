/**
 * @file BackblazeService.ts
 * @description First integration provider for Backblaze B2 Cloud Storage.
 * Conforms to Srkl-spec.md Section 15 & Section 13 Service Adapter contract.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../../core/ServiceProvider';
import { ServiceAccount } from '../../core/ServiceAccount';
import { ServiceResource } from '../../core/ServiceResource';
import { SurveillanceMetrics } from '../../types/srkl';
import { SRKLError } from '../../core/ErrorModel';
import { BACKBLAZE_DEFINITION } from './definition';
import { fetchLiveBuckets, fetchLiveBucketFiles, createLiveBucket, deleteLiveBucket, deleteLiveFile } from '../../functions/backblazeApi';

export { BACKBLAZE_DEFINITION };

export class BackblazeService extends ServiceProvider {
  constructor() {
    const now = new Date().toISOString();
    super({
      id: 'srv-backblaze-b2',
      name: BACKBLAZE_DEFINITION.name,
      identifier: BACKBLAZE_DEFINITION.identifier,
      entityType: 'SERVICE_PROVIDER',
      description: BACKBLAZE_DEFINITION.description,
      version: BACKBLAZE_DEFINITION.version,
      status: 'ONLINE',
      definition: BACKBLAZE_DEFINITION,
      providerType: 'STORAGE_B2',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async authenticate(credentials: Record<string, unknown>): Promise<boolean> {
    const keyId = credentials['keyId'] as string;
    const appKey = credentials['applicationKey'] as string;
    if (!keyId || !appKey) {
      throw new SRKLError({
        code: 'ERR_AUTH_MISSING_CREDENTIALS',
        message: 'Backblaze requires both Application Key ID and Application Key Secret',
        service: this.identifier,
        operation: 'authenticate',
      });
    }

    const res = await fetch('/api/backblaze/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId, applicationKey: appKey }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new SRKLError({
        code: 'ERR_AUTH_BACKBLAZE_REJECTED',
        message: json.error || 'Backblaze authentication failed with provided keys',
        service: this.identifier,
        operation: 'authenticate',
      });
    }
    return true;
  }

  public async getStatus(account: ServiceAccount): Promise<SurveillanceMetrics> {
    const start = performance.now();
    const creds = account.getAllCredentials();
    const buckets = await fetchLiveBuckets(creds);
    const latencyMs = Math.round(performance.now() - start);

    return {
      status: account.status,
      health: 100,
      usage: buckets.length,
      quota: 100,
      limitUnit: 'Buckets',
      resourceCount: buckets.length,
      totalSizeBytes: 0,
      lastSync: new Date().toISOString(),
      latencyMs,
    };
  }

  public async listResources(account: ServiceAccount, parentId?: string): Promise<ServiceResource[]> {
    const now = new Date().toISOString();
    const creds = account.getAllCredentials();

    if (!parentId) {
      const buckets = await fetchLiveBuckets(creds);
      return buckets.map((b) => new ServiceResource({
        id: b.id,
        name: b.name,
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'bucket',
        status: 'ACTIVE',
        supportedActions: ['LIST_OBJECTS', 'DELETE_BUCKET', 'GET_BUCKET'],
        attributes: { region: b.region, bucketType: b.type },
        createdAt: now,
        updatedAt: now,
      }));
    }

    const { items } = await fetchLiveBucketFiles(creds, parentId, parentId);
    return items.map((item) => new ServiceResource({
      id: item.fileId || item.id,
      name: item.name,
      serviceId: this.identifier,
      accountId: account.id,
      resourceType: item.type === 'folder' ? 'folder' : 'object',
      parentId,
      status: 'STORED',
      sizeBytes: item.sizeBytes,
      supportedActions: item.type === 'file' ? ['GET_OBJECT_METADATA', 'DELETE_OBJECT'] : ['LIST_OBJECTS'],
      attributes: { contentType: item.contentType, sha1: item.sha1, path: item.path },
      createdAt: item.updatedAt || now,
      updatedAt: item.updatedAt || now,
    }));
  }

  public async getResource(account: ServiceAccount, resourceId: string): Promise<ServiceResource | null> {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }

  public async executeAction(account: ServiceAccount, actionId: string, payload: Record<string, unknown>): Promise<unknown> {
    const creds = account.getAllCredentials();
    switch (actionId) {
      case 'LIST_BUCKETS':
      case 'REFRESH':
        return await fetchLiveBuckets(creds);
      case 'CREATE_BUCKET':
        return await createLiveBucket(creds, payload['name'] as string, (payload['bucketType'] as any) || 'allPrivate');
      case 'DELETE_BUCKET':
        await deleteLiveBucket(creds, payload['bucketId'] as string);
        return { status: 'DELETED', bucketId: payload['bucketId'] };
      case 'LIST_OBJECTS':
        return await fetchLiveBucketFiles(creds, payload['bucketId'] as string, payload['bucketName'] as string || '');
      case 'DELETE_OBJECT':
        await deleteLiveFile(creds, payload['fileName'] as string, payload['fileId'] as string);
        return { status: 'DELETED', fileName: payload['fileName'] };
      default:
        throw new SRKLError({ code: 'ERR_UNKNOWN_ACTION', message: `Unknown action ${actionId}`, service: this.identifier, operation: actionId });
    }
  }

  public transformResponse(response: unknown): unknown {
    return { provider: 'Backblaze B2', data: response };
  }
}
