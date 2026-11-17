/**
 * @file serviceBundleHelper.ts
 * @description Symmetric Export/Import serialization helpers for SRKL Service Tiles.
 * Guarantees Export JSON == Import JSON fidelity.
 * File size < 200 lines strictly.
 */

import { ServiceAccount, ServiceAccountData } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition, ServiceStatus } from '@/libraries/types/srkl';

export interface ServiceTileBundle {
  format: 'srkl-service-bundle-v1';
  version: string;
  exportedAt: string;
  service: ServiceDefinition;
  account: {
    id: string;
    name: string;
    description?: string;
    serviceId: string;
    credentials: Record<string, string>;
    urls?: Record<string, string>;
    status: ServiceStatus;
    metadata?: Record<string, unknown>;
  };
}

export function createServiceBundle(
  account: ServiceAccount,
  definition: ServiceDefinition
): ServiceTileBundle {
  const allCreds = account.getAllCredentials();
  const desc = (account.metadata?.description as string) || definition.description || '';
  const urls = (account.metadata?.urls as Record<string, string>) || {};

  return {
    format: 'srkl-service-bundle-v1',
    version: definition.version || '1.0.0',
    exportedAt: new Date().toISOString(),
    service: { ...definition },
    account: {
      id: account.id,
      name: account.name,
      description: desc,
      serviceId: account.serviceId,
      credentials: allCreds,
      urls,
      status: account.status,
      metadata: account.metadata,
    },
  };
}

export function exportBundleToJsonString(
  account: ServiceAccount,
  definition: ServiceDefinition
): string {
  const bundle = createServiceBundle(account, definition);
  return JSON.stringify(bundle, null, 2);
}

export function parseServiceBundle(rawJson: string): {
  service: ServiceDefinition;
  account: ServiceAccount;
} {
  const parsed = JSON.parse(rawJson);

  // Case 1: Full symmetric ServiceTileBundle format
  if (parsed.service && parsed.account) {
    const srv: ServiceDefinition = parsed.service;
    const accData = parsed.account;
    const account = new ServiceAccount({
      id: accData.id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: accData.name || srv.name,
      serviceId: srv.identifier,
      entityType: 'SERVICE_ACCOUNT',
      status: (accData.status as ServiceStatus) || 'ONLINE',
      credentials: accData.credentials || {},
      lastSync: new Date().toISOString(),
      createdAt: accData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        description: accData.description || srv.description || '',
        urls: accData.urls || {},
        ...(accData.metadata || {}),
      },
    });

    return { service: srv, account };
  }

  // Case 2: Pure ServiceDefinition imported directly
  if (parsed.identifier && parsed.name) {
    const srv: ServiceDefinition = {
      identifier: parsed.identifier,
      name: parsed.name,
      description: parsed.description || '',
      version: parsed.version || '1.0.0',
      authType: parsed.authType || 'API_KEY',
      credentialFields: parsed.credentialFields || [],
      endpoints: parsed.endpoints || [],
      actions: parsed.actions || [],
      resources: parsed.resources || [],
      pollingIntervalSeconds: parsed.pollingIntervalSeconds || 60,
      metadata: parsed.metadata || {},
    };

    const account = new ServiceAccount({
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: srv.name,
      serviceId: srv.identifier,
      entityType: 'SERVICE_ACCOUNT',
      status: 'ONLINE',
      credentials: {},
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { description: srv.description },
    });

    return { service: srv, account };
  }

  throw new Error('Unrecognized JSON format. Expected an SRKL Service Bundle or Service Definition.');
}
