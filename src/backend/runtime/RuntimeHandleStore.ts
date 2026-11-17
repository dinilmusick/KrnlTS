import type { WorkspaceStorage } from '../storage/workspaceStorage.js';
import { RuntimeProviderError } from './errors.js';
import { deserializeRuntimeHandle, serializeRuntimeHandle } from './security.js';
import type { RuntimeHandle } from './types.js';

export class RuntimeHandleStore {
  constructor(private readonly storage: WorkspaceStorage) {}
  private file(workspaceId: string): string { return workspaceId + '/runtime-handles/index.json'; }
  async list(workspaceId: string): Promise<RuntimeHandle[]> {
    try {
      const entries = JSON.parse(await this.storage.read(this.file(workspaceId))) as string[];
      return entries.map(deserializeRuntimeHandle);
    } catch (error) {
      if (error instanceof RuntimeProviderError) throw error;
      return [];
    }
  }
  async get(workspaceId: string, handleId: string): Promise<RuntimeHandle | null> {
    return (await this.list(workspaceId)).find(item => item.id === handleId) || null;
  }
  async save(handle: RuntimeHandle): Promise<void> {
    const current = await this.list(handle.workspaceId);
    const next = current.some(item => item.id === handle.id) ? current.map(item => item.id === handle.id ? handle : item) : [...current, handle];
    await this.storage.write(this.file(handle.workspaceId), JSON.stringify(next.map(serializeRuntimeHandle), null, 2));
  }  async remove(workspaceId: string, handleId: string): Promise<void> {
    const next = (await this.list(workspaceId)).filter(item => item.id !== handleId);
    if (next.length === 0) {
      await this.storage.delete(this.file(workspaceId));
      return;
    }
    await this.storage.write(this.file(workspaceId), JSON.stringify(next.map(serializeRuntimeHandle), null, 2));
  }
}
