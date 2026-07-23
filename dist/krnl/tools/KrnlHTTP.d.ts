/**
 * @file KrnlHTTP.ts
 * @description Safe, type-safe HTTP client wrapper.
 */
export interface KrnlHTTPOptions extends RequestInit {
    timeout?: number;
    retries?: number;
}
export interface KrnlResult<T> {
    status: "success" | "error";
    data?: T;
    message?: string;
    code?: number;
}
export declare class KrnlHTTP {
    /**
     * Helper to perform fetch with timeout and retries.
     */
    private static requestRaw;
    static request<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static get<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static post<T>(url: string, body: any, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static put<T>(url: string, body: any, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    static del<T>(url: string, opts?: KrnlHTTPOptions): Promise<KrnlResult<T>>;
    /**
     * Creates a client instance.
     */
    static createClient(baseUrl: string, defaultHeaders?: Record<string, string>): {
        get: <T>(path: string, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        post: <T>(path: string, body: any, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        put: <T>(path: string, body: any, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
        del: <T>(path: string, opts?: KrnlHTTPOptions) => Promise<KrnlResult<T>>;
    };
    /**
     * Streaming SSE / Chunk response.
     */
    static streamResponse(url: string, opts?: KrnlHTTPOptions): AsyncIterable<string>;
}
//# sourceMappingURL=KrnlHTTP.d.ts.map