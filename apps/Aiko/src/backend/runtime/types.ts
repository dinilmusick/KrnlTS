import type { Credential } from '../types/credentials.js';

export const RUNTIME_LIFECYCLE_STATES = ['creating', 'ready', 'running', 'stopped', 'failed', 'terminating', 'terminated', 'unknown'] as const;
export type RuntimeLifecycle = typeof RUNTIME_LIFECYCLE_STATES[number];
export type RuntimePersistence = 'transient' | 'persistent';
export type RuntimeCapability = 'exec' | 'filesystem' | 'ssh' | 'http' | 'ports' | 'persistent';

export interface RuntimeAccessDescriptor {
  kind: 'ssh' | 'https' | 'api' | 'websocket' | 'exec' | 'filesystem' | 'ports';
  endpoint?: string;
  reference?: string;
  metadata?: Record<string, string | number | boolean>;
}
export interface RuntimeResourceDescription { kind: string; details: Record<string, unknown>; }
export interface RuntimeAccount {
  id: string; workspaceId: string; providerId: string; displayName: string; credentialRef: string;
  capabilities?: RuntimeCapability[]; metadata?: Record<string, string | number | boolean>;
  createdAt: string; updatedAt: string;
}
export interface RuntimeHandle {
  schemaVersion: '1.0.0'; id: string; workspaceId: string; providerId: string; accountId: string;
  providerRuntimeId: string; persistence: RuntimePersistence; lifecycle: RuntimeLifecycle;
  capabilities: RuntimeCapability[];
  access: Partial<Record<RuntimeCapability | 'api' | 'websocket' | 'https', RuntimeAccessDescriptor>>;
  resource: RuntimeResourceDescription; executionId: string; createdAt: string; updatedAt: string;
}
export interface RuntimeSpawnInput {
  workspaceId: string; providerId: string; accountId: string; configuration: Record<string, unknown>;
  source?: Record<string, unknown>; injectedInputs?: Record<string, unknown>;
  persistence: RuntimePersistence; executionId?: string; signal?: AbortSignal;
}
export interface RuntimeProviderContext { account: RuntimeAccount; credential: Credential; signal?: AbortSignal; }
export interface RuntimeProviderSpawnRequest {
  configuration: Record<string, unknown>; source: Record<string, unknown>; injectedInputs: Record<string, unknown>;
  persistence: RuntimePersistence; executionId: string;
}
export interface RuntimeProviderResource {
  providerRuntimeId: string; lifecycle: RuntimeLifecycle; capabilities: RuntimeCapability[];
  access?: RuntimeHandle['access']; resource: RuntimeResourceDescription;
}
export interface RuntimeCommandRequest {
  command: string; workingDirectory?: string; timeoutMs?: number; environment?: Record<string, string>;
}
export interface RuntimeCommandResult {
  exitCode: number; stdout: string; stderr: string; durationMs?: number; metadata?: Record<string, unknown>;
}
export interface RuntimeProvider {
  readonly id: string; readonly displayName: string; readonly description: string;
  readonly capabilities: readonly RuntimeCapability[];
  validateConfiguration(configuration: Record<string, unknown>): string[];
  describeConfiguration(configuration: Record<string, unknown>): RuntimeResourceDescription;
  spawn(request: RuntimeProviderSpawnRequest, context: RuntimeProviderContext): Promise<RuntimeProviderResource>;
  status(handle: RuntimeHandle, context: RuntimeProviderContext): Promise<RuntimeLifecycle>;
  execute(handle: RuntimeHandle, request: RuntimeCommandRequest, context: RuntimeProviderContext): Promise<RuntimeCommandResult>;
  terminate(handle: RuntimeHandle, context: RuntimeProviderContext): Promise<void>;
}
