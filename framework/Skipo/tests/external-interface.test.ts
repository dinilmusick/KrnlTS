import { describe, it, expect, vi } from "vitest";
import { CapabilityRegistry } from "../src/backend/external/registry.js";
import { createExternalHttpHandler } from "../src/backend/external/httpAdapter.js";
import { createMcpHandler } from "../src/backend/external/mcpAdapter.js";
import type { ExternalPrincipal } from "../src/backend/external/contract.js";
const inputSchema = { type: "object" as const, properties: { value: { type: "number" as const } }, required: ["value"], additionalProperties: false };
const outputSchema = { type: "object" as const, properties: { doubled: { type: "number" as const } }, required: ["doubled"], additionalProperties: false };
function setup(principal: ExternalPrincipal | null = { userId: "u1", roles: ["reader"] }) {
  const execute = vi.fn(async (_service: string, _operation: string, input: any) => ({ doubled: input.value * 2 }));
  const registry = new CapabilityRegistry({ execute }).register({ id: "math.double", description: "Double a number.", inputSchema, outputSchema, invocation: { serviceId: "math", operationId: "double" }, access: "authenticated" });
  const authenticate = vi.fn(async () => principal);
  return { execute, registry, authenticate, http: createExternalHttpHandler({ registry, authenticate }), mcp: createMcpHandler({ registry, authenticate }) };
}
describe("Skipo external interfaces", () => {
  it("discovers the canonical schema over HTTP and MCP", async () => {
    const s = setup();
    const http = await s.http(new Request("https://app.test/api/capabilities"));
    const mcp = await s.mcp(new Request("https://app.test/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) }));
    expect((await http!.json()).capabilities[0].inputSchema).toEqual(inputSchema);
    expect((await mcp!.json()).result.tools[0].outputSchema).toEqual(outputSchema);
  });
  it("invokes the same canonical mapping through HTTP and MCP", async () => {
    const s = setup();
    const http = await s.http(new Request("https://app.test/api/capabilities/math.double/invoke", { method: "POST", body: JSON.stringify({ value: 3 }) }));
    expect((await http!.json()).output).toEqual({ doubled: 6 });
    const mcp = await s.mcp(new Request("https://app.test/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "math.double", arguments: { value: 4 } } }) }));
    expect((await mcp!.json()).result.structuredContent).toEqual({ doubled: 8 });
    expect(s.execute).toHaveBeenNthCalledWith(1, "math", "double", { value: 3 }, expect.objectContaining({ transport: "http" }));
    expect(s.execute).toHaveBeenNthCalledWith(2, "math", "double", { value: 4 }, expect.objectContaining({ transport: "mcp" }));
  });
  it("enforces authentication and role boundaries before execution", async () => {
    const s = setup(null);
    const denied = await s.http(new Request("https://app.test/api/capabilities/math.double/invoke", { method: "POST", body: JSON.stringify({ value: 1 }) }));
    expect(denied!.status).toBe(401);
    expect(s.execute).not.toHaveBeenCalled();
    s.registry.register({ id: "admin.only", description: "Admin only.", inputSchema, outputSchema, invocation: { serviceId: "admin", operationId: "run" }, access: "roles", requiredRoles: ["admin"] });
    expect(s.registry.list({ userId: "reader", roles: ["reader"] }).map(cap => cap.id)).toEqual(["math.double"]);
  });
  it("rejects invalid input and output schemas", async () => {
    const s = setup();
    const bad = await s.http(new Request("https://app.test/api/capabilities/math.double/invoke", { method: "POST", body: JSON.stringify({ value: "bad" }) }));
    expect(bad!.status).toBe(400);
    const broken = new CapabilityRegistry({ execute: async () => ({ secret: "hidden" }) }).register({ id: "bad.output", description: "Invalid output.", inputSchema, outputSchema, invocation: { serviceId: "x", operationId: "y" }, access: "public" });
    await expect(broken.invoke("bad.output", { value: 1 }, { principal: null, transport: "http", requestId: "test" })).rejects.toMatchObject({ code: "INVALID_OUTPUT", expose: false });
  });
  it("normalizes errors and hides internal exception messages", async () => {
    const registry = new CapabilityRegistry({ execute: async () => { throw new Error("secret database detail"); } }).register({ id: "throws", description: "Throws.", inputSchema, outputSchema, invocation: { serviceId: "x", operationId: "y" }, access: "public" });
    const http = createExternalHttpHandler({ registry, authenticate: async () => null });
    const result = await http(new Request("https://app.test/api/capabilities/throws/invoke", { method: "POST", body: JSON.stringify({ value: 1 }) }));
    expect(await result!.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    const mcp = createMcpHandler({ registry, authenticate: async () => null });
    const malformed = await mcp(new Request("https://app.test/mcp", { method: "POST", body: "{" }));
    expect((await malformed!.json()).error.code).toBe(-32700);
  });
  it("does not handle unrelated routes", async () => {
    const s = setup();
    expect(await s.http(new Request("https://app.test/health"))).toBeNull();
    expect(await s.mcp(new Request("https://app.test/other", { method: "POST", body: "{}" }))).toBeNull();
  });
});

import { createBackendCapabilityExecutor } from "../src/backend/external/backendExecutor.js";
it("bridges external calls through the canonical BackendFacade executor", async () => {
  const executeCapability = vi.fn(async () => ({ doubled: 10 }));
  const executor = createBackendCapabilityExecutor({ executeCapability });
  await executor.execute("math", "double", { value: 5 }, { principal: { userId: "u1" }, transport: "mcp", requestId: "req-1" });
  expect(executeCapability).toHaveBeenCalledWith("math", "double", { value: 5 }, {
    serviceId: "math",
    correlationId: "req-1",
    metadata: { externalInterface: true, transport: "mcp", principal: { kind: "authenticated", userId: "u1", roles: [], sessionId: undefined } },
  });
});

it("supports MCP initialized notifications and structured tool errors", async () => {
  const s = setup();
  const notification = await s.mcp(new Request("https://app.test/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) }));
  expect(notification!.status).toBe(202);
  const failedRegistry = new CapabilityRegistry({ execute: async () => { throw new Error("private detail"); } }).register({ id: "fails", description: "Fails.", inputSchema, outputSchema, invocation: { serviceId: "x", operationId: "y" }, access: "public" });
  const failedMcp = createMcpHandler({ registry: failedRegistry, authenticate: async () => null });
  const result = await failedMcp(new Request("https://app.test/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "fails", arguments: { value: 1 } } }) }));
  expect((await result!.json()).result.structuredContent).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
});

it("serves authorized capability details and OpenAPI discovery", async () => {
  const s = setup();
  const detail = await s.http(new Request("https://app.test/api/capabilities/math.double"));
  expect((await detail!.json()).invocation).toEqual({ serviceId: "math", operationId: "double" });
  const openapi = await s.http(new Request("https://app.test/api/openapi.json"));
  expect((await openapi!.json()).paths["/api/capabilities/math.double/invoke"].post.requestBody.content["application/json"].schema).toEqual(inputSchema);
});
it("does not disclose or invoke explicitly hidden capabilities", async () => {
  const s = setup();
  s.registry.register({ id: "internal.only", description: "Hidden.", inputSchema, outputSchema, invocation: { serviceId: "internal", operationId: "run" }, access: "public", discoverable: false });
  expect(s.registry.list({ userId: "u1" }).map(cap => cap.id)).toEqual(["math.double"]);
  await expect(s.registry.invoke("internal.only", { value: 1 }, { principal: { userId: "u1" }, transport: "mcp", requestId: "hidden" })).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("rejects callers without the required capability role", async () => {
  const registry = new CapabilityRegistry({ execute: vi.fn(async () => ({ doubled: 2 })) }).register({ id: "admin.run", description: "Admin operation.", inputSchema, outputSchema, invocation: { serviceId: "admin", operationId: "run" }, access: "roles", requiredRoles: ["admin"] });
  await expect(registry.invoke("admin.run", { value: 1 }, { principal: { userId: "reader", roles: ["reader"] }, transport: "http", requestId: "forbidden" })).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
});
it("initializes the MCP protocol with advertised tool support", async () => {
  const s = setup();
  const initialized = await s.mcp(new Request("https://app.test/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 9, method: "initialize", params: { protocolVersion: "2025-03-26" } }) }));
  expect((await initialized!.json()).result.capabilities.tools).toEqual({ listChanged: false });
});

it("applies the same authenticated capability boundary to HTTP and MCP", async () => {
  const s = setup(null);
  const httpList = await s.http(new Request("https://app.test/api/capabilities"));
  const mcpList = await s.mcp(new Request("https://app.test/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  }));
  expect((await httpList!.json()).capabilities).toEqual([]);
  expect((await mcpList!.json()).result.tools).toEqual([]);

  const httpCall = await s.http(new Request("https://app.test/api/capabilities/math.double/invoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: 2 }),
  }));
  const mcpCall = await s.mcp(new Request("https://app.test/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "math.double", arguments: { value: 2 } } }),
  }));
  expect(httpCall!.status).toBe(401);
  expect((await mcpCall!.json()).result.isError).toBe(true);
  expect(s.execute).not.toHaveBeenCalled();
});
