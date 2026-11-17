import { createHash } from 'node:crypto';
import { RuntimeProviderError } from './errors.js';
import type { RuntimeCommandRequest, RuntimeHandle, RuntimePersistence } from './types.js';
import { RuntimeService } from './RuntimeService.js';
import type { ToolOutputHandle } from '../workflows/capabilities/contracts.js';

export interface VerifiedLuthPrincipal { id: string; role: string; }
export interface RuntimeNodeContext {
  workspaceId: string;
  executionId: string;
  /** Supplied by Aiko's request boundary only after canonical Luth verification. */
  principal: VerifiedLuthPrincipal;
  auth: { provider: 'luth'; verified: true };
  signal?: AbortSignal;
  isCancelled?(): boolean;
}
export interface RuntimeNodePort { type: 'string' | 'object' | 'number' | 'any'; label: string; required?: boolean; }
export type RuntimeNodeProviderId = 'google-cloud-shell' | 'fly-io' | 'github-codespaces';
export interface RuntimeNodeDefinition {
  type: string;
  operation: 'spawnRuntime' | 'execute' | 'status' | 'terminate' | 'runProviderRuntime';
  displayName: string;
  description: string;
  inputs: Record<string, RuntimeNodePort>;
  outputs: Record<string, RuntimeNodePort>;
  provider?: { id: RuntimeNodeProviderId; displayName: string; vendor: string; adapterRequired: true };
  available?: boolean;
  toolOutput?: ToolOutputHandle;
}
const text = (label: string, required = false): RuntimeNodePort => ({ type: 'string', label, required });
const object = (label: string, required = false): RuntimeNodePort => ({ type: 'object', label, required });
const number = (label: string): RuntimeNodePort => ({ type: 'number', label });
const any = (label: string): RuntimeNodePort => ({ type: 'any', label });
const commandInputs = (): Record<string, RuntimeNodePort> => ({
  runtime: object('Existing Runtime Handle'), accountId: text('Runtime Account'),
  configuration: object('Provider Configuration'), command: text('Command', true),
  workingDirectory: text('Working Directory'), timeoutMs: number('Timeout (ms)'),
  environment: object('Environment'), source: object('Source'), files: any('Files / Input Data'),
  persistence: text('Persistence'),
});
const commandOutputs = (): Record<string, RuntimeNodePort> => ({
  stdout: text('Standard Output'), stderr: text('Standard Error'),
  exitStatus: number('Exit Status'), result: object('Command Result'),
  runtime: object('Runtime Handle'), lifecycle: text('Runtime Lifecycle'),
  capabilities: any('Runtime Capabilities'), error: object('Error'),
});
export function createRuntimeNodeToolOutputHandle(nodeId: string, nodeType: string): ToolOutputHandle {
  const capabilityId = 'cap_' + createHash('sha256').update(JSON.stringify({ kind: 'runtime', id: nodeId, type: nodeType })).digest('hex').slice(0, 24);
  const handleId = 'handle_' + createHash('sha256').update(JSON.stringify({ capabilityId })).digest('hex').slice(0, 24);
  return {
    kind: 'tool-output',
    id: handleId,
    capabilityId,
    capabilityKind: 'runtime',
    name: nodeType,
    description: 'Execute command in ' + nodeType + ' runtime environment.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        accountId: { type: 'string' },
        configuration: { type: 'object' },
        workingDirectory: { type: 'string' },
        timeoutMs: { type: 'number' },
        environment: { type: 'object' },
        source: { type: 'object' },
        files: {},
        persistence: { type: 'string' },
      },
      required: ['command'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        exitStatus: { type: 'number' },
        result: { type: 'object' },
        runtime: { type: 'object' },
        lifecycle: { type: 'string' },
        capabilities: {},
        error: { type: 'object' },
      },
    },
    enabled: true,
  };
}
const providerNodes: Array<{ id: RuntimeNodeProviderId; displayName: string; vendor: string; description: string }> = [
  { id: 'google-cloud-shell', displayName: 'Google Cloud Shell', vendor: 'Google Cloud', description: 'Run a command in a Google Cloud Shell environment.' },
  { id: 'fly-io', displayName: 'Fly.io', vendor: 'Fly.io', description: 'Run a command in a Fly.io machine environment.' },
  { id: 'github-codespaces', displayName: 'GitHub Codespaces', vendor: 'GitHub', description: 'Run a command in a GitHub Codespaces environment.' },
];
export const RUNTIME_PROVIDER_NODE_DEFINITIONS: RuntimeNodeDefinition[] = providerNodes.map(provider => {
  const type = 'runtime/' + provider.id;
  return {
    type, operation: 'runProviderRuntime', displayName: provider.displayName,
    description: provider.description,
    provider: { id: provider.id, displayName: provider.displayName, vendor: provider.vendor, adapterRequired: true },
    inputs: commandInputs(), outputs: commandOutputs(),
    toolOutput: createRuntimeNodeToolOutputHandle(provider.id, type),
  };
});
export const RUNTIME_NODE_DEFINITIONS: RuntimeNodeDefinition[] = [
  { type: 'runtime/spawn', operation: 'spawnRuntime', displayName: 'Spawn Runtime',
    description: 'Create a provider-specific runtime and return a safe handle.',
    inputs: { providerId: text('Provider', true), accountId: text('Runtime Account', true), configuration: object('Provider Configuration', true), source: object('Source'), injectedInputs: object('Injected Inputs'), persistence: text('Persistence') },
    outputs: { runtime: object('Runtime Handle'), error: object('Error') } },
  { type: 'runtime/execute', operation: 'execute', displayName: 'Execute Command',
    description: 'Execute a command on a runtime with exec capability.',
    inputs: { runtime: object('Runtime Handle', true), command: text('Command', true), workingDirectory: text('Working Directory'), timeoutMs: number('Timeout (ms)'), environment: object('Environment') },
    outputs: { runtime: object('Updated Runtime Handle'), result: object('Command Result'), error: object('Error') } },
  { type: 'runtime/status', operation: 'status', displayName: 'Runtime Status',
    description: 'Read provider lifecycle state for a runtime handle.',
    inputs: { runtime: object('Runtime Handle', true) },
    outputs: { runtime: object('Updated Runtime Handle'), status: text('Lifecycle'), error: object('Error') } },
  { type: 'runtime/destroy', operation: 'terminate', displayName: 'Destroy Runtime',
    description: 'Terminate a runtime using its provider lifecycle operation.',
    inputs: { runtime: object('Runtime Handle', true) },
    outputs: { runtime: object('Terminated Runtime Handle'), error: object('Error') } },
];
function assertContext(context: RuntimeNodeContext, allowCancelled = false): void {
  if (!context?.workspaceId?.trim() || !context.executionId?.trim()) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime nodes require a workspace execution context.');
  }
  if (context.auth && (context.auth.provider !== 'luth' || context.auth.verified !== true)) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Runtime nodes require a verified Luth principal.');
  }
  if ((context as any).principal?.workspaceId && (context as any).principal.workspaceId !== context.workspaceId) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'Principal does not belong to this workspace.');
  }
  if (!allowCancelled && (context.signal?.aborted || context.isCancelled?.())) {
    throw new RuntimeProviderError('TIMEOUT', 'Workflow execution was cancelled.');
  }
}
function requireHandle(value: unknown, workspaceId: string, providerId?: string): RuntimeHandle {
  if (!value || typeof value !== 'object') throw new RuntimeProviderError('INVALID_HANDLE', 'A runtime handle is required.');
  const handle = value as RuntimeHandle;
  if (!handle.id || handle.workspaceId !== workspaceId || (providerId && handle.providerId !== providerId)) {
    throw new RuntimeProviderError('INVALID_HANDLE', 'A valid runtime handle from this workspace and provider is required.');
  }
  return handle;
}
export class RuntimeNodeAdapter {
  constructor(private readonly runtimes: RuntimeService) {}
  definitions(): RuntimeNodeDefinition[] {
    const available = new Set(this.runtimes.listProviders().map(provider => provider.id));
    return [...RUNTIME_NODE_DEFINITIONS, ...RUNTIME_PROVIDER_NODE_DEFINITIONS].map(item => ({
      ...item, inputs: { ...item.inputs }, outputs: { ...item.outputs },
      provider: item.provider ? { ...item.provider } : undefined,
      available: item.provider ? available.has(item.provider.id) : true,
    }));
  }
  async execute(type: string, inputs: Record<string, unknown>, context: RuntimeNodeContext): Promise<Record<string, unknown>> {
    try {
      assertContext(context);
      if (RUNTIME_PROVIDER_NODE_DEFINITIONS.some(item => item.type === type)) {
        const providerId = type.slice('runtime/'.length) as RuntimeNodeProviderId;
        if (typeof inputs.command !== 'string' || !inputs.command.trim()) {
          throw new RuntimeProviderError('INVALID_CONFIGURATION', 'A non-empty command is required.');
        }
        if (inputs.configuration !== undefined && (inputs.configuration === null || typeof inputs.configuration !== 'object' || Array.isArray(inputs.configuration))) {
          throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Configuration must be an object.');
        }
        if (inputs.source !== undefined && (inputs.source === null || typeof inputs.source !== 'object' || Array.isArray(inputs.source))) {
          throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Source must be an object.');
        }
        if (inputs.workingDirectory !== undefined && typeof inputs.workingDirectory !== 'string') {
          throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Working directory must be a string.');
        }
        if (inputs.persistence !== undefined && inputs.persistence !== 'transient' && inputs.persistence !== 'persistent') {
          throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Persistence must be transient or persistent.');
        }
        if (inputs.environment !== undefined) {
          if (inputs.environment === null || typeof inputs.environment !== 'object' || Array.isArray(inputs.environment) ||
              Object.values(inputs.environment).some(v => typeof v !== 'string')) {
            throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Environment variables must be strings.');
          }
        }
        let handle: RuntimeHandle;
        if (inputs.runtime !== undefined) handle = requireHandle(inputs.runtime, context.workspaceId, providerId);
        else {
          if (typeof inputs.accountId !== 'string' || !inputs.accountId.trim()) {
            throw new RuntimeProviderError('INVALID_ACCOUNT', 'A workspace runtime account is required.');
          }
          handle = await this.runtimes.spawn({
            workspaceId: context.workspaceId, executionId: context.executionId, providerId,
            accountId: inputs.accountId, configuration: (inputs.configuration || {}) as Record<string, unknown>,
            source: { ...(inputs.source as Record<string, unknown> || {}), ...(inputs.files === undefined ? {} : { files: inputs.files }) },
            persistence: (inputs.persistence || 'transient') as RuntimePersistence, signal: context.signal,
          });
        }
        const executed = await this.runtimes.execute(context.workspaceId, handle.id, {
          command: inputs.command,
          ...(typeof inputs.workingDirectory === 'string' ? { workingDirectory: inputs.workingDirectory } : {}),
          ...(typeof inputs.timeoutMs === 'number' ? { timeoutMs: inputs.timeoutMs } : {}),
          environment: (inputs.environment || {}) as Record<string, string>,
        }, context.signal);
        return { runtime: executed.handle, result: executed.result, stdout: executed.result.stdout,
          stderr: executed.result.stderr, exitStatus: executed.result.exitCode,
          lifecycle: executed.handle.lifecycle, capabilities: executed.handle.capabilities };
      }
      if (type === 'runtime/spawn') {
        if (!context?.principal?.id || context.auth?.verified !== true) {
          throw new RuntimeProviderError('INVALID_HANDLE', 'A verified Luth principal and workspace execution context is required.');
        }
        const handle = await this.runtimes.spawn({
          workspaceId: context.workspaceId, executionId: context.executionId,
          providerId: String(inputs.providerId || ''), accountId: String(inputs.accountId || ''),
          configuration: (inputs.configuration || {}) as Record<string, unknown>,
          source: (inputs.source || {}) as Record<string, unknown>,
          injectedInputs: (inputs.injectedInputs || {}) as Record<string, unknown>,
          persistence: (inputs.persistence || 'transient') as RuntimePersistence, signal: context.signal,
        });
        return { runtime: handle };
      }
      const handle = requireHandle(inputs.runtime, context.workspaceId);
      if (type === 'runtime/execute') {
        const request: RuntimeCommandRequest = {
          command: String(inputs.command || ''),
          ...(typeof inputs.workingDirectory === 'string' ? { workingDirectory: inputs.workingDirectory } : {}),
          ...(typeof inputs.timeoutMs === 'number' ? { timeoutMs: inputs.timeoutMs } : {}),
          environment: (inputs.environment || {}) as Record<string, string>,
        };
        const result = await this.runtimes.execute(context.workspaceId, handle.id, request, context.signal);
        return { runtime: result.handle, result: result.result };
      }
      if (type === 'runtime/status') {
        const updated = await this.runtimes.status(context.workspaceId, handle.id);
        return { runtime: updated, status: updated.lifecycle };
      }
      if (type === 'runtime/destroy') return { runtime: await this.runtimes.terminate(context.workspaceId, handle.id) };
      throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Unknown runtime node type: ' + type);
    } catch (error) {
      return { error: { code: error instanceof RuntimeProviderError ? error.code : 'RUNTIME_OPERATION_FAILED',
        message: error instanceof Error ? error.message : 'Runtime operation failed.' } };
    }
  }
  async cleanupExecution(context: RuntimeNodeContext) {
    // Cleanup must still run in a graph-level finally block after cancellation.
    assertContext(context, true);
    const results = await this.runtimes.cleanupTransient(context.workspaceId, context.executionId);
    const failed = results.filter(result => !result.success);
    if (failed.length) throw new RuntimeProviderError('CONNECTION_FAILED', 'Failed to clean up ' + failed.length + ' transient runtime resource(s).');
    return results;
  }
  async executeCapability(type: string, inputs: Record<string, unknown>, context: any): Promise<Record<string, unknown>> {
    const fullContext: RuntimeNodeContext = {
      workspaceId: context?.workspaceId || '',
      executionId: context?.executionId || 'capability-exec',
      principal: context?.principal || { id: context?.userId || 'system', role: 'user' },
      auth: { provider: 'luth', verified: true },
      signal: context?.signal,
      ...(context || {}),
    };
    const res = await this.execute(type, inputs, fullContext);
    if (res.error) {
      throw new RuntimeProviderError((res.error as any).code || 'RUNTIME_OPERATION_FAILED', (res.error as any).message || 'Runtime operation failed.');
    }
    return res;
  }
}
