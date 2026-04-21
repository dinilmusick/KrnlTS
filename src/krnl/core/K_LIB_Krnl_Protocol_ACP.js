/**
 * @file K_LIB_Krnl_Protocol_ACP.js
 * @description Helper for Agent Communication Protocol (ACP) integration.
 * Enables agent-to-agent interoperability.
 */

export class KrnlAcpProtocol {
    /**
     * @param {import("./K_ENT_Krnl_System_Entity_Base.js").krnlSystemEntityBase} system
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
            services: manifest.inputs.api.map(fid => ({
                id: fid,
                name: fid,
                type: "functionality"
            })),
            events: manifest.outputs.events.map(eid => ({
                id: eid,
                type: "event"
            }))
        };
    }

    /**
     * ACP Message endpoint handler.
     * Maps incoming ACP messages to Krnl calls.
     */
    async handleMessage(payload) {
        const { target, action, data, metadata = {} } = payload;
        
        // In ACP, the 'action' is usually the tool/functionality name
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
        } catch (error) {
            return {
                status: "error",
                error: error.message,
                metadata: {
                    processedBy: this.system.entityName,
                    timestamp: Date.now()
                }
            };
        }
    }
}
