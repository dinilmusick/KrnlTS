/**
 * @file KrnlFS.ts
 * @description Robust cross-platform filesystem abstraction layer for KrnlTS.
 */
import fs from "fs";
export type ReleaseFn = () => void;
export declare class FileLock {
    private static locks;
    static acquire(filePath: string): Promise<ReleaseFn>;
}
export declare class KrnlFS {
    static readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
    static writeFile(filePath: string, content: string | Buffer): Promise<void>;
    /**
     * Atomic file writing via temp files.
     */
    static writeFileAtomic(filePath: string, content: string | Buffer): Promise<void>;
    static appendFile(filePath: string, content: string | Buffer): Promise<void>;
    static deleteFile(filePath: string): Promise<void>;
    static fileExists(filePath: string): Promise<boolean>;
    static getFileStat(filePath: string): Promise<{
        size: number;
        createdAt: Date;
        modifiedAt: Date;
        isDir: boolean;
    }>;
    static readJSON<T>(filePath: string): Promise<T | null>;
    static writeJSON(filePath: string, data: unknown, indent?: number): Promise<void>;
    static updateJSON<T>(filePath: string, patch: Partial<T>): Promise<T>;
    static ensureDir(dirPath: string): Promise<void>;
    static deleteDir(dirPath: string, recursive?: boolean): Promise<void>;
    static listDir(dirPath: string): Promise<string[]>;
    static walkDir(dirPath: string, filter?: (file: string) => boolean): AsyncIterable<string>;
    static dirExists(dirPath: string): Promise<boolean>;
    static copyDir(src: string, dest: string): Promise<void>;
    static join(...parts: string[]): string;
    static resolve(...parts: string[]): string;
    static relative(from: string, to: string): string;
    static basename(filePath: string, ext?: string): string;
    static dirname(filePath: string): string;
    static extname(filePath: string): string;
    static normalize(filePath: string): string;
    static isSafe(filePath: string, root: string): boolean;
    static firstExisting(candidates: string[]): Promise<string | null>;
    static watchFile(filePath: string, handler: (event: string) => void, debounceMs?: number): fs.FSWatcher;
    static watchDir(dirPath: string, handler: (event: string, filename: string | null) => void, debounceMs?: number): fs.FSWatcher;
    static createTempFile(prefix?: string): string;
    static createTempDir(prefix?: string): string;
    static withTempDir<T>(fn: (tempDir: string) => Promise<T>, prefix?: string): Promise<T>;
}
//# sourceMappingURL=KrnlFS.d.ts.map