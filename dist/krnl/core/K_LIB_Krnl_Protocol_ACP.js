/**
 * @file K_LIB_Krnl_Protocol_ACP.ts
 * @description Helper for Agent Communication Protocol (ACP) integration.
 */
export class KrnlAcpProtocol {
    system;
    /**
     * @param system
     */
    constructor(system) {
        this.system = system;
    }
    /**
     * ACP Information endpoint.
     */
    getInfo() {
        const manifest = this.system.getManifest();
        return {
            agentId: this.system.entityName,
            type: manifest.systemType,
            version: "1.0.0",
            protocols: ["ACP", "MCP", "KrnlWS"],
            description: `Krnl System Entity: ${this.system.entityName}`
        };
    }
    /**
     * ACP Capabilities endpoint.
     */
    getCapabilities() {
        const manifest = this.system.getManifest();
        return {
            services: Object.keys(manifest.inputs.api).map(fid => ({
                id: fid,
                name: fid,
                type: "functionality"
            })),
            events: manifest.outputs.events.map((eid) => ({
                id: eid,
                type: "event"
            }))
        };
    }
    /**
     * ACP Message endpoint handler.
     */
    async handleMessage(payload, opts = {}) {
        const { action, data } = payload;
        try {
            const result = await this.system.call(action, data, opts);
            return {
                status: "success",
                result,
                metadata: {
                    processedBy: this.system.entityName,
                    timestamp: Date.now()
                }
            };
        }
        catch (error) {
            return {
                status: "error",
                error: error.message,
                errorDocumentation: error.errorDocumentation || null,
                metadata: {
                    processedBy: this.system.entityName,
                    timestamp: Date.now()
                }
            };
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_Protocol_ACP.js.map