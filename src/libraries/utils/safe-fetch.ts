/**
 * @file safe-fetch.ts
 * @description Production resilient client fetch wrapper with in-flight deduplication,
 * 4xx circuit breaking, jittered exponential backoff, and execution timeout budgets.
 * File size < 200 lines strictly.
 */

export interface SafeFetchOptions extends RequestInit {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  dedupe?: boolean;
}

const inFlightGetRequests = new Map<string, Promise<Response>>();

export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 10000;
  const timeoutMs = options.timeoutMs ?? 12000;
  const shouldDedupe = options.dedupe ?? method === 'GET';

  const dedupeKey = shouldDedupe ? `${method}:${url}` : null;
  if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
    // Clone response so multiple readers can read body independently
    const res = await inFlightGetRequests.get(dedupeKey)!;
    return res.clone();
  }

  const executeWithRetry = async (): Promise<Response> => {
    let attempt = 0;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      // Link user signal if provided
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timer);

        // CIRCUIT BREAKER ON CLIENT ERRORS (4xx):
        // 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited)
        // Retrying client errors is futile and triggers IP bans and cost spikes.
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // Server errors (5xx) or success
        if (response.ok || attempt >= maxRetries) {
          return response;
        }
      } catch (err: any) {
        clearTimeout(timer);
        if (err.name === 'AbortError' && options.signal?.aborted) {
          throw err; // Explicit user cancellation
        }
        if (attempt >= maxRetries) {
          throw err;
        }
      }

      // Calculate Exponential Backoff with Full Jitter (+/- 15%)
      const exponential = baseDelayMs * Math.pow(2, attempt);
      const capped = Math.min(exponential, maxDelayMs);
      const jittered = capped * (0.85 + Math.random() * 0.3);

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, jittered));
    }

    throw new Error(`safeFetch failed after ${maxRetries} retries: ${url}`);
  };

  if (!dedupeKey) {
    return executeWithRetry();
  }

  const inFlightPromise = executeWithRetry().finally(() => {
    inFlightGetRequests.delete(dedupeKey);
  });

  inFlightGetRequests.set(dedupeKey, inFlightPromise);
  const finalResponse = await inFlightPromise;
  return finalResponse.clone();
}

/**
 * Type-safe JSON API caller built on top of safeFetch
 */
export async function safeRequestJson<T>(url: string, options: SafeFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await safeFetch(url, { ...options, headers });
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.error || errData.message) {
        errorMsg = errData.error || errData.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}
