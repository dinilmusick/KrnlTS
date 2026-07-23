/**
 * @file AsyncKit.ts
 * @description sleep, withTimeout, retry, pLimit, debounce, throttle, once, and memoize primitives.
 */
export class AsyncKit {
    /**
     * Classic sleep/delay.
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Rejects if the task does not finish within ms.
     */
    static withTimeout(promise, ms, label = "Operation") {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(new Error(`[KrnlTimeoutError] ${label} timed out after ${ms}ms`));
            }, ms);
        });
        return Promise.race([
            promise.then(val => {
                clearTimeout(timer);
                return val;
            }),
            timeoutPromise
        ]);
    }
    /**
     * Retries an async execution up to maxAttempts times.
     */
    static async retry(fn, maxAttempts, delayMs = 1000) {
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                return await fn();
            }
            catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw err;
                }
                await AsyncKit.sleep(delayMs);
            }
        }
        throw new Error("Retry failed");
    }
    static async pLimit(tasks, concurrency) {
        const results = [];
        let index = 0;
        const worker = async () => {
            while (index < tasks.length) {
                const i = index++;
                results[i] = await tasks[i]();
            }
        };
        const workers = [];
        for (let i = 0; i < concurrency && i < tasks.length; i++) {
            workers.push(worker());
        }
        await Promise.all(workers);
        return results;
    }
    /**
     * Debounces a function.
     */
    static debounce(fn, ms) {
        let timer = null;
        return (...args) => {
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }
    /**
     * Throttles a function.
     */
    static throttle(fn, ms) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= ms) {
                lastCall = now;
                fn(...args);
            }
        };
    }
    /**
     * Wraps a function to run only once and cache its outcome.
     */
    static once(fn) {
        let run = false;
        let result;
        return (...args) => {
            if (!run) {
                run = true;
                result = fn(...args);
            }
            return result;
        };
    }
    /**
     * computational memoization cache helper.
     */
    static memoize(fn, keyFn) {
        const cache = new Map();
        return (...args) => {
            const key = keyFn ? keyFn(...args) : JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const val = fn(...args);
            cache.set(key, val);
            return val;
        };
    }
}
//# sourceMappingURL=AsyncKit.js.map