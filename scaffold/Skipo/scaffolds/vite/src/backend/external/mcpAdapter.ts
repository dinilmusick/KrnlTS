import { CapabilityRegistry } from "./registry.js";
import { ExternalCapabilityContext, ExternalInterfaceError, ExternalPrincipal } from "./contract.js";
export interface McpAdapterOptions { registry: CapabilityRegistry; authenticate(request: Request): Promise<ExternalPrincipal | null>; serverName?: string; serverVersion?: string; }
type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const response = (id: RpcRequest["id"], result: unknown) => new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store", "mcp-protocol-version": "2025-03-26" } });
const rpcError = (id: RpcRequest["id"], code: number, message: string) => new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store", "mcp-protocol-version": "2025-03-26" } });
export function createMcpHandler(options: McpAdapterOptions) {
  return async (request: Request): Promise<Response | null> => {
    if (!["/mcp", "/api/mcp"].includes(new URL(request.url).pathname)) return null;
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { allow: "POST" } });
    let rpc: RpcRequest;
    try { rpc = await request.json() as RpcRequest; } catch { return rpcError(null, -32700, "Parse error"); }
    if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") return rpcError(rpc.id ?? null, -32600, "Invalid Request");
    if (!("id" in rpc)) {
      if (rpc.method === "notifications/initialized") return new Response(null, { status: 202, headers: { "cache-control": "no-store" } });
      return rpcError(null, -32600, "Invalid Request");
    }
    try {
      const principal = await options.authenticate(request);
      const context: ExternalCapabilityContext = { principal, transport: "mcp", requestId: request.headers.get("x-request-id") ?? crypto.randomUUID() };
      if (rpc.method === "initialize") return response(rpc.id, { protocolVersion: "2025-03-26", capabilities: { tools: { listChanged: false } }, serverInfo: { name: options.serverName ?? "skipo-application", version: options.serverVersion ?? "1.0.0" } });
      if (rpc.method === "ping") return response(rpc.id, {});
      if (rpc.method === "tools/list") return response(rpc.id, { tools: options.registry.list(principal).map(cap => ({ name: cap.id, title: cap.id, description: cap.description, inputSchema: cap.inputSchema, outputSchema: cap.outputSchema, _meta: { "skipo/invocation": cap.invocation } })) });
      if (rpc.method === "tools/call") {
        const params = rpc.params ?? {}, name = params.name;
        if (typeof name !== "string") return rpcError(rpc.id, -32602, "Tool name is required");
        try {
          const output = await options.registry.invoke(name, params.arguments ?? {}, context);
          return response(rpc.id, { content: [{ type: "text", text: JSON.stringify(output) }], structuredContent: output, isError: false });
        } catch (error) {
          const code = error instanceof ExternalInterfaceError ? error.code : "INTERNAL_ERROR";
          const message = error instanceof ExternalInterfaceError && error.expose ? error.message : "Internal server error";
          return response(rpc.id, { content: [{ type: "text", text: message }], structuredContent: { error: { code, message } }, isError: true });
        }
      }
      return rpcError(rpc.id, -32601, "Method not found");
    } catch { return rpcError(rpc.id ?? null, -32603, "Internal error"); }
  };
}
