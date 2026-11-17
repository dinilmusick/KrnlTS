/**
 * @file CloudflareService.ts
 * @description Cloudflare Workers, Pages, and Edge Surveillance Provider.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../../core/ServiceProvider';
import { ServiceAccount } from '../../core/ServiceAccount';
import { ServiceResource } from '../../core/ServiceResource';
import { SurveillanceMetrics } from '../../types/srkl';
import { SRKLError } from '../../core/ErrorModel';
import { CLOUDFLARE_DEFINITION } from '../templates/cloudflareDefinition';

export class CloudflareService extends ServiceProvider {
  constructor() {
    const now = new Date().toISOString();
    super({
      id: 'srv-cloudflare',
      name: CLOUDFLARE_DEFINITION.name,
      identifier: CLOUDFLARE_DEFINITION.identifier,
      entityType: 'SERVICE_PROVIDER',
      description: CLOUDFLARE_DEFINITION.description,
      version: CLOUDFLARE_DEFINITION.version,
      status: 'ONLINE',
      definition: CLOUDFLARE_DEFINITION,
      providerType: 'DEV_OPERATIONS',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async authenticate(credentials: Record<string, unknown>): Promise<boolean> {
    const hasToken = Boolean(credentials['apiToken'] || credentials['token']);
    if (!hasToken) {
      throw new SRKLError({
        code: 'ERR_CLOUDFLARE_AUTH_REQUIRED',
        message: 'Cloudflare requires an API Token',
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
      usage: 12,
      quota: 100000,
      limitUnit: 'req/day',
      resourceCount: 4,
      totalSizeBytes: 32000000,
      lastSync: new Date().toISOString(),
      latencyMs: 48,
    };
  }

  public async listResources(account: ServiceAccount): Promise<ServiceResource[]> {
    const now = new Date().toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-wrk-edge-api`,
        name: 'srkl-edge-router',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'WORKER',
        status: 'ONLINE',
        sizeBytes: 850000,
        objectCount: 1,
        supportedActions: ['READ', 'REFRESH', 'EXECUTE'],
        attributes: {
          url: 'https://srkl-edge-router.workers.dev',
          handlers: ['fetch'],
          compatibilityDate: '2024-04-01',
          createdOn: now,
        },
        createdAt: now,
        updatedAt: now,
      }),
      new ServiceResource({
        id: `${account.id}-pages-portal`,
        name: 'srkl-portal',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'PAGES_PROJECT',
        status: 'READY',
        sizeBytes: 15400000,
        objectCount: 1,
        supportedActions: ['READ', 'REFRESH'],
        attributes: {
          url: 'https://srkl-portal.pages.dev',
          subdomain: 'srkl-portal',
          productionBranch: 'main',
          createdOn: now,
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
    return { provider: 'Cloudflare', data: response };
  }
}
