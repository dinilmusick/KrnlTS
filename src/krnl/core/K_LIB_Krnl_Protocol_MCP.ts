/**
 * @file K_LIB_Krnl_Protocol_MCP.ts
 * @description Helper for Model Context Protocol (MCP) integration.
 */

export class KrnlMcpProtocol {
    system: any;

    /**
     * @param system
     */
    constructor(system: any) {
        this.system = system;
    }

    /**
     * Returns the MCP Tools list based on system functionalities.
     */
    async listTools(): Promise<any> {
        const manifest = (this.system as any).getManifest();
        const apiIds = Object.keys(manifest.inputs.api);
        
        const tools = apiIds.map(fid => {
            const functionality = (this.system as any).localFunctionalities.get(fid);
            const description = functionality?.description || `Execute ${fid} on ${this.system.entityName}`;
            
            let inputSchema: any = { type: "object", properties: {} };
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
    async handleRequest(rpc: any): Promise<any> {
        const { method, params, id } = rpc;

        if (method === 'tools/list') {
            const result = await this.listTools();
            return { jsonrpc: "2.0", id, result };
        }

        if (method === 'tools/call') {
            const { name, arguments: args } = params;
            try {
                const result = await this.system.call(name, args);
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
                    }
                };
            } catch (error: any) {
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
