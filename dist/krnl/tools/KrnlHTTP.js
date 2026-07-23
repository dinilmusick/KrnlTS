/**
 * @file KrnlHTTP.ts
 * @description Safe, type-safe HTTP client wrapper.
 */
import { AsyncKit } from "./AsyncKit.js";
export class KrnlHTTP {
    /**
     * Helper to perform fetch with timeout and retries.
     */
    static async requestRaw(url, opts = {}) {
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
            }
            catch (e) {
                clearTimeout(id);
                throw e;
            }
        };
        return await AsyncKit.retry(perform, retries + 1, 1000);
    }
    static async request(url, opts = {}) {
        try {
            const res = await KrnlHTTP.requestRaw(url, opts);
            if (!res.ok) {
                return { status: "error", message: `HTTP Error ${res.status}: ${res.statusText}`, code: res.status };
            }
            const data = await res.json();
            return { status: "success", data };
        }
        catch (e) {
            return { status: "error", message: e.message || String(e) };
        }
    }
    static async get(url, opts = {}) {
        return await KrnlHTTP.request(url, { ...opts, method: "GET" });
    }
    static async post(url, body, opts = {}) {
        return await KrnlHTTP.request(url, {
            ...opts,
            method: "POST",
            headers: { "Content-Type": "application/json", ...opts.headers },
            body: JSON.stringify(body)
        });
    }
    static async put(url, body, opts = {}) {
        return await KrnlHTTP.request(url, {
            ...opts,
            method: "PUT",
            headers: { "Content-Type": "application/json", ...opts.headers },
            body: JSON.stringify(body)
        });
    }
    static async del(url, opts = {}) {
        return await KrnlHTTP.request(url, { ...opts, method: "DELETE" });
    }
    /**
     * Creates a client instance.
     */
    static createClient(baseUrl, defaultHeaders = {}) {
        return {
            get: (path, opts = {}) => KrnlHTTP.get(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
            post: (path, body, opts = {}) => KrnlHTTP.post(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
            put: (path, body, opts = {}) => KrnlHTTP.put(`${baseUrl}${path}`, body, { ...opts, headers: { ...defaultHeaders, ...opts.headers } }),
            del: (path, opts = {}) => KrnlHTTP.del(`${baseUrl}${path}`, { ...opts, headers: { ...defaultHeaders, ...opts.headers } })
        };
    }
    /**
     * Streaming SSE / Chunk response.
     */
    static async *streamResponse(url, opts = {}) {
        const res = await KrnlHTTP.requestRaw(url, opts);
        if (!res.ok || !res.body) {
            throw new Error(`Failed to initialize stream: HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                yield decoder.decode(value, { stream: true });
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
//# sourceMappingURL=KrnlHTTP.js.map