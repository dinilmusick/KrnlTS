import { promises as fs } from 'fs';
import path from 'path';
import { BaseStorageAdapter } from './BaseStorageAdapter.js';
import { FileInfo, StorageConfig } from './types.js';

export class LocalFSAdapter extends BaseStorageAdapter {
  private basePath: string;

  constructor(config: StorageConfig) {
    super(config);
    this.basePath = path.resolve(config.basePath || './.skipo/storage');
  }

  private resolvePath(p: string): string {
    return path.join(this.basePath, this.normalizePath(p));
  }

  async read(pathStr: string): Promise<Uint8Array> {
    const fullPath = this.resolvePath(pathStr);
    const data = await fs.readFile(fullPath);
    return new Uint8Array(data);
  }

  async write(pathStr: string, data: Uint8Array | string): Promise<void> {
    const fullPath = this.resolvePath(pathStr);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, typeof data === 'string' ? data : Buffer.from(data));
  }

  async delete(pathStr: string): Promise<void> {
    const fullPath = this.resolvePath(pathStr);
    await fs.rm(fullPath, { recursive: true, force: true });
  }

  async exists(pathStr: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(pathStr));
      return true;
    } catch {
      return false;
    }
  }

  async list(pathStr = ''): Promise<FileInfo[]> {
    const fullPath = this.resolvePath(pathStr);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const results: FileInfo[] = [];
      for (const entry of entries) {
        if (entry.isFile()) {
          const stats = await fs.stat(path.join(fullPath, entry.name));
          results.push({
            path: path.posix.join(pathStr, entry.name),
            size: stats.size,
            modifiedAt: stats.mtimeMs
          });
        }
      }
      return results;
    } catch (e: any) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  }

  async stat(pathStr: string): Promise<FileInfo> {
    const fullPath = this.resolvePath(pathStr);
    const stats = await fs.stat(fullPath);
    return {
      path: pathStr,
      size: stats.size,
      modifiedAt: stats.mtimeMs
    };
  }

  async mkdir(pathStr: string): Promise<void> {
    const fullPath = this.resolvePath(pathStr);
    await fs.mkdir(fullPath, { recursive: true });
  }

  async deleteFolder(pathStr: string): Promise<{ success: boolean; deletedCount: number }> {
    const fullPath = this.resolvePath(pathStr);
    try {
      await fs.rm(fullPath, { recursive: true, force: true });
      return { success: true, deletedCount: 1 };
    } catch {
      return { success: false, deletedCount: 0 };
    }
  }

  async renameFolder(oldPath: string, newPath: string): Promise<{ success: boolean; movedCount: number }> {
    const oldFull = this.resolvePath(oldPath);
    const newFull = this.resolvePath(newPath);
    try {
      await fs.mkdir(path.dirname(newFull), { recursive: true });
      await fs.rename(oldFull, newFull);
      return { success: true, movedCount: 1 };
    } catch {
      return { success: false, movedCount: 0 };
    }
  }
}
