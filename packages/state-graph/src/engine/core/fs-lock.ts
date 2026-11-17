/**
 * @file fs-lock.ts
 * @description File locking primitive for atomic file operations.
 */

import path from "path";

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
