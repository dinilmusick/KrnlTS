/**
 * @file K_LIB_Krnl_Protocol_MCP.js
 * @description Helper for Model Context Protocol (MCP) integration.
 */

export class KrnlMcpProtocol {
    /**
     * @param {import("./K_ENT_Krnl_System_Entity_Base.js").krnlSystemEntityBase} system
     */
    constructor(system) {
        this.system = system;
    }

    /**
     * Returns the MCP Tools list based on system functionalities.
     */
    async listTools() {
        const manifest = this.system.getManifest();
        const tools = manifest.inputs.api.map(fid => {
            // Try to find the functionality to get schema if available
            const functionality = this.system.localFunctionalities.get(fid);
            const description = functionality?.description || `Execute ${fid} on ${this.system.entityName}`;
            
            // Basic schema mapping
            let inputSchema = { type: "object", properties: {} };
            if (functionality?.schema?.input) {
                // If it's a simple function/validator, we can't easily introspect it into JSON Schema
                // but we can provide a generic 'data' property.
                inputSchema.properties = {
                    data: { type: "object", description: "Input data for the functionality" }
                };
            }

            return {
                name: fid,
                description: description,
                inputSchema: inputSchema
            };
        });

        return { tools };
    }

    /**
     * Handles an MCP JSON-RPC request.
     */
    async handleRequest(rpc) {
        const { method, params, id } = rpc;

        if (method === 'tools/list') {
            const result = await this.listTools();
            return { jsonrpc: "2.0", id, result };
        }

        if (method === 'tools/call') {
            const { name, arguments: args } = params;
            try {
                // MCP 'arguments' usually maps to our 'data' input
                const result = await this.system.call(name, args);
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                    }
                };
            } catch (error) {
                return {
                    jsonrpc: "2.0",
                    id,
                    error: { code: -32000, message: error.message }
                };
            }
        }

        if (method === 'initialize') {
            return {
                jsonrpc: "2.0",
                id,
                result: {
                    protocolVersion: "2024-11-05", // Standard MCP version
                    capabilities: {
                        tools: { listChanged: false }
                    },
                    serverInfo: {
                        name: this.system.entityName,
                        version: "1.0.0"
                    }
                }
            };
        }

        return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: "Method not found" }
        };
    }
}
