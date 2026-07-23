/**
 * @file K_LIB_Krnl_Protocol_ACP.ts
 * @description Helper for Agent Communication Protocol (ACP) integration.
 */
export declare class KrnlAcpProtocol {
    system: any;
    /**
     * @param system
     */
    constructor(system: any);
    /**
     * ACP Information endpoint.
     */
    getInfo(): any;
    /**
     * ACP Capabilities endpoint.
     */
    getCapabilities(): any;
    /**
     * ACP Message endpoint handler.
     */
    handleMessage(payload: any, opts?: any): Promise<any>;
}
//# sourceMappingURL=K_LIB_Krnl_Protocol_ACP.d.ts.map