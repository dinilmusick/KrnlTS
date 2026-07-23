/**
 * @file K_LIB_Krnl_Frontend_Bridge_Bundle.ts
 * @description Browser-compatible KrnlBridge class for frontend subapps to communicate with KrnlTS backend.
 */
export declare class KrnlBridge {
    wsUrl: string;
    httpUrl: string;
    ws: WebSocket | null;
    listeners: Map<string, Set<Function>>;
    renderId: string | null;
    role: string;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    reconnectTimeout: any;
    constructor(wsUrl: string, httpUrl: string);
    static createFromConfig(basePath?: string): Promise<KrnlBridge>;
    connect(renderId: string, role?: 'frontend' | 'backend'): Promise<void>;
    _handleReconnect(): void;
    send(message: any): void;
    disconnect(): void;
    call(fid: string, data?: any): Promise<any>;
    on(event: string, fn: (msg: any) => void): () => void;
    stream(fid: string, fn: (data: any) => void): () => void;
}
//# sourceMappingURL=K_LIB_Krnl_Frontend_Bridge_Bundle.d.ts.map