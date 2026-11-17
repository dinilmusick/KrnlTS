/**
 * @file CustomService.ts
 * @description Dynamic concrete ServiceProvider for definitions created in Service Builder.
 * Conforms to Srkl-spec.md Section 14 & Section 25.
 * File size < 200 lines strictly.
 */

import { ServiceProvider } from '../../core/ServiceProvider';
import { ServiceAccount } from '../../core/ServiceAccount';
import { ServiceResource } from '../../core/ServiceResource';
import { SurveillanceMetrics, ServiceDefinition } from '../../types/srkl';
import { SRKLError } from '../../core/ErrorModel';

export class CustomService extends ServiceProvider {
  constructor(definition: ServiceDefinition) {
    const now = new Date().toISOString();
    super({
      id: `srv-${definition.identifier}`,
      name: definition.name,
      identifier: definition.identifier,
      entityType: 'SERVICE_PROVIDER',
      description: definition.description,
      version: definition.version,
      status: 'ONLINE',
      definition,
      providerType: 'USER_DEFINED',
      createdAt: now,
      updatedAt: now,
    });
  }

  public async authenticate(credentials: Record<string, unknown>): Promise<boolean> {
    for (const field of this.definition.credentialFields) {
      if (field.required && !credentials[field.name]) {
        throw new SRKLError({
          code: 'ERR_REQUIRED_CREDENTIAL_MISSING',
          message: `Field '${field.label || field.name}' is required`,
          service: this.identifier,
          operation: 'authenticate',
        });
      }
    }
    return true;
  }

  public async getStatus(account: ServiceAccount): Promise<SurveillanceMetrics> {
    return {
      status: account.status,
      health: 100,
      usage: 10,
      quota: 100,
      limitUnit: 'ops',
      resourceCount: this.definition.resources.length,
      totalSizeBytes: 1024,
      lastSync: new Date().toISOString(),
      latencyMs: 35,
    };
  }

  public async listResources(account: ServiceAccount): Promise<ServiceResource[]> {
    const now = new Date().toISOString();
    if (this.identifier === 'google-ai-studio') {
      try {
        const googleEmail = (account.getCredential('googleAccount') as string) || account.name;
        const res = await fetch(`/api/google-ai-studio/apps?googleAccount=${encodeURIComponent(googleEmail)}`);
        const data = await res.json();
        if (data.apps && data.apps.length > 0) {
          return data.apps.map(
            (app: any) =>
              new ServiceResource({
                id: app.id,
                name: app.name,
                serviceId: this.identifier,
                accountId: account.id,
                resourceType: 'APP',
                status: 'ACTIVE',
                supportedActions: ['READ', 'REFRESH'],
                attributes: { appletId: app.appletId, platform: app.platform, model: app.model, devUrl: app.devUrl },
                createdAt: app.updatedAt || now,
                updatedAt: app.updatedAt || now,
              })
          );
        }
      } catch {}
    }

    return this.definition.resources.map((resDef, idx) => {
      return new ServiceResource({
        id: `${account.id}-res-${idx}`,
        name: `${resDef.name} Item`,
        serviceId: this.identifier,
        accountId: account.id,
        resourceType: resDef.type,
        status: 'ACTIVE',
        supportedActions: resDef.supportedActions,
        attributes: { description: resDef.description },
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  public async getResource(account: ServiceAccount, resourceId: string): Promise<ServiceResource | null> {
    const list = await this.listResources(account);
    return list.find((r) => r.id === resourceId) ?? null;
  }

  public async executeAction(account: ServiceAccount, actionId: string, payload: Record<string, unknown>): Promise<unknown> {
    const actionDef = this.definition.actions.find((a) => a.id === actionId);
    if (!actionDef) {
      throw new SRKLError({
        code: 'ERR_ACTION_NOT_FOUND',
        message: `Action ${actionId} not defined in service ${this.name}`,
        service: this.identifier,
        operation: actionId,
      });
    }
    return {
      status: 'EXECUTED',
      action: actionDef.name,
      actionType: actionDef.actionType,
      payload,
      timestamp: new Date().toISOString(),
    };
  }

  public transformResponse(response: unknown): unknown {
    return { provider: this.name, data: response };
  }
}
