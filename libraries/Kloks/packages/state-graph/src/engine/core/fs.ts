/**
 * @file fs.ts
 * @description Robust cross-platform filesystem abstraction layer.
 */

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { deepMerge } from "./object.js";
import { FileLock } from "./fs-lock.js";

// --- File primitives ---
export async function readFile(filePath: string, encoding: BufferEncoding = "utf8"): Promise<string> {
  return await fsp.readFile(filePath, encoding);
}

export async function writeFile(filePath: string, content: string | Buffer): Promise<void> {
  await fsp.writeFile(filePath, content);
}

/**
 * Atomic file writing via temp files.
 */
export async function writeFileAtomic(filePath: string, content: string | Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
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

export async function appendFile(filePath: string, content: string | Buffer): Promise<void> {
  await fsp.appendFile(filePath, content);
}

export async function deleteFile(filePath: string): Promise<void> {
  await fsp.unlink(filePath);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(filePath);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

export async function getFileStat(filePath: string): Promise<{ size: number; createdAt: Date; modifiedAt: Date; isDir: boolean }> {
  const stat = await fsp.stat(filePath);
  return {
    size: stat.size,
    createdAt: stat.birthtime,
    modifiedAt: stat.mtime,
    isDir: stat.isDirectory()
  };
}

// --- JSON convenience ---
export async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (e) {
    return null;
  }
}

export async function writeJSON(filePath: string, data: unknown, indent = 2): Promise<void> {
  const content = JSON.stringify(data, null, indent);
  await writeFileAtomic(filePath, content);
}

export async function updateJSON<T>(filePath: string, patch: Partial<T>): Promise<T> {
  const release = await FileLock.acquire(filePath);
  try {
    let existing = await readJSON<any>(filePath);
    if (!existing) {
      existing = {};
    }
    const updated = deepMerge(existing, patch) as T;
    await writeJSON(filePath, updated);
    return updated;
  } finally {
    release();
  }
}

// --- Directory primitives ---
export async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function deleteDir(dirPath: string, recursive = true): Promise<void> {
  await fsp.rm(dirPath, { recursive, force: true });
}

export async function listDir(dirPath: string): Promise<string[]> {
  return await fsp.readdir(dirPath);
}

export async function* walkDir(dirPath: string, filter?: (file: string) => boolean): AsyncIterable<string> {
  const list = await listDir(dirPath);
  for (const item of list) {
    const full = path.join(dirPath, item);
    const stat = await getFileStat(full);
    if (stat.isDir) {
      yield* walkDir(full, filter);
    } else {
      if (!filter || filter(full)) {
        yield full;
      }
    }
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fsp.stat(dirPath);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const list = await listDir(src);
  for (const item of list) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);
    const stat = await getFileStat(srcItem);
    if (stat.isDir) {
      await copyDir(srcItem, destItem);
    } else {
      await fsp.copyFile(srcItem, destItem);
    }
  }
}

// --- Candidate resolution ---
export async function firstExisting(candidates: string[]): Promise<string | null> {
  for (const cand of candidates) {
    if (await fileExists(cand)) {
      return cand;
    }
  }
  return null;
}

// --- Watching ---
export function watchFile(filePath: string, handler: (event: string) => void, debounceMs = 100): fs.FSWatcher {
  let timer: NodeJS.Timeout | null = null;
  return fs.watch(filePath, (event) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => handler(event), debounceMs);
  });
}

export function watchDir(dirPath: string, handler: (event: string, filename: string | null) => void, debounceMs = 100): fs.FSWatcher {
  let timer: NodeJS.Timeout | null = null;
  return fs.watch(dirPath, (event, filename) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => handler(event, filename), debounceMs);
  });
}

// --- Temp ---
export function createTempFile(prefix = "tmp-"): string {
  return path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
}

export function createTempDir(prefix = "tmp-dir-"): string {
  const dir = path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function withTempDir<T>(fn: (tempDir: string) => Promise<T>, prefix = "tmp-"): Promise<T> {
  const tempDir = createTempDir(prefix);
  try {
    return await fn(tempDir);
  } finally {
    await deleteDir(tempDir, true).catch(() => {});
  }
}
