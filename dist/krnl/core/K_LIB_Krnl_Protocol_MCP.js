/**
 * @file K_LIB_Krnl_Protocol_MCP.ts
 * @description Helper for Model Context Protocol (MCP) integration.
 */
export class KrnlMcpProtocol {
    system;
    /**
     * @param system
     */
    constructor(system) {
        this.system = system;
    }
    /**
     * Returns the MCP Tools list based on system functionalities.
     */
    async listTools() {
        if (this.system._ingressNetwork) {
            const tools = this.system._ingressNetwork.getAggregatedMcpTools();
            return { tools };
        }
        const manifest = this.system.getManifest();
        const apiIds = Object.keys(manifest.inputs.api);
        const tools = apiIds.map(fid => {
            const functionality = this.system.resolveLocalFunctionality ? this.system.resolveLocalFunctionality(fid) : this.system.localFunctionalities.get(fid);
            const description = functionality?.description || `Execute ${fid} on ${this.system.entityName}`;
            let inputSchema = { type: "object", properties: {} };
            if (functionality?.schema?.input) {
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
    async handleRequest(rpc, opts = {}) {
        const { method, params, id } = rpc;
        if (method === 'tools/list') {
            const result = await this.listTools();
            return { jsonrpc: "2.0", id, result };
        }
        if (method === 'tools/call') {
            const { name, arguments: args } = params;
            try {
                let result;
                if (this.system._ingressNetwork && name.includes('.')) {
                    const parts = name.split('.');
                    const prefix = parts[0].toLowerCase();
                    const toolName = parts.slice(1).join('.');
                    const entry = this.system._ingressNetwork.members.get(prefix);
                    if (entry) {
                        result = await entry.entity.call(toolName, args, opts);
                    }
                    else {
                        throw new Error(`Ingress member for prefix '${prefix}' not found.`);
                    }
                }
                else {
                    result = await this.system.call(name, args, opts);
                }
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                    }
                };
            }
            catch (error) {
                return {
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: -32000,
                        message: error.message,
                        data: {
                            errorDocumentation: error.errorDocumentation || null
                        }
                    }
                };
            }
        }
        if (method === 'initialize') {
            return {
                jsonrpc: "2.0",
                id,
                result: {
                    protocolVersion: "2024-11-05",
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
//# sourceMappingURL=K_LIB_Krnl_Protocol_MCP.js.map