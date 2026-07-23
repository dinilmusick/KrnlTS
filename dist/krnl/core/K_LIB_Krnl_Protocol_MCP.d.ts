/**
 * @file K_LIB_Krnl_Protocol_MCP.ts
 * @description Helper for Model Context Protocol (MCP) integration.
 */
export declare class KrnlMcpProtocol {
    system: any;
    /**
     * @param system
     */
    constructor(system: any);
    /**
     * Returns the MCP Tools list based on system functionalities.
     */
    listTools(): Promise<any>;
    /**
     * Handles an MCP JSON-RPC request.
     */
    handleRequest(rpc: any, opts?: any): Promise<any>;
}
//# sourceMappingURL=K_LIB_Krnl_Protocol_MCP.d.ts.map