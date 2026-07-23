/**
 * @file K_LIB_Dasy_JS.js
 * @description The library that provides file operations for reading and writing data with a uniform API using the Browser Origin Private File System (OPFS).
 */
/**
 * DasyJS Class
 * Provides a uniform API for file operations on the JS platform using OPFS.
 */
export class DasyJS {
    constructor(rootName?: string);
    rootName: string;
    rootDir: FileSystemDirectoryHandle | null;
    /**
     * Initializes the file system access.
     */
    init(): Promise<void>;
    /**
     * Resolves a user path into normalized parts.
     * @param {string} userPath
     * @returns {string[]}
     */
    resolve(userPath: string): string[];
    /**
     * Internal helper to get a file handle.
     */
    getFileHandle(pathParts: any, create?: boolean): Promise<FileSystemFileHandle>;
    createFile(filePath: any): Promise<void>;
    deleteFile(filePath: any): Promise<void>;
    duplicateFile(source: any, destination: any): Promise<void>;
    writeText(filePath: any, data: any): Promise<void>;
    readText(filePath: any): Promise<string>;
    writeBytes(filePath: any, data: any): Promise<void>;
    readBytes(filePath: any): Promise<ArrayBuffer>;
}
//# sourceMappingURL=K_LIB_Dasy_JS.d.ts.map