//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file K_LIB_Dasy_JS.js
 * @description The library that provides file operations for reading and writing data with a uniform API using the Browser Origin Private File System (OPFS).
 */
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// DASY JS ////////////////////////////////////////
/**
 * DasyJS Class
 * Provides a uniform API for file operations on the JS platform using OPFS.
 */
export class DasyJS {
    constructor(rootName = "dasy-root") {
        this.rootName = rootName;
        this.rootDir = null;
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// INITIALIZATION AND PATH RESOLUTION ///////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Initializes the file system access.
     */
    async init() {
        const storageRoot = await navigator.storage.getDirectory();
        this.rootDir = await storageRoot.getDirectoryHandle(this.rootName, {
            create: true
        });
    }
    /**
     * Resolves a user path into normalized parts.
     * @param {string} userPath
     * @returns {string[]}
     */
    resolve(userPath) {
        const trimmed = (userPath || "").trim();
        if (!trimmed)
            throw new Error("invalid path");
        const relative = trimmed.replace(/^\/+/, "");
        const normalized = relative.replace(/\\/g, "/");
        if (normalized.includes("..")) {
            throw new Error("invalid path");
        }
        return normalized.split("/").filter(Boolean);
    }
    /**
     * Internal helper to get a file handle.
     */
    async getFileHandle(pathParts, create = false) {
        let current = this.rootDir;
        for (let i = 0; i < pathParts.length - 1; i++) {
            current = await current.getDirectoryHandle(pathParts[i], { create });
        }
        return current.getFileHandle(pathParts.at(-1), { create });
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// FILE OPERATIONS //////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    async createFile(filePath) {
        const parts = this.resolve(filePath);
        await this.getFileHandle(parts, true);
    }
    async deleteFile(filePath) {
        const parts = this.resolve(filePath);
        let current = this.rootDir;
        for (let i = 0; i < parts.length - 1; i++) {
            current = await current.getDirectoryHandle(parts[i]);
        }
        try {
            await current.removeEntry(parts.at(-1));
        }
        catch (err) {
            if (err.name !== "NotFoundError")
                throw err;
        }
    }
    async duplicateFile(source, destination) {
        const data = await this.readBytes(source);
        await this.writeBytes(destination, data);
    }
    async writeText(filePath, data) {
        const parts = this.resolve(filePath);
        const handle = await this.getFileHandle(parts, true);
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
    }
    async readText(filePath) {
        const parts = this.resolve(filePath);
        const handle = await this.getFileHandle(parts);
        const file = await handle.getFile();
        return file.text();
    }
    async writeBytes(filePath, data) {
        const parts = this.resolve(filePath);
        const handle = await this.getFileHandle(parts, true);
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
    }
    async readBytes(filePath) {
        const parts = this.resolve(filePath);
        const handle = await this.getFileHandle(parts);
        const file = await handle.getFile();
        return file.arrayBuffer();
    }
}
//# sourceMappingURL=K_LIB_Dasy_JS.js.map