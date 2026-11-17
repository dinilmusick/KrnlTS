import { CredentialStore } from '../storage/credentialStore.js';
import { workspaceStorage, type WorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeProviderError } from './errors.js';
import { assertSecretFree } from './security.js';
import type { RuntimeAccount, RuntimeCapability } from './types.js';

export interface RuntimeAccountInput {
  id?: string; providerId: string; displayName: string; credentialRef: string;
  capabilities?: RuntimeCapability[]; metadata?: Record<string, string | number | boolean>;
}
export class RuntimeAccountService {
  private readonly credentials: CredentialStore;
  constructor(private readonly storage: WorkspaceStorage = workspaceStorage) { this.credentials = new CredentialStore(storage); }
  private file(workspaceId: string): string { return workspaceId + '/runtime-accounts/index.json'; }
  async list(workspaceId: string): Promise<RuntimeAccount[]> {
    try { return JSON.parse(await this.storage.read(this.file(workspaceId))) as RuntimeAccount[]; } catch { return []; }
  }
  async get(workspaceId: string, accountId: string): Promise<RuntimeAccount> {
    const account = (await this.list(workspaceId)).find(item => item.id === accountId);
    if (!account) throw new RuntimeProviderError('INVALID_ACCOUNT', 'Runtime account not found: ' + accountId);
    return account;
  }
  async save(workspaceId: string, input: RuntimeAccountInput): Promise<RuntimeAccount> {
    if (!workspaceId || !input.providerId || !input.displayName?.trim() || !input.credentialRef?.trim()) {
      throw new RuntimeProviderError('INVALID_ACCOUNT', 'Workspace, provider, display name, and credential reference are required.');
    }
    assertSecretFree(input.metadata || {});
    const supported = ['exec', 'filesystem', 'ssh', 'http', 'ports', 'persistent'];
    if (input.capabilities?.some(capability => !supported.includes(capability))) throw new RuntimeProviderError('INVALID_ACCOUNT', 'Runtime account contains an unknown capability.');
    const id = input.id || globalThis.crypto.randomUUID();
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(id)) throw new RuntimeProviderError('INVALID_ACCOUNT', 'Runtime account id is invalid.');
    await this.credentials.get(workspaceId, input.credentialRef);
    const records = await this.list(workspaceId);
    const previous = records.find(item => item.id === id);
    const now = new Date().toISOString();
    const account: RuntimeAccount = {
      id, workspaceId, providerId: input.providerId, displayName: input.displayName.trim(), credentialRef: input.credentialRef,
      capabilities: input.capabilities, metadata: input.metadata, createdAt: previous?.createdAt || now, updatedAt: now,
    };
    const next = previous ? records.map(item => item.id === id ? account : item) : [...records, account];
    await this.storage.write(this.file(workspaceId), JSON.stringify(next, null, 2));
    return account;
  }
  async resolveCredential(account: RuntimeAccount) { return this.credentials.get(account.workspaceId, account.credentialRef); }
  async delete(workspaceId: string, accountId: string): Promise<boolean> {
    const records = await this.list(workspaceId);
    const next = records.filter(item => item.id !== accountId);
    if (next.length === records.length) return false;
    await this.storage.write(this.file(workspaceId), JSON.stringify(next, null, 2));
    return true;
  }
}
