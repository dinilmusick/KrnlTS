/**
 * @file K_LIB_Krnl_System_Unified_Http_Adapter.ts
 * @description Unified HTTP adapter that exposes REST, SSE, MCP, and ACP protocols.
 */
import http from 'http';
import { KrnlMcpProtocol } from './K_LIB_Krnl_Protocol_MCP.js';
import { KrnlAcpProtocol } from './K_LIB_Krnl_Protocol_ACP.js';
export declare class krnlUnifiedHttpAdapter {
    system: any;
    port: number;
    host: string;
    server: http.Server | null;
    _isExternalServer: boolean;
    mcp: KrnlMcpProtocol;
    acp: KrnlAcpProtocol;
    enableFriendlyRouting: boolean;
    /**
     * @param system
     * @param port
     * @param host
     */
    constructor(system: any, port: number, host?: string);
    /**
     * Starts the adapter.
     */
    start(externalServer?: http.Server | null): Promise<void>;
    stop(): void;
    _handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
    _handleSse(req: http.IncomingMessage, res: http.ServerResponse, fid: string): void;
    _sendJson(res: http.ServerResponse, status: number, data: any): void;
    _readJsonBody(req: http.IncomingMessage): Promise<any>;
}
//# sourceMappingURL=K_LIB_Krnl_System_Unified_Http_Adapter.d.ts.map