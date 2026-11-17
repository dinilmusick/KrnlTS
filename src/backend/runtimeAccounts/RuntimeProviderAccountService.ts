import { CredentialStore } from '../storage/credentialStore.js';
import { workspaceStorage, type WorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeAccountService } from '../runtime/RuntimeAccountService.js';
import type { RuntimeAccount } from '../runtime/types.js';
import { getRuntimeProvider, normalizeRuntimeProviderFields, RUNTIME_PROVIDER_METADATA, validateRuntimeProviderFields } from './runtimeProviderMetadata.js';

export type RuntimeAccountView = Omit<RuntimeAccount, 'credentialRef'>;
export type RuntimeAccountInput = {
  providerId: string; displayName: string; fields: Record<string, string>; emailGroup?: string;
};
export type RuntimeAccountUpdate = Omit<RuntimeAccountInput, 'fields'> & { fields?: Record<string, string> };

function publicAccount(account: RuntimeAccount): RuntimeAccountView {
  const emailGroup = typeof account.metadata?.emailGroup === 'string' ? account.metadata.emailGroup : undefined;
  return {
    id: account.id, workspaceId: account.workspaceId, providerId: account.providerId,
    displayName: account.displayName, capabilities: account.capabilities,
    metadata: emailGroup ? { emailGroup } : undefined,
    createdAt: account.createdAt, updatedAt: account.updatedAt,
  };
}

export class RuntimeProviderAccountService {
  private readonly credentials: CredentialStore;
  private readonly accounts: RuntimeAccountService;

  constructor(private readonly storage: WorkspaceStorage = workspaceStorage) {
    this.credentials = new CredentialStore(storage);
    this.accounts = new RuntimeAccountService(storage);
  }

  listProviders() { return RUNTIME_PROVIDER_METADATA; }

  async list(workspaceId: string): Promise<RuntimeAccountView[]> {
    return (await this.accounts.list(workspaceId)).map(publicAccount);
  }

  async create(workspaceId: string, input: RuntimeAccountInput): Promise<RuntimeAccountView> {
    this.validateInput(workspaceId, input, true);
    const provider = getRuntimeProvider(input.providerId)!;
    const credentialRef = 'runtime-' + globalThis.crypto.randomUUID();
    await this.credentials.save(workspaceId, this.credential(credentialRef, provider.id, input.fields));
    try {
      const account = await this.accounts.save(workspaceId, {
        providerId: provider.id, displayName: input.displayName.trim(), credentialRef,
        capabilities: provider.capabilities.map(capability => capability.id),
        metadata: input.emailGroup ? { emailGroup: input.emailGroup.trim() } : {},
      });
      return publicAccount(account);
    } catch (error) {
      try { await this.credentials.delete(workspaceId, credentialRef); } catch { /* preserve original failure */ }
      throw error;
    }
  }

  async update(workspaceId: string, accountId: string, input: RuntimeAccountUpdate): Promise<RuntimeAccountView> {
    this.validateInput(workspaceId, input, false);
    const previous = await this.accounts.get(workspaceId, accountId);
    const provider = getRuntimeProvider(input.providerId)!;
    if (provider.id !== previous.providerId && (!input.fields || !Object.values(input.fields).some(value => typeof value === 'string' && value.trim()))) {
      throw new Error('New credentials are required when changing runtime providers.');
    }
    const previousCredential = await this.credentials.get(workspaceId, previous.credentialRef);
    const credentialFieldsChanged = Boolean(input.fields && Object.values(input.fields).some(value => typeof value === 'string' && value.trim()));
    if (input.fields) {
      const suppliedFields = Object.fromEntries(
        Object.entries(input.fields).filter(([, value]) => typeof value === 'string' && value.trim()),
      );
      const existingFields = provider.id === previous.providerId && previousCredential.data.type === 'CUSTOM'
        ? previousCredential.data.fields
        : {};
      const mergedFields = { ...existingFields, ...suppliedFields };
      const errors = validateRuntimeProviderFields(provider.id, mergedFields);
      if (errors.length) throw new Error(errors.join(' '));
      if (credentialFieldsChanged) {
        await this.credentials.save(workspaceId, this.credential(previous.credentialRef, provider.id, mergedFields));
      }
    }
    try {
      const account = await this.accounts.save(workspaceId, {
        id: accountId, providerId: provider.id, displayName: input.displayName.trim(),
        credentialRef: previous.credentialRef, capabilities: provider.capabilities.map(capability => capability.id),
        metadata: input.emailGroup ? { emailGroup: input.emailGroup.trim() } : {},
      });
      return publicAccount(account);
    } catch (error) {
      if (credentialFieldsChanged) await this.credentials.save(workspaceId, previousCredential);
      throw error;
    }
  }

  async delete(workspaceId: string, accountId: string): Promise<boolean> {
    const account = await this.accounts.get(workspaceId, accountId);
    const credential = await this.credentials.get(workspaceId, account.credentialRef);
    await this.credentials.delete(workspaceId, account.credentialRef);
    try {
      const deleted = await this.accounts.delete(workspaceId, accountId);
      if (!deleted) {
        await this.credentials.save(workspaceId, credential);
        return false;
      }
      return true;
    } catch (error) {
      await this.credentials.save(workspaceId, credential);
      throw error;
    }
  }

  private validateInput(workspaceId: string, input: RuntimeAccountInput | RuntimeAccountUpdate, requireFields: boolean): void {
    if (!workspaceId || !input || typeof input.displayName !== 'string' || !input.displayName.trim()) {
      throw new Error('Workspace and account name are required.');
    }
    if (input.displayName.length > 100) throw new Error('Account name must be 100 characters or fewer.');
    if (!getRuntimeProvider(input.providerId)) throw new Error('Unsupported runtime provider.');
    if (requireFields) {
      const errors = validateRuntimeProviderFields(input.providerId, (input as RuntimeAccountInput).fields);
      if (errors.length) throw new Error(errors.join(' '));
    }
    if (input.emailGroup && (input.emailGroup.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.emailGroup))) {
      throw new Error('Email group must be a valid email address.');
    }
  }

  private credential(name: string, providerId: string, fields: Record<string, string>) {
    return {
      schemaVersion: '1.0.0', name, type: 'CUSTOM' as const,
      data: { type: 'CUSTOM' as const, fields: normalizeRuntimeProviderFields(providerId, fields) },
      metadata: { description: 'Runtime provider account credentials', provider: providerId },
    };
  }
}
