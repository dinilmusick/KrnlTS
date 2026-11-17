import { CapabilityRegistry } from "./registry.js";
import { ExternalCapabilityContext, ExternalInterfaceError, ExternalPrincipal } from "./contract.js";
export interface ExternalHttpOptions {
  registry: CapabilityRegistry;
  authenticate(request: Request): Promise<ExternalPrincipal | null>;
  requestId?(request: Request): string;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
function errorResponse(error: unknown): Response {
  if (error instanceof ExternalInterfaceError) return json({ error: { code: error.code, message: error.expose ? error.message : "Internal server error" } }, error.status);
  return json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
}
export function createExternalHttpHandler(options: ExternalHttpOptions) {
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url), path = url.pathname;
    if (path !== "/api/capabilities" && path !== "/api/openapi.json" && !path.startsWith("/api/capabilities/")) return null;
    try {
      if (request.method !== "GET" && request.method !== "POST") throw new ExternalInterfaceError("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
      const principal = await options.authenticate(request);
      const context: ExternalCapabilityContext = { principal, transport: "http", requestId: options.requestId?.(request) ?? request.headers.get("x-request-id") ?? crypto.randomUUID() };
      if (path === "/api/capabilities" && request.method === "GET") return json({ capabilities: options.registry.list(principal).map(({ id, description, inputSchema, outputSchema, invocation, access }) => ({ id, description, inputSchema, outputSchema, invocation, access })) });
      if (path === "/api/openapi.json" && request.method === "GET") {
        const paths: Record<string, unknown> = {};
        for (const cap of options.registry.list(principal)) paths["/api/capabilities/" + encodeURIComponent(cap.id) + "/invoke"] = { post: { operationId: cap.id, description: cap.description, requestBody: { required: true, content: { "application/json": { schema: cap.inputSchema } } }, responses: { "200": { description: "Successful invocation", content: { "application/json": { schema: cap.outputSchema } } } } } };
        return json({ openapi: "3.1.0", info: { title: "Skipo Application API", version: "1.0.0" }, paths });
      }
      const match = path.match(/^\/api\/capabilities\/([^/]+)(?:\/invoke)?$/);
      if (!match) throw new ExternalInterfaceError("NOT_FOUND", "Route not found.", 404);
      const id = decodeURIComponent(match[1]);
      if (request.method === "GET" && !path.endsWith("/invoke")) {
        const cap = options.registry.list(principal).find(item => item.id === id);
        if (!cap) throw new ExternalInterfaceError("NOT_FOUND", "Capability not found.", 404);
        return json(cap);
      }
      if (request.method !== "POST" || !path.endsWith("/invoke")) throw new ExternalInterfaceError("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
      let body: unknown;
      try { body = await request.json(); } catch { throw new ExternalInterfaceError("PARSE_ERROR", "Request body must be valid JSON.", 400); }
      return json({ capabilityId: id, output: await options.registry.invoke(id, body, context) });
    } catch (error) { return errorResponse(error); }
  };
}
