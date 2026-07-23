/**
 * @file AsyncKit.ts
 * @description sleep, withTimeout, retry, pLimit, debounce, throttle, once, and memoize primitives.
 */
export declare class AsyncKit {
    /**
     * Classic sleep/delay.
     */
    static sleep(ms: number): Promise<void>;
    /**
     * Rejects if the task does not finish within ms.
     */
    static withTimeout<T>(promise: Promise<T>, ms: number, label?: string): Promise<T>;
    /**
     * Retries an async execution up to maxAttempts times.
     */
    static retry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs?: number): Promise<T>;
    static pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]>;
    /**
     * Debounces a function.
     */
    static debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
    /**
     * Throttles a function.
     */
    static throttle<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
    /**
     * Wraps a function to run only once and cache its outcome.
     */
    static once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T>;
    /**
     * computational memoization cache helper.
     */
    static memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): (...args: Parameters<T>) => ReturnType<T>;
}
//# sourceMappingURL=AsyncKit.d.ts.map