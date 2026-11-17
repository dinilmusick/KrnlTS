import { SkipoBase } from '@kloks/functions/base';
import {
  FileInfo,
  StorageConfig,
  DeleteFolderResult,
  RenameFolderResult,
  ConnectionTestResult,
} from './types.js';

export abstract class BaseStorageAdapter extends SkipoBase {
  protected config: StorageConfig;

  constructor(config: StorageConfig) {
    super({ name: 'BaseStorageAdapter' });
    this.config = config;
  }

  abstract read(pathStr: string): Promise<Uint8Array>;
  abstract write(pathStr: string, data: Uint8Array | string, contentType?: string): Promise<void>;
  abstract delete(pathStr: string): Promise<void>;
  abstract exists(pathStr: string): Promise<boolean>;
  abstract list(pathStr?: string): Promise<FileInfo[]>;
  abstract stat(pathStr: string): Promise<FileInfo>;
  abstract mkdir(pathStr: string): Promise<void>;

  async deleteFolder(pathStr: string): Promise<DeleteFolderResult> {
    const items = await this.list(pathStr);
    let count = 0;
    for (const item of items) {
      await this.delete(item.path);
      count++;
    }
    return { success: true, deletedCount: count };
  }

  async renameFolder(oldPath: string, newPath: string): Promise<RenameFolderResult> {
    const items = await this.list(oldPath);
    let count = 0;
    for (const item of items) {
      const rel = item.path.startsWith(oldPath) ? item.path.slice(oldPath.length).replace(/^\/+/, '') : item.path;
      const target = `${newPath.replace(/\/+$/, '')}/${rel}`;
      const data = await this.read(item.path);
      await this.write(target, data);
      await this.delete(item.path);
      count++;
    }
    return { success: true, movedCount: count };
  }

  async ensureDirectory(pathStr: string): Promise<void> {
    await this.mkdir(pathStr);
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now();
    try {
      await this.list('');
      return { ok: true, latencyMs: Math.round(performance.now() - start) };
    } catch (e: any) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: e.message };
    }
  }

  protected normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/^\/+/, '');
  }

  protected getExtension(p: string): string {
    const parts = p.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
}
