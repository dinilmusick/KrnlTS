/**
 * @file KrnlFS.ts
 * @description Robust cross-platform filesystem abstraction layer for KrnlTS.
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { ObjectKit } from "./ObjectKit.js";

export type ReleaseFn = () => void;

export class FileLock {
  private static locks = new Map<string, Promise<void>>();

  static async acquire(filePath: string): Promise<ReleaseFn> {
    const resolvedPath = path.resolve(filePath);
    const existing = FileLock.locks.get(resolvedPath) || Promise.resolve();

    let release: ReleaseFn = () => {};
    const nextLock = new Promise<void>(resolve => {
      release = () => {
        FileLock.locks.delete(resolvedPath);
        resolve();
      };
    });

    FileLock.locks.set(resolvedPath, nextLock);
    await existing;
    return release;
  }
}

export class KrnlFS {
  // --- File primitives ---
  static async readFile(filePath: string, encoding: BufferEncoding = "utf8"): Promise<string> {
    return await fsp.readFile(filePath, encoding);
  }

  static async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    await fsp.writeFile(filePath, content);
  }

  /**
   * Atomic file writing via temp files.
   */
  static async writeFileAtomic(filePath: string, content: string | Buffer): Promise<void> {
    const dir = path.dirname(filePath);
    await KrnlFS.ensureDir(dir);
    const tempFile = path.join(dir, `.${path.basename(filePath)}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    try {
      await fsp.writeFile(tempFile, content);
      await fsp.rename(tempFile, filePath);
    } catch (e) {
      if (fs.existsSync(tempFile)) {
        await fsp.unlink(tempFile).catch(() => {});
      }
      throw e;
    }
  }

  static async appendFile(filePath: string, content: string | Buffer): Promise<void> {
    await fsp.appendFile(filePath, content);
  }

  static async deleteFile(filePath: string): Promise<void> {
    await fsp.unlink(filePath);
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fsp.stat(filePath);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  static async getFileStat(filePath: string): Promise<{ size: number; createdAt: Date; modifiedAt: Date; isDir: boolean }> {
    const stat = await fsp.stat(filePath);
    return {
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      isDir: stat.isDirectory()
    };
  }

  // --- JSON convenience ---
  static async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const content = await KrnlFS.readFile(filePath, "utf8");
      return JSON.parse(content) as T;
    } catch (e) {
      return null;
    }
  }

  static async writeJSON(filePath: string, data: unknown, indent = 2): Promise<void> {
    const content = JSON.stringify(data, null, indent);
    await KrnlFS.writeFileAtomic(filePath, content);
  }

  static async updateJSON<T>(filePath: string, patch: Partial<T>): Promise<T> {
    const release = await FileLock.acquire(filePath);
    try {
      let existing = await KrnlFS.readJSON<any>(filePath);
      if (!existing) {
        existing = {};
      }
      const updated = ObjectKit.deepMerge(existing, patch) as T;
      await KrnlFS.writeJSON(filePath, updated);
      return updated;
    } finally {
      release();
    }
  }

  // --- Directory primitives ---
  static async ensureDir(dirPath: string): Promise<void> {
    await fsp.mkdir(dirPath, { recursive: true });
  }

  static async deleteDir(dirPath: string, recursive = true): Promise<void> {
    await fsp.rm(dirPath, { recursive, force: true });
  }

  static async listDir(dirPath: string): Promise<string[]> {
    return await fsp.readdir(dirPath);
  }

  static async *walkDir(dirPath: string, filter?: (file: string) => boolean): AsyncIterable<string> {
    const list = await KrnlFS.listDir(dirPath);
    for (const item of list) {
      const full = path.join(dirPath, item);
      const stat = await KrnlFS.getFileStat(full);
      if (stat.isDir) {
        yield* KrnlFS.walkDir(full, filter);
      } else {
        if (!filter || filter(full)) {
          yield full;
        }
      }
    }
  }

  static async dirExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fsp.stat(dirPath);
      return stat.isDirectory();
    } catch (e) {
      return false;
    }
  }

  static async copyDir(src: string, dest: string): Promise<void> {
    await KrnlFS.ensureDir(dest);
    const list = await KrnlFS.listDir(src);
    for (const item of list) {
      const srcItem = path.join(src, item);
      const destItem = path.join(dest, item);
      const stat = await KrnlFS.getFileStat(srcItem);
      if (stat.isDir) {
        await KrnlFS.copyDir(srcItem, destItem);
      } else {
        await fsp.copyFile(srcItem, destItem);
      }
    }
  }

  // --- Path utilities ---
  static join(...parts: string[]): string {
    return path.join(...parts);
  }

  static resolve(...parts: string[]): string {
    return path.resolve(...parts);
  }

  static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  static basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  static dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  static extname(filePath: string): string {
    return path.extname(filePath);
  }

  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  static isSafe(filePath: string, root: string): boolean {
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(root);
    return resolvedPath.startsWith(resolvedRoot);
  }

  // --- Candidate resolution ---
  static async firstExisting(candidates: string[]): Promise<string | null> {
    for (const cand of candidates) {
      if (await KrnlFS.fileExists(cand)) {
        return cand;
      }
    }
    return null;
  }

  // --- Watching ---
  static watchFile(filePath: string, handler: (event: string) => void, debounceMs = 100): fs.FSWatcher {
    let timer: NodeJS.Timeout | null = null;
    return fs.watch(filePath, (event) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handler(event), debounceMs);
    });
  }

  static watchDir(dirPath: string, handler: (event: string, filename: string | null) => void, debounceMs = 100): fs.FSWatcher {
    let timer: NodeJS.Timeout | null = null;
    return fs.watch(dirPath, (event, filename) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => handler(event, filename), debounceMs);
    });
  }

  // --- Temp ---
  static createTempFile(prefix = "tmp-"): string {
    return path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
  }

  static createTempDir(prefix = "tmp-dir-"): string {
    const dir = path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static async withTempDir<T>(fn: (tempDir: string) => Promise<T>, prefix = "tmp-"): Promise<T> {
    const tempDir = KrnlFS.createTempDir(prefix);
    try {
      return await fn(tempDir);
    } finally {
      await KrnlFS.deleteDir(tempDir, true).catch(() => {});
    }
  }
}
