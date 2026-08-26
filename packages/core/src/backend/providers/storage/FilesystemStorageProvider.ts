/**
 * @file FilesystemStorageProvider.ts
 * @description Local Filesystem Storage Provider using KrnlFS for zero-cloud file persistence.
 */

import { IStorageProvider, StorageProviderConfig } from "../../types.js";
import { KrnlFS } from "../../../tools/KrnlFS.js";
import path from "path";
import fsp from "fs/promises";

export class FilesystemStorageProvider implements IStorageProvider {
  readonly driver = "filesystem" as const;
  private basePath: string;

  constructor(config: StorageProviderConfig | string = "./storage") {
    if (typeof config === "string") {
      this.basePath = path.resolve(config);
    } else {
      this.basePath = path.resolve(config.basePath || "./storage");
    }
  }

  async uploadFile(targetPath: string, content: Buffer | Uint8Array | string | ReadableStream, _mimeType?: string): Promise<{ url: string; size: number }> {
    const fullPath = path.join(this.basePath, targetPath);
    await KrnlFS.ensureDir(path.dirname(fullPath));

    let buf: Buffer;
    if (Buffer.isBuffer(content)) {
      buf = content;
    } else if (typeof content === "string") {
      buf = Buffer.from(content, "utf8");
    } else if (content instanceof Uint8Array) {
      buf = Buffer.from(content);
    } else {
      // ReadableStream or other stream
      buf = Buffer.from(await (content as any).arrayBuffer());
    }

    await KrnlFS.writeFileAtomic(fullPath, buf);
    const size = buf.byteLength;
    return {
      url: `file://${fullPath}`,
      size
    };
  }

  async downloadFile(targetPath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, targetPath);
    return await fsp.readFile(fullPath);
  }

  async deleteFile(targetPath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, targetPath);
    try {
      await KrnlFS.deleteFile(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(targetPath: string): string {
    return `file://${path.join(this.basePath, targetPath)}`;
  }

  async listFiles(prefix = ""): Promise<Array<{ path: string; size: number; updatedAt: number }>> {
    const startDir = path.join(this.basePath, prefix);
    if (!(await KrnlFS.dirExists(startDir))) {
      return [];
    }

    const results: Array<{ path: string; size: number; updatedAt: number }> = [];
    for await (const file of KrnlFS.walkDir(startDir)) {
      const stat = await KrnlFS.getFileStat(file);
      results.push({
        path: path.relative(this.basePath, file),
        size: stat.size,
        updatedAt: stat.modifiedAt.getTime()
      });
    }
    return results;
  }
}
