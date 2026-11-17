import { workspaceStorage, type WorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeProviderError, normalizeRuntimeError } from './errors.js';
import { RuntimeAccountService, type RuntimeAccountInput } from './RuntimeAccountService.js';
import { RuntimeHandleStore } from './RuntimeHandleStore.js';
import { sanitizeRuntimeHandle, assertSecretFree, assertNoCredentialMaterial, redactRuntimeText, redactRuntimeValue } from './security.js';
import { RuntimeProviderRegistry } from './RuntimeProviderRegistry.js';
import type { RuntimeAccount, RuntimeCapability, RuntimeCommandRequest, RuntimeCommandResult, RuntimeHandle, RuntimeProviderContext, RuntimeProviderResource, RuntimeSpawnInput, RuntimeResourceDescription } from './types.js';
export class RuntimeService {
  private readonly handles: RuntimeHandleStore;
  private readonly transient = new Map<string, RuntimeHandle>();
  constructor(readonly registry = new RuntimeProviderRegistry(), readonly accounts = new RuntimeAccountService(), storage: WorkspaceStorage = workspaceStorage) {
    this.handles = new RuntimeHandleStore(storage);
  }
  listProviders() { return this.registry.list(); }
  describeConfiguration(providerId: string, configuration: Record<string, unknown>): RuntimeResourceDescription {
    const provider = this.registry.get(providerId);
    const errors = provider.validateConfiguration(configuration || {});
    if (errors.length) throw new RuntimeProviderError('INVALID_CONFIGURATION', errors.join('; '));
    assertSecretFree(configuration);
    const description = provider.describeConfiguration(configuration);
    assertSecretFree(description);
    return description;
  }
  async listAccounts(workspaceId: string) { return this.accounts.list(workspaceId); }
  async saveAccount(workspaceId: string, input: RuntimeAccountInput): Promise<RuntimeAccount> {
    const provider = this.registry.get(input.providerId);
    if (input.capabilities?.some(capability => !provider.capabilities.includes(capability))) {
      throw new RuntimeProviderError('INVALID_ACCOUNT', 'Runtime account capability exceeds provider support.');
    }
    return this.accounts.save(workspaceId, input);
  }
  async spawn(input: RuntimeSpawnInput): Promise<RuntimeHandle> {
    const provider = this.registry.get(input.providerId);
    if (!['transient', 'persistent'].includes(input.persistence)) {
      throw new RuntimeProviderError('INVALID_CONFIGURATION', 'Runtime persistence must be transient or persistent.');
    }
    const account = await this.resolveAccount(input.workspaceId, input.accountId, input.providerId);
    const credential = await this.accounts.resolveCredential(account);
    const context: RuntimeProviderContext = { account, credential, signal: input.signal };
    input.signal?.throwIfAborted();
    const configuration = input.configuration || {};
    const validation = provider.validateConfiguration(configuration);
    if (validation.length) throw new RuntimeProviderError('INVALID_CONFIGURATION', validation.join('; '));
    assertSecretFree(configuration); assertSecretFree(input.source || {}); assertSecretFree(input.injectedInputs || {});
    const executionId = input.executionId || globalThis.crypto.randomUUID();
    let created: RuntimeProviderResource | undefined;
    let rawHandle: RuntimeHandle | undefined;
    try {
      created = await provider.spawn({
        configuration,
        source: input.source || {},
        injectedInputs: input.injectedInputs || {},
        persistence: input.persistence,
        executionId,
      }, context);
      const capabilities = created.capabilities.filter(capability =>
        provider.capabilities.includes(capability) &&
        (!account.capabilities || account.capabilities.includes(capability))
      );
      const access = Object.fromEntries(Object.entries(created.access || {}).filter(([key]) => {
        const capability = ['api', 'https', 'websocket'].includes(key) ? 'http' : key;
        return capabilities.includes(capability as RuntimeCapability);
      })) as RuntimeHandle['access'];
      rawHandle = {
        schemaVersion: '1.0.0', id: globalThis.crypto.randomUUID(), workspaceId: input.workspaceId, providerId: provider.id,
        accountId: account.id, providerRuntimeId: created.providerRuntimeId, persistence: input.persistence,
        lifecycle: created.lifecycle, capabilities, access, resource: created.resource, executionId,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      input.signal?.throwIfAborted();
      assertNoCredentialMaterial(rawHandle, credential);
      const handle = sanitizeRuntimeHandle(rawHandle);
      await this.handles.save(handle);
      if (input.persistence === 'transient') this.transient.set(handle.id, handle);
      return handle;
    } catch (error) {
      if (created && rawHandle) {
        try { await provider.terminate(rawHandle, { account, credential }); } catch { /* Keep the original allocation error. */ }
      }
      const normalized = normalizeRuntimeError(error, 'RUNTIME_CREATION_FAILED');
      throw new RuntimeProviderError(normalized.code, redactRuntimeText(normalized.message, credential), normalized.retryable);
    }
  }
  async get(workspaceId: string, handleId: string): Promise<RuntimeHandle> {
    const handle = this.transient.get(handleId) || await this.handles.get(workspaceId, handleId);
    if (!handle || handle.workspaceId !== workspaceId) {
      throw new RuntimeProviderError('RUNTIME_NOT_FOUND', 'Runtime handle not found in this workspace.');
    }
    return sanitizeRuntimeHandle(handle);
  }
  async status(workspaceId: string, handleId: string): Promise<RuntimeHandle> {
    const handle = await this.get(workspaceId, handleId);
    const { provider, context } = await this.resolveProviderContext(handle);
    try {
      handle.lifecycle = await provider.status(handle, context);
      return await this.update(handle);
    } catch (error) {
      const normalized = normalizeRuntimeError(error, 'CONNECTION_FAILED');
      throw new RuntimeProviderError(normalized.code, redactRuntimeText(normalized.message, context.credential), normalized.retryable);
    }
  }
  async execute(workspaceId: string, handleId: string, request: RuntimeCommandRequest, signal?: AbortSignal): Promise<{ handle: RuntimeHandle; result: RuntimeCommandResult }> {
    const handle = await this.requireActive(workspaceId, handleId);
    if (!handle.capabilities.includes('exec')) {
      throw new RuntimeProviderError('CAPABILITY_UNSUPPORTED', 'Runtime does not support command execution.');
    }
    if (!request.command?.trim()) throw new RuntimeProviderError('INVALID_CONFIGURATION', 'A command is required.');
    assertSecretFree(request);
    const { provider, context } = await this.resolveProviderContext(handle, signal);
    try {
      signal?.throwIfAborted();
      handle.lifecycle = 'running';
      await this.update(handle);
      const result = await provider.execute(handle, request, context);
      signal?.throwIfAborted();
      handle.lifecycle = 'ready';
      const safeResult: RuntimeCommandResult = {
        ...result,
        stdout: redactRuntimeText(result.stdout, context.credential),
        stderr: redactRuntimeText(result.stderr, context.credential),
        metadata: redactRuntimeValue(result.metadata, context.credential) as Record<string, unknown> | undefined,
      };
      return { handle: await this.update(handle), result: safeResult };
    } catch (error) {
      try { handle.lifecycle = await provider.status(handle, context); } catch { handle.lifecycle = 'unknown'; }
      await this.update(handle);
      const normalized = normalizeRuntimeError(error, 'COMMAND_FAILED');
      throw new RuntimeProviderError(normalized.code, redactRuntimeText(normalized.message, context.credential), normalized.retryable);
    }
  }
  async terminate(workspaceId: string, handleId: string): Promise<RuntimeHandle> {
    const handle = await this.get(workspaceId, handleId);
    if (handle.lifecycle === 'terminated') {
      if (handle.persistence === 'transient') {
        this.transient.delete(handle.id);
        await this.handles.remove(workspaceId, handle.id);
      }
      return handle;
    }
    const { provider, context } = await this.resolveProviderContext(handle);
    try {
      handle.lifecycle = 'terminating';
      await this.update(handle);
      await provider.terminate(handle, context);
      handle.lifecycle = 'terminated';
      const updated = await this.update(handle);
      if (handle.persistence === 'transient') {
        this.transient.delete(handle.id);
        await this.handles.remove(workspaceId, handle.id);
      }
      return updated;
    } catch (error) {
      const normalized = normalizeRuntimeError(error, 'CONNECTION_FAILED');
      throw new RuntimeProviderError(normalized.code, redactRuntimeText(normalized.message, context.credential), normalized.retryable);
    }
  }
  async cleanupTransient(workspaceId: string, executionId: string) {
    // Read durable references as well as the local cache: lifecycle requests may
    // be served by different Aiko instances behind a load balancer.
    const stored = await this.handles.list(workspaceId);
    const candidates = [...stored, ...this.transient.values()];
    const matches = [...new Map(candidates
      .filter(item => item.workspaceId === workspaceId && item.persistence === 'transient' && item.executionId === executionId)
      .map(item => [item.id, item] as const)).values()];
    const results = [];
    for (const handle of matches) {
      try { await this.terminate(workspaceId, handle.id); results.push({ handleId: handle.id, success: true }); }
      catch (error) { results.push({ handleId: handle.id, success: false, error: error instanceof Error ? error.message : String(error) }); }
    }
    return results;
  }
  private async resolveAccount(workspaceId: string, accountId: string, providerId: string) {
    const account = await this.accounts.get(workspaceId, accountId);
    if (account.providerId !== providerId) throw new RuntimeProviderError('INVALID_ACCOUNT', 'Runtime account belongs to a different provider.');
    return account;
  }
  private async resolveProviderContext(handle: RuntimeHandle, signal?: AbortSignal) {
    const provider = this.registry.get(handle.providerId);
    const account = await this.resolveAccount(handle.workspaceId, handle.accountId, handle.providerId);
    return { provider, context: { account, credential: await this.accounts.resolveCredential(account), signal } };
  }
  private async requireActive(workspaceId: string, handleId: string) {
    const handle = await this.get(workspaceId, handleId);
    if (['terminated', 'terminating', 'failed', 'stopped'].includes(handle.lifecycle)) throw new RuntimeProviderError('RUNTIME_TERMINATED', 'Runtime is not in an executable lifecycle state.');
    return handle;
  }
  private async update(handle: RuntimeHandle) {
    handle.updatedAt = new Date().toISOString();
    const safe = sanitizeRuntimeHandle(handle);
    await this.handles.save(safe);
    if (safe.persistence === 'transient') this.transient.set(safe.id, safe);
    return safe;
  }
}
