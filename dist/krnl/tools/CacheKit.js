/**
 * @file CacheKit.ts
 * @description LRU cache, TTL cache, Stale-While-Revalidate, and File-system persistent caching.
 */
import fs from "fs";
import path from "path";
export class LRUCache {
    maxSize;
    cache;
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key))
            return undefined;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val); // Move to end (most recently used)
        return val;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            // Evict least recently used (first item in Map)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined)
                this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
export class TTLCache {
    ttlMs;
    cache;
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
        this.cache = new Map();
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    set(key, value) {
        this.cache.set(key, {
            value,
            expires: Date.now() + this.ttlMs
        });
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
export class CacheKit {
    /**
     * Stale-While-Revalidate utility.
     */
    static swr(cache, key, fetchFn) {
        const cached = cache.get(key);
        if (cached !== null) {
            // Revalidate in the background (deferred to next event loop tick)
            setTimeout(() => {
                fetchFn().then(fresh => cache.set(key, fresh)).catch(() => { });
            }, 0);
            return Promise.resolve(cached);
        }
        return fetchFn().then(fresh => {
            cache.set(key, fresh);
            return fresh;
        });
    }
}
export class FileCache {
    cacheDir;
    constructor(cacheDir) {
        this.cacheDir = cacheDir;
        try {
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
        }
        catch (e) { }
    }
    getFilePath(key) {
        return path.join(this.cacheDir, `${encodeURIComponent(key)}.json`);
    }
    get(key) {
        const file = this.getFilePath(key);
        if (!fs.existsSync(file))
            return null;
        try {
            const content = fs.readFileSync(file, "utf8");
            return JSON.parse(content);
        }
        catch (e) {
            return null;
        }
    }
    set(key, value) {
        const file = this.getFilePath(key);
        try {
            fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
        }
        catch (e) { }
    }
    delete(key) {
        const file = this.getFilePath(key);
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            }
            catch (e) { }
        }
    }
    clear() {
        try {
            const files = fs.readdirSync(this.cacheDir);
            for (const file of files) {
                fs.unlinkSync(path.join(this.cacheDir, file));
            }
        }
        catch (e) { }
    }
}
//# sourceMappingURL=CacheKit.js.map