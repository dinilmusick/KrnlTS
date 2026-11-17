/**
 * @file AITransportClient.ts
 * @description Universal HTTP/JSON Transport Client for AI Provider APIs
 */

export interface AIHttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AIHttpResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: T;
  rawText: string;
}

export class AITransportClient {
  private readonly defaultTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: { defaultTimeoutMs?: number; customFetch?: typeof fetch }) {
    this.defaultTimeoutMs = config?.defaultTimeoutMs ?? 30000;
    this.fetchImpl = config?.customFetch ?? globalThis.fetch;
  }

  async request<T = unknown>(req: AIHttpRequest): Promise<AIHttpResponse<T>> {
    const timeoutMs = req.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    let isTimedOut = false;

    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort();
    }, timeoutMs);

    if (req.signal) {
      if (req.signal.aborted) {
        clearTimeout(timeoutId);
        throw new Error('Request was aborted prior to execution');
      }
      req.signal.addEventListener('abort', () => controller.abort());
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(req.headers || {}),
    };

    let bodyPayload: string | undefined;
    if (req.body !== undefined && req.body !== null && req.method !== 'GET' && req.method !== 'HEAD') {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      bodyPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    try {
      const response = await this.fetchImpl(req.url, {
        method: req.method || 'GET',
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });

      const resHeaders: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        resHeaders[k.toLowerCase()] = v;
      });

      const rawText = await response.text();
      let data: T;
      try {
        data = JSON.parse(rawText) as T;
      } catch {
        data = rawText as unknown as T;
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: resHeaders,
        data,
        rawText,
      };
    } catch (err: unknown) {
      if (isTimedOut) {
        throw new Error(`AI request timed out after ${timeoutMs}ms against ${req.url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
