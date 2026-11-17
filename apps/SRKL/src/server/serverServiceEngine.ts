/**
 * @file serverServiceEngine.ts
 * @description Server-side service execution & definition manager.
 * File size < 200 lines strictly.
 */

import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition, EndpointDefinition, ServiceGroup, ServiceTab } from '@/libraries/types/srkl';
import { DEFAULT_SERVICE_GROUPS, DEFAULT_SERVICE_TABS } from '@/libraries/services/groupTabDefaults';
import { broadcastTelemetry } from './telemetryBus';
import { addAuditLog } from './audit';
import { dispatchEndpoint } from './endpointDispatcher';

// In-memory runtime cache for non-secret presentation state only.
const runtimeDefinitions = new Map<string, ServiceDefinition>();
let runtimeGroups: ServiceGroup[] = [...DEFAULT_SERVICE_GROUPS];
let runtimeTabs: ServiceTab[] = [...DEFAULT_SERVICE_TABS];

let runtimeSettings = {
  dockPosition: 'bottom',
  autoHideDock: false,
  theme: 'black_and_gold',
  autoSyncIntervalSec: 60,
};

export function getRuntimeSettings() { return runtimeSettings; }
export function updateRuntimeSettings(partial: Record<string, unknown>) {
  runtimeSettings = { ...runtimeSettings, ...partial } as any;
  broadcastTelemetry({ type: 'SETTINGS_UPDATED', payload: runtimeSettings });
  return runtimeSettings;
}

export function getRuntimeGroups(): ServiceGroup[] { return runtimeGroups; }
export function setRuntimeGroup(group: ServiceGroup): void {
  const idx = runtimeGroups.findIndex((g) => g.id === group.id);
  if (idx >= 0) runtimeGroups[idx] = group; else runtimeGroups.push(group);
  broadcastTelemetry({ type: 'SERVICE_GROUPS_UPDATED', payload: runtimeGroups });
}
export function removeRuntimeGroup(id: string): boolean {
  const prev = runtimeGroups.length;
  runtimeGroups = runtimeGroups.filter((g) => g.id !== id);
  const changed = runtimeGroups.length < prev;
  if (changed) broadcastTelemetry({ type: 'SERVICE_GROUPS_UPDATED', payload: runtimeGroups });
  return changed;
}
export function bulkSetRuntimeGroups(groups: ServiceGroup[]): void {
  runtimeGroups = groups;
  broadcastTelemetry({ type: 'SERVICE_GROUPS_UPDATED', payload: runtimeGroups });
}

export function getRuntimeTabs(): ServiceTab[] { return runtimeTabs; }
export function setRuntimeTab(tab: ServiceTab): void {
  const idx = runtimeTabs.findIndex((t) => t.id === tab.id);
  if (idx >= 0) runtimeTabs[idx] = tab; else runtimeTabs.push(tab);
  broadcastTelemetry({ type: 'SERVICE_TABS_UPDATED', payload: runtimeTabs });
}
export function removeRuntimeTab(id: string): boolean {
  const prev = runtimeTabs.length;
  runtimeTabs = runtimeTabs.filter((t) => t.id !== id);
  const changed = runtimeTabs.length < prev;
  if (changed) broadcastTelemetry({ type: 'SERVICE_TABS_UPDATED', payload: runtimeTabs });
  return changed;
}
export function bulkSetRuntimeTabs(tabs: ServiceTab[]): void {
  runtimeTabs = tabs;
  broadcastTelemetry({ type: 'SERVICE_TABS_UPDATED', payload: runtimeTabs });
}

export function getServerRegistry(): ServiceRegistry {
  const reg = new ServiceRegistry();
  for (const def of ServiceRegistry.getAvailableTemplates()) reg.registerTemplate(def.identifier);
  for (const def of runtimeDefinitions.values()) reg.registerCustomDefinition(def);
  return reg;
}

export function getAllDefinitions(): ServiceDefinition[] {
  return getServerRegistry().getAllDefinitions();
}

export function getDefinitionById(id: string): ServiceDefinition | undefined {
  return getAllDefinitions().find((d) => d.identifier === id);
}

export function registerServerDefinition(def: ServiceDefinition): ServiceDefinition {
  runtimeDefinitions.set(def.identifier, def);
  broadcastTelemetry({ type: 'SERVICE_DEFINITION_REGISTERED', serviceId: def.identifier, payload: def });
  return def;
}

export function removeServerDefinition(id: string): boolean {
  const exists = runtimeDefinitions.has(id);
  runtimeDefinitions.delete(id);
  if (exists) broadcastTelemetry({ type: 'SERVICE_DEFINITION_REMOVED', serviceId: id });
  return exists;
}

export async function executeServerAction(
  serviceId: string,
  actionId: string,
  payload: Record<string, unknown> = {},
  account?: ServiceAccount,
  actorId = 'agent-system'
): Promise<unknown> {
  const startTime = Date.now();
  const reg = getServerRegistry();
  const provider = reg.get(serviceId);
  if (!provider) throw new Error(`Provider for service "${serviceId}" is not registered`);

  const targetAccount = account || new ServiceAccount({
    id: `temp-${serviceId}`,
    entityType: 'ACCOUNT',
    serviceId,
    name: provider.name,
    credentials: {},
    status: 'ONLINE',
    lastSync: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  try {
    const result = await provider.executeAction(targetAccount, actionId, payload);
    const durationMs = Date.now() - startTime;
    await addAuditLog('ACTION_EXECUTE_SUCCESS', actorId, `Executed ${actionId} on ${serviceId} (${durationMs}ms)`, 'service_engine');
    broadcastTelemetry({ type: 'ACTION_EXECUTED', serviceId, action: actionId, payload: { status: 'SUCCESS', durationMs, result } });
    return result;
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    await addAuditLog('ACTION_EXECUTE_FAILED', actorId, `Failed ${actionId} on ${serviceId}: ${msg}`, 'service_engine');
    broadcastTelemetry({ type: 'ACTION_EXECUTED', serviceId, action: actionId, payload: { status: 'FAILED', durationMs, error: msg } });
    throw err;
  }
}

export async function executeServerEndpoint(
  endpoint: EndpointDefinition,
  serviceId: string,
  params: { pathParams?: Record<string, string>; queryParams?: Record<string, string>; headers?: Record<string, string>; body?: unknown },
  account?: ServiceAccount
): Promise<unknown> {
  const result = await dispatchEndpoint(endpoint, serviceId, params, account);
  broadcastTelemetry({
    type: 'ENDPOINT_EXECUTED',
    serviceId,
    action: endpoint.name,
    payload: { method: endpoint.method, path: endpoint.path, durationMs: result.durationMs, status: result.statusCode },
  });
  return result;
}
