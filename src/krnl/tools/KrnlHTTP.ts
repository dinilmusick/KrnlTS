/**
 * @file KrnlHTTP.ts
 * @description Safe, type-safe HTTP client wrapper.
 */

import { KrnlResult } from "./KrnlResult.js";
import { AsyncKit } from "./AsyncKit.js";

export interface KrnlHTTPOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class KrnlHTTP {
  /**
   * Helper to perform fetch with timeout and retries.
   */
  private static async requestRaw(url: string, opts: KrnlHTTPOptions = {}): Promise<Response> {
    const timeout = opts.timeout || 15000;
    const retries = opts.retries || 0;

    const perform = async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, {
          ...opts,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (e: any) {
        clearTimeout(id);
        throw e;
      }
    };

    return await AsyncKit.retry(perform, retries + 1, 1000);
  }

  static async request<T>(url: string, opts: KrnlHTTPOptions = {}): Promise<KrnlResult<T>> {
    try {
      const res = await KrnlHTTP.requestRaw(url, opts);
      if (!res.ok) {
        return KrnlResult.fail<T>(`HTTP Error ${res.status}: ${res.statusText}`, res.status);
      }
      const data = await res.json() as T;
      return KrnlResult.ok<T>(data);
    } catch (e: any) {
      return KrnlResult.fail<T>(e.message || String(e));
    }
  }

  static async get<T>(url: string, opts: KrnlHTTPOptions = {}): Promise<KrnlResult<T>> {
    return await KrnlHTTP.request<T>(url, { ...opts, method: "GET" });
  }

  static async post<T>(url: string, body: any, opts: KrnlHTTPOptions = {}): Promise<KrnlResult<T>> {
    return await KrnlHTTP.request<T>(url, {
      ...opts,
      method: "POST",
      headers: { "Content-Type": "application/json", ...opts.headers },
      body: JSON.stringify(body)
    });
  }

  static async put<T>(url: string, body: any, opts: KrnlHTTPOptions = {}): Promise<KrnlResult<T>> {
    return await KrnlHTTP.request<T>(url, {
      ...opts,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...opts.headers },
      body: JSON.stringify(body)
    });
  }

  static async del<T>(url: string, opts: KrnlHTTPOptions = {}): Promise<KrnlResult<T>> {
    return await KrnlHTTP.request<T>(url, { ...opts, method: "DELETE" });
  }

  /**
   * Creates a client instance.
   */
  static createClient(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    return {
      get: <T>(path: string, opts: KrnlHTTPOptions = {}) =>
        KrnlHTTP.get<T>(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      post: <T>(path: string, body: any, opts: KrnlHTTPOptions = {}) =>
        KrnlHTTP.post<T>(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      put: <T>(path: string, body: any, opts: KrnlHTTPOptions = {}) =>
        KrnlHTTP.put<T>(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
      del: <T>(path: string, opts: KrnlHTTPOptions = {}) =>
        KrnlHTTP.del<T>(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
    };
  }

  /**
   * Streaming SSE / Chunk response.
   */
  static async *streamResponse(url: string, opts: KrnlHTTPOptions = {}): AsyncIterable<string> {
    const res = await KrnlHTTP.requestRaw(url, opts);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to initialize stream: HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
}
