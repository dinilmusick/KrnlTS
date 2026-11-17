/**
 * @file VercelService.ts
 * @description Vercel deployments, projects, and platform surveillance provider.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../../core/ServiceProvider';
import { ServiceAccount } from '../../core/ServiceAccount';
import { ServiceResource } from '../../core/ServiceResource';
import { SurveillanceMetrics } from '../../types/srkl';
import { SRKLError } from '../../core/ErrorModel';
import { VERCEL_DEFINITION } from '../templates/vercelDefinition';

export class VercelService extends ServiceProvider {
  constructor() {
    const now = new Date().toISOString();
    super({
      id: 'srv-vercel',
      name: VERCEL_DEFINITION.name,
      identifier: VERCEL_DEFINITION.identifier,
      entityType: 'SERVICE_PROVIDER',
      description: VERCEL_DEFINITION.description,
      version: VERCEL_DEFINITION.version,
      status: 'ONLINE',
      definition: VERCEL_DEFINITION,
      providerType: 'DEV_OPERATIONS',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async authenticate(credentials: Record<string, unknown>): Promise<boolean> {
    if (!credentials['token']) {
      throw new SRKLError({
        code: 'ERR_VERCEL_TOKEN_REQUIRED',
        message: 'Vercel requires a Personal Access Token (Bearer token)',
        service: this.identifier,
        operation: 'authenticate',
      });
    }
    return true;
  }

  public async getStatus(account: ServiceAccount): Promise<SurveillanceMetrics> {
    return {
      status: account.status,
      health: 100,
      usage: 18,
      quota: 100,
      limitUnit: 'deployments/day',
      resourceCount: 6,
      totalSizeBytes: 84000000,
      lastSync: new Date().toISOString(),
      latencyMs: 64,
    };
  }

  public async listResources(account: ServiceAccount): Promise<ServiceResource[]> {
    const now = new Date().toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-dpl-production-hub`,
        name: 'srkl-hub-app',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'DEPLOYMENT',
        status: 'READY',
        sizeBytes: 14200000,
        objectCount: 1,
        supportedActions: ['READ', 'REFRESH'],
        attributes: {
          url: 'https://srkl-hub-app.vercel.app',
          target: 'production',
          branch: 'main',
          state: 'READY',
          createdAt: now,
        },
        createdAt: now,
        updatedAt: now,
      }),
      new ServiceResource({
        id: `${account.id}-dpl-preview-skipo`,
        name: 'skipo-runtime-preview',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'DEPLOYMENT',
        status: 'READY',
        sizeBytes: 9800000,
        objectCount: 1,
        supportedActions: ['READ', 'REFRESH'],
        attributes: {
          url: 'https://skipo-runtime-preview.vercel.app',
          target: 'preview',
          branch: 'feat/services-v2',
          state: 'READY',
          createdAt: now,
        },
        createdAt: now,
        updatedAt: now,
      }),
    ];
  }

  public async getResource(account: ServiceAccount, resourceId: string): Promise<ServiceResource | null> {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }

  public async executeAction(
    account: ServiceAccount,
    actionId: string,
    payload: Record<string, unknown>
  ): Promise<unknown> {
    return {
      status: 'SUCCESS',
      service: this.identifier,
      action: actionId,
      account: account.name,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  public transformResponse(response: unknown): unknown {
    return { provider: 'Vercel', data: response };
  }
}
