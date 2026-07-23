/**
 * @file KrnlFS.ts
 * @description Robust cross-platform filesystem abstraction layer for KrnlTS.
 */
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { ObjectKit } from "./ObjectKit.js";
export class FileLock {
    static locks = new Map();
    static async acquire(filePath) {
        const resolvedPath = path.resolve(filePath);
        const existing = FileLock.locks.get(resolvedPath) || Promise.resolve();
        let release = () => { };
        const nextLock = new Promise(resolve => {
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
    static async readFile(filePath, encoding = "utf8") {
        return await fsp.readFile(filePath, encoding);
    }
    static async writeFile(filePath, content) {
        await fsp.writeFile(filePath, content);
    }
    /**
     * Atomic file writing via temp files.
     */
    static async writeFileAtomic(filePath, content) {
        const dir = path.dirname(filePath);
        await KrnlFS.ensureDir(dir);
        const tempFile = path.join(dir, `.${path.basename(filePath)}.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        try {
            await fsp.writeFile(tempFile, content);
            await fsp.rename(tempFile, filePath);
        }
        catch (e) {
            if (fs.existsSync(tempFile)) {
                await fsp.unlink(tempFile).catch(() => { });
            }
            throw e;
        }
    }
    static async appendFile(filePath, content) {
        await fsp.appendFile(filePath, content);
    }
    static async deleteFile(filePath) {
        await fsp.unlink(filePath);
    }
    static async fileExists(filePath) {
        try {
            const stat = await fsp.stat(filePath);
            return stat.isFile();
        }
        catch (e) {
            return false;
        }
    }
    static async getFileStat(filePath) {
        const stat = await fsp.stat(filePath);
        return {
            size: stat.size,
            createdAt: stat.birthtime,
            modifiedAt: stat.mtime,
            isDir: stat.isDirectory()
        };
    }
    // --- JSON convenience ---
    static async readJSON(filePath) {
        try {
            const content = await KrnlFS.readFile(filePath, "utf8");
            return JSON.parse(content);
        }
        catch (e) {
            return null;
        }
    }
    static async writeJSON(filePath, data, indent = 2) {
        const content = JSON.stringify(data, null, indent);
        await KrnlFS.writeFileAtomic(filePath, content);
    }
    static async updateJSON(filePath, patch) {
        const release = await FileLock.acquire(filePath);
        try {
            let existing = await KrnlFS.readJSON(filePath);
            if (!existing) {
                existing = {};
            }
            const updated = ObjectKit.deepMerge(existing, patch);
            await KrnlFS.writeJSON(filePath, updated);
            return updated;
        }
        finally {
            release();
        }
    }
    // --- Directory primitives ---
    static async ensureDir(dirPath) {
        await fsp.mkdir(dirPath, { recursive: true });
    }
    static async deleteDir(dirPath, recursive = true) {
        await fsp.rm(dirPath, { recursive, force: true });
    }
    static async listDir(dirPath) {
        return await fsp.readdir(dirPath);
    }
    static async *walkDir(dirPath, filter) {
        const list = await KrnlFS.listDir(dirPath);
        for (const item of list) {
            const full = path.join(dirPath, item);
            const stat = await KrnlFS.getFileStat(full);
            if (stat.isDir) {
                yield* KrnlFS.walkDir(full, filter);
            }
            else {
                if (!filter || filter(full)) {
                    yield full;
                }
            }
        }
    }
    static async dirExists(dirPath) {
        try {
            const stat = await fsp.stat(dirPath);
            return stat.isDirectory();
        }
        catch (e) {
            return false;
        }
    }
    static async copyDir(src, dest) {
        await KrnlFS.ensureDir(dest);
        const list = await KrnlFS.listDir(src);
        for (const item of list) {
            const srcItem = path.join(src, item);
            const destItem = path.join(dest, item);
            const stat = await KrnlFS.getFileStat(srcItem);
            if (stat.isDir) {
                await KrnlFS.copyDir(srcItem, destItem);
            }
            else {
                await fsp.copyFile(srcItem, destItem);
            }
        }
    }
    // --- Path utilities ---
    static join(...parts) {
        return path.join(...parts);
    }
    static resolve(...parts) {
        return path.resolve(...parts);
    }
    static relative(from, to) {
        return path.relative(from, to);
    }
    static basename(filePath, ext) {
        return path.basename(filePath, ext);
    }
    static dirname(filePath) {
        return path.dirname(filePath);
    }
    static extname(filePath) {
        return path.extname(filePath);
    }
    static normalize(filePath) {
        return path.normalize(filePath);
    }
    static isSafe(filePath, root) {
        const resolvedPath = path.resolve(filePath);
        const resolvedRoot = path.resolve(root);
        return resolvedPath.startsWith(resolvedRoot);
    }
    // --- Candidate resolution ---
    static async firstExisting(candidates) {
        for (const cand of candidates) {
            if (await KrnlFS.fileExists(cand)) {
                return cand;
            }
        }
        return null;
    }
    // --- Watching ---
    static watchFile(filePath, handler, debounceMs = 100) {
        let timer = null;
        return fs.watch(filePath, (event) => {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => handler(event), debounceMs);
        });
    }
    static watchDir(dirPath, handler, debounceMs = 100) {
        let timer = null;
        return fs.watch(dirPath, (event, filename) => {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => handler(event, filename), debounceMs);
        });
    }
    // --- Temp ---
    static createTempFile(prefix = "tmp-") {
        return path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}.tmp`);
    }
    static createTempDir(prefix = "tmp-dir-") {
        const dir = path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(7)}`);
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    }
    static async withTempDir(fn, prefix = "tmp-") {
        const tempDir = KrnlFS.createTempDir(prefix);
        try {
            return await fn(tempDir);
        }
        finally {
            await KrnlFS.deleteDir(tempDir, true).catch(() => { });
        }
    }
}
//# sourceMappingURL=KrnlFS.js.map