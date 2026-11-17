/**
 * @file async.ts
 * @description sleep, withTimeout, retry, pLimit, debounce, throttle, once, and memoize primitives.
 */

/**
 * Classic sleep/delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rejects if the task does not finish within ms.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[SkipoTimeoutError] ${label} timed out after ${ms}ms`));
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
export async function retry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs = 1000): Promise<T> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (err: any) {
      attempts++;
      if (attempts >= maxAttempts) {
        throw err;
      }
      await sleep(delayMs);
    }
  }
  throw new Error("Retry failed");
}

/**
 * Limits concurrent async task execution.
 */
export async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  const worker = async () => {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency && i < tasks.length; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

/**
 * Debounces a function.
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttles a function.
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
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
export function once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  let run = false;
  let result: ReturnType<T>;
  return (...args: Parameters<T>) => {
    if (!run) {
      run = true;
      result = fn(...args);
    }
    return result;
  };
}

/**
 * Computational memoization cache helper.
 */
export function memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: Parameters<T>) => string): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  return (...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const val = fn(...args);
    cache.set(key, val);
    return val;
  };
}
