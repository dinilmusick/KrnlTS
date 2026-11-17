import { SkipoBase } from '@kloks/functions';
import { BaseStorageAdapter } from '../storage/BaseStorageAdapter.js';
import { WorkspaceConfig } from './types.js';

export class SyncEngine extends SkipoBase {
  private primary: BaseStorageAdapter;
  private backups: BaseStorageAdapter[];
  public readonly config: WorkspaceConfig;

  constructor(primary: BaseStorageAdapter, backups: BaseStorageAdapter[], config: WorkspaceConfig) {
    super({ name: 'SyncEngine' });
    this.primary = primary;
    this.backups = backups;
    this.config = config;
  }

  async syncFile(pathStr: string): Promise<void> {
    const data = await this.primary.read(pathStr);
    
    for (const backup of this.backups) {
      // Basic primary_wins policy implementation for write
      try {
        await backup.write(pathStr, data);
      } catch (e: any) {
        console.error(`[SyncEngine] Failed to sync ${pathStr} to backup:`, e.message);
      }
    }
  }

  async deleteFile(pathStr: string): Promise<void> {
    for (const backup of this.backups) {
      try {
        await backup.delete(pathStr);
      } catch (e: any) {
        console.error(`[SyncEngine] Failed to delete ${pathStr} on backup:`, e.message);
      }
    }
  }
}
