/**
 * @file http.ts
 * @description Safe, type-safe HTTP client wrapper.
 */

import { retry } from "./async.js";

export interface SkipoHTTPOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export interface SkipoHTTPResult<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  code?: number;
}

/**
 * Helper to perform fetch with timeout and retries.
 */
export async function requestRaw(url: string, opts: SkipoHTTPOptions = {}): Promise<Response> {
  const timeout = opts.timeout || 60000;
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

  return await retry(perform, retries + 1, 1000);
}

export async function request<T>(url: string, opts: SkipoHTTPOptions = {}): Promise<SkipoHTTPResult<T>> {
  try {
    const res = await requestRaw(url, opts);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.toLowerCase().includes("application/json");

    if (!res.ok) {
      let errorMessage = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        if (isJson) {
          const errData = (await res.json()) as any;
          errorMessage = errData?.message || errData?.error || errorMessage;
        } else {
          const rawText = await res.text();
          if (rawText.trim()) {
            errorMessage = rawText.length > 200 ? `${rawText.slice(0, 200)}...` : rawText;
          }
        }
      } catch {}
      return { status: "error", message: errorMessage, code: res.status };
    }

    if (!isJson) {
      const text = await res.text();
      return {
        status: "error",
        message: `Expected JSON response but received "${contentType || 'text/plain'}": ${text.slice(0, 100)}`,
        code: res.status
      };
    }

    const data = await res.json() as T;
    return { status: "success", data };
  } catch (e: any) {
    return { status: "error", message: e.message || String(e) };
  }
}


export async function get<T>(url: string, opts: SkipoHTTPOptions = {}): Promise<SkipoHTTPResult<T>> {
  return await request<T>(url, { ...opts, method: "GET" });
}

export async function post<T>(url: string, body: any, opts: SkipoHTTPOptions = {}): Promise<SkipoHTTPResult<T>> {
  return await request<T>(url, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json", ...opts.headers },
    body: JSON.stringify(body)
  });
}

export async function put<T>(url: string, body: any, opts: SkipoHTTPOptions = {}): Promise<SkipoHTTPResult<T>> {
  return await request<T>(url, {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...opts.headers },
    body: JSON.stringify(body)
  });
}

export async function del<T>(url: string, opts: SkipoHTTPOptions = {}): Promise<SkipoHTTPResult<T>> {
  return await request<T>(url, { ...opts, method: "DELETE" });
}

/**
 * Creates a client instance.
 */
export function createClient(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
  return {
    get: <T>(path: string, opts: SkipoHTTPOptions = {}) =>
      get<T>(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
    post: <T>(path: string, body: any, opts: SkipoHTTPOptions = {}) =>
      post<T>(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
    put: <T>(path: string, body: any, opts: SkipoHTTPOptions = {}) =>
      put<T>(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
    del: <T>(path: string, opts: SkipoHTTPOptions = {}) =>
      del<T>(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
  };
}

/**
 * Streaming SSE / Chunk response.
 */
export async function* streamResponse(url: string, opts: SkipoHTTPOptions = {}): AsyncIterable<string> {
  const res = await requestRaw(url, opts);
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
