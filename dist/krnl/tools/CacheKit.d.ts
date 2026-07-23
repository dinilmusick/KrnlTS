/**
 * @file CacheKit.ts
 * @description LRU cache, TTL cache, Stale-While-Revalidate, and File-system persistent caching.
 */
export declare class LRUCache<K, V> {
    private maxSize;
    private cache;
    constructor(maxSize: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
    size(): number;
}
export declare class TTLCache<K, V> {
    private ttlMs;
    private cache;
    constructor(ttlMs: number);
    get(key: K): V | null;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
}
export declare class CacheKit {
    /**
     * Stale-While-Revalidate utility.
     */
    static swr<K, V>(cache: TTLCache<K, V>, key: K, fetchFn: () => Promise<V>): Promise<V>;
}
export declare class FileCache<T> {
    private cacheDir;
    constructor(cacheDir: string);
    private getFilePath;
    get(key: string): T | null;
    set(key: string, value: T): void;
    delete(key: string): void;
    clear(): void;
}
//# sourceMappingURL=CacheKit.d.ts.map