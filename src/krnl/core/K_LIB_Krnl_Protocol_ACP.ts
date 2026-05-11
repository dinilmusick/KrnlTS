/**
 * @file K_LIB_Krnl_Protocol_ACP.ts
 * @description Helper for Agent Communication Protocol (ACP) integration.
 */

export class KrnlAcpProtocol {
    system: any;

    /**
     * @param system
     */
    constructor(system: any) {
        this.system = system;
    }

    /**
     * ACP Information endpoint.
     */
    getInfo(): any {
        const manifest = (this.system as any).getManifest();
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
    getCapabilities(): any {
        const manifest = (this.system as any).getManifest();
        return {
            services: Object.keys(manifest.inputs.api).map(fid => ({
                id: fid,
                name: fid,
                type: "functionality"
            })),
            events: manifest.outputs.events.map((eid: string) => ({
                id: eid,
                type: "event"
            }))
        };
    }

    /**
     * ACP Message endpoint handler.
     */
    async handleMessage(payload: any): Promise<any> {
        const { action, data } = payload;
        
        try {
            const result = await this.system.call(action, data);
            return {
                status: "success",
                result,
                metadata: {
                    processedBy: this.system.entityName,
                    timestamp: Date.now()
                }
            };
        } catch (error: any) {
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
