import { BaseStorageAdapter } from '../storage/BaseStorageAdapter.js';
import { SyncEngine } from './SyncEngine.js';
import { FileInfo } from '../storage/types.js';
import { WorkspaceConfig } from './types.js';
import { SkipoBase } from '@kloks/functions';

export class WorkspaceFS extends SkipoBase {
  private primary: BaseStorageAdapter;
  private syncEngine?: SyncEngine;
  private config: WorkspaceConfig;

  constructor(primary: BaseStorageAdapter, config: WorkspaceConfig, syncEngine?: SyncEngine) {
    super();
    this.primary = primary;
    this.config = config;
    this.syncEngine = syncEngine;
  }

  public setPrimary(newPrimary: BaseStorageAdapter): void {
    this.primary = newPrimary;
  }

  public setSyncEngine(engine: SyncEngine): void {
    this.syncEngine = engine;
  }

  public async exists(pathStr: string): Promise<boolean> {
    return this.primary.exists(pathStr);
  }

  public async stat(pathStr: string): Promise<FileInfo> {
    return this.primary.stat(pathStr);
  }

  public async list(pathStr = ''): Promise<FileInfo[]> {
    return this.primary.list(pathStr);
  }

  public async read(pathStr: string): Promise<Uint8Array> {
    return this.primary.read(pathStr);
  }

  public async readText(pathStr: string): Promise<string> {
    const data = await this.read(pathStr);
    return Buffer.from(data).toString('utf8');
  }

  public async write(pathStr: string, data: Uint8Array | Buffer | string): Promise<void> {
    await this.primary.write(pathStr, data);

    if (this.syncEngine && this.config.sync?.enabled && this.config.sync.mode === 'on_write') {
      this.syncEngine.syncFile(pathStr).catch(err => {
        console.warn(`[WorkspaceFS] Async backup sync warning for '${pathStr}':`, err.message);
      });
    }
  }

  public async mkdir(pathStr: string): Promise<void> {
    await this.primary.mkdir(pathStr);
  }

  public async delete(pathStr: string): Promise<void> {
    await this.primary.delete(pathStr);

    if (this.syncEngine && this.config.sync?.enabled && this.config.sync.deletePropagation) {
      this.syncEngine.deleteFile(pathStr).catch(err => {
        console.warn(`[WorkspaceFS] Async delete sync warning for '${pathStr}':`, err.message);
      });
    }
  }
}
