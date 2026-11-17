/**
 * @file GithubService.ts
 * @description GitHub Code and Deployment surveillance provider.
 * Conforms to Srkl-spec.md Section 16 & Section 13.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../../core/ServiceProvider';
import { ServiceAccount } from '../../core/ServiceAccount';
import { ServiceResource } from '../../core/ServiceResource';
import { SurveillanceMetrics } from '../../types/srkl';
import { SRKLError } from '../../core/ErrorModel';
import { GITHUB_DEFINITION } from '../templates/githubDefinition';

export { GITHUB_DEFINITION };

export class GithubService extends ServiceProvider {
  constructor() {
    const now = new Date().toISOString();
    super({
      id: 'srv-github',
      name: GITHUB_DEFINITION.name,
      identifier: GITHUB_DEFINITION.identifier,
      entityType: 'SERVICE_PROVIDER',
      description: GITHUB_DEFINITION.description,
      version: GITHUB_DEFINITION.version,
      status: 'ONLINE',
      definition: GITHUB_DEFINITION,
      providerType: 'DEV_OPERATIONS',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async authenticate(credentials: Record<string, unknown>): Promise<boolean> {
    if (!credentials['token']) {
      throw new SRKLError({
        code: 'ERR_GITHUB_PAT_REQUIRED',
        message: 'GitHub requires a Personal Access Token',
        service: this.identifier,
        operation: 'authenticate',
      });
    }
    return true;
  }

  public async getStatus(account: ServiceAccount): Promise<SurveillanceMetrics> {
    return {
      status: account.status,
      health: 99.8,
      usage: 240,
      quota: 5000,
      limitUnit: 'req/hr',
      resourceCount: 8,
      totalSizeBytes: 1204000000,
      lastSync: new Date().toISOString(),
      latencyMs: 78,
    };
  }

  public async listResources(account: ServiceAccount): Promise<ServiceResource[]> {
    const now = new Date().toISOString();
    return [
      new ServiceResource({
        id: `${account.id}-repo-srkl-core`,
        name: 'srkl-service-hub',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'repository',
        status: 'PUBLIC',
        sizeBytes: 8400000,
        objectCount: 42,
        supportedActions: ['CHECK_RATE_LIMIT', 'DISPATCH_WORKFLOW'],
        attributes: { defaultBranch: 'main', openIssues: 0, stars: 128 },
        createdAt: now,
        updatedAt: now,
      }),
      new ServiceResource({
        id: `${account.id}-repo-skipo-runtime`,
        name: 'skipo-runtime-tools',
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: 'repository',
        status: 'PRIVATE',
        sizeBytes: 15400000,
        objectCount: 89,
        supportedActions: ['CHECK_RATE_LIMIT', 'DISPATCH_WORKFLOW'],
        attributes: { defaultBranch: 'main', openIssues: 1, stars: 64 },
        createdAt: now,
        updatedAt: now,
      }),
    ];
  }

  public async getResource(account: ServiceAccount, resourceId: string): Promise<ServiceResource | null> {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }

  public async executeAction(account: ServiceAccount, actionId: string, payload: Record<string, unknown>): Promise<unknown> {
    return { status: 'DISPATCHED', action: actionId, repo: payload['repo'] ?? 'srkl-service-hub', runId: Math.floor(Math.random() * 900000) };
  }

  public transformResponse(response: unknown): unknown {
    return { provider: 'GitHub', data: response };
  }
}
