import test from "node:test";
import assert from "node:assert/strict";
import { GraphEngine } from "./engine/index.js";
import type { GraphJSON, VerifiedLuthPrincipal } from "./engine/index.js";
import { SDKPortType } from "./engine/sdk/types/index.js";

const principal: VerifiedLuthPrincipal = { verified: true, userId: "user-1", workspaceId: "workspace-1" };
const graph = (nodes: GraphJSON["nodes"], edges: GraphJSON["edges"] = []): GraphJSON => ({
  nodes, edges, variables: {}, metadata: { id: "graph-1", name: "test", description: "", version: "1" }, settings: { executionDelayMs: 0 }
} as GraphJSON);
const node = (id: string, type: string, data: Record<string, unknown> = {}) => ({
  id, type, position: { x: 0, y: 0 }, data
});

test("executes native graph nodes and routes connected data", async () => {
  const result = await new GraphEngine().execute(graph(
    [node("sum", "math/add", { addend: 4 }), node("power", "math/power", { b: 3 })],
    [{ id: "edge-1", source: "sum", sourceHandle: "result", target: "power", targetHandle: "a" }]
  ), { workspaceId: "workspace-1", principal, executionId: "execution-dataflow" });
  assert.equal(result.success, true);
  assert.equal(result.outputs.sum.result, 4);
  assert.equal(result.outputs.power.result, 64);
});

test("isolates registries between engine instances", () => {
  const first = new GraphEngine();
  const second = new GraphEngine();
  first.registry.register({
    metadata: { type: "test/only-first", category: "custom", displayName: "First only", description: "" },
    inputs: {}, outputs: {}, async execute() { return { result: true }; }
  }, true);
  assert.ok(first.getNodeDefinitions().some(item => item.metadata.type === "test/only-first"));
  assert.ok(!second.getNodeDefinitions().some(item => item.metadata.type === "test/only-first"));
});

test("registers and executes SDK nodes through the engine-owned registry", async () => {
  const engine = new GraphEngine();
  engine.sdk.registerNode({
    id: "sdk-node",
    category: "custom",
    version: "1.0.0",
    metadata: { name: "sdk/test", displayName: "SDK Test", category: "custom", version: "1.0.0", description: "SDK registration test" },
    inputs: { value: { name: "Value", type: "number", portType: SDKPortType.Data, required: true } },
    outputs: { result: { name: "Result", type: "number", portType: SDKPortType.Data, required: true } },
    async execute(context) { return { success: true, outputs: { result: context.getVariable("value") } }; }
  });
  assert.equal(engine.registry.getDefinition("sdk/test")?.metadata.nativeExecution, true);
  const result = await engine.execute(graph([node("sdk", "sdk/test", { value: 7 })]), {
    workspaceId: "workspace-1", principal
  });
  assert.equal(result.success, true);
  assert.equal(result.outputs.sdk.result, 7);
});

test("rejects a principal from a different workspace", async () => {
  await assert.rejects(() => new GraphEngine().execute(graph([]), {
    workspaceId: "workspace-2", principal
  }), /does not belong/);
});

test("propagates verified principal and cancellation signal through the runtime adapter", async () => {
  const controller = new AbortController();
  let received: any;
  let cleanupCalls = 0;
  const result = await new GraphEngine().execute(graph([node("spawn", "runtime/spawn", {
    providerId: "mock", accountId: "account-1", configuration: {}, persistence: "transient"
  })]), {
    workspaceId: "workspace-1", principal, signal: controller.signal,
    services: { runtime: {
      async execute(type, inputs, runtimeContext) {
        received = { type, inputs, runtimeContext };
        return { runtime: { id: "runtime-1", workspaceId: runtimeContext.workspaceId } };
      },
      async cleanupExecution(runtimeContext) {
        cleanupCalls += 1;
        assert.equal(runtimeContext.workspaceId, "workspace-1");
        assert.equal(runtimeContext.executionId, received.runtimeContext.executionId);
        assert.equal(runtimeContext.principal.id, "user-1");
        assert.equal(runtimeContext.auth.provider, "luth");
        assert.equal(runtimeContext.auth.verified, true);
        return [];
      }
    } }
  });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(received.type, "runtime/spawn");
  assert.equal(received.runtimeContext.executionId, result.executionId);
  assert.equal(received.runtimeContext.signal.aborted, false);
  assert.equal("token" in principal, false);
  assert.equal(cleanupCalls, 1);
});

test("does not evaluate graph-authored JavaScript inside the Aiko process", async () => {
  const result = await new GraphEngine().execute(graph([node("custom", "custom/js-block", {
    code: "return { result: process.env }"
  })]), { workspaceId: "workspace-1", principal });
  assert.equal(result.success, false);
  assert.match(result.errors.custom, /isolated Aiko code execution service/);
});

test("delegates custom JavaScript to the injected isolated execution service", async () => {
  let invoked = false;
  const result = await new GraphEngine().execute(graph([node("custom", "custom/js-block", {
    code: "return { result: 42 }"
  })]), {
    workspaceId: "workspace-1", principal,
    services: { customCode: {
      async execute(input, verifiedPrincipal, signal) {
        invoked = true;
        assert.equal(input.code, "return { result: 42 }");
        assert.equal(input.workspaceId, "workspace-1");
        assert.equal(verifiedPrincipal.userId, "user-1");
        assert.equal(signal.aborted, false);
        return { result: 42 };
      }
    } }
  });
  assert.equal(invoked, true);
  assert.equal(result.success, true);
  assert.equal(result.outputs.custom.result, 42);
});

test("reports node failures without claiming success", async () => {
  const result = await new GraphEngine().execute(graph([node("missing", "unknown/node")]), {
    workspaceId: "workspace-1", principal
  });
  assert.equal(result.success, false);
  assert.match(result.errors.missing, /not registered/);
});

test("honors cancellation for an active execution", async () => {
  const controller = new AbortController();
  const pending = new GraphEngine().execute(graph([node("delay", "utilities/delay", { milliseconds: 30 })]), {
    workspaceId: "workspace-1", principal, executionId: "execution-cancel", signal: controller.signal
  });
  setTimeout(() => controller.abort(), 5);
  const result = await pending;
  assert.equal(result.cancelled, true);
  assert.equal(result.success, false);
});


test("registers canonical provider runtime nodes and forwards Luth execution context", async () => {
  const engine = new GraphEngine();
  const providerTypes = ["runtime/google-cloud-shell", "runtime/fly-io", "runtime/github-codespaces"];
  for (const type of providerTypes) {
    const definition = engine.getNodeDefinitions().find(item => item.metadata.type === type);
    assert.ok(definition, type + " should be registered in the canonical graph engine");
    assert.equal(definition.metadata.requiresProviderRegistration, true);
  }
  const controller = new AbortController();
  let received: any;
  let cleanupContext: any;
  const runtimeHandle = { id: "fly-runtime-1", workspaceId: "workspace-1", providerId: "fly-io" };
  const result = await engine.execute(graph([node("fly", "runtime/fly-io", {
    accountId: "account-1", configuration: { region: "test" },
    command: "echo provider-node", persistence: "transient"
  })]), {
    workspaceId: "workspace-1", principal, signal: controller.signal,
    executionId: "execution-provider-node",
    services: { runtime: {
      async execute(type, inputs, runtimeContext) {
        received = { type, inputs, runtimeContext };
        assert.equal(type, "runtime/fly-io");
        assert.equal(inputs.command, "echo provider-node");
        assert.equal(runtimeContext.workspaceId, "workspace-1");
        assert.equal(runtimeContext.executionId, "execution-provider-node");
        assert.equal(runtimeContext.principal.id, "user-1");
        assert.equal(runtimeContext.auth.provider, "luth");
        assert.equal(runtimeContext.signal.aborted, false);
        return { runtime: runtimeHandle, stdout: "provider-node-ok", stderr: "", exitStatus: 0 };
      },
      async cleanupExecution(runtimeContext) { cleanupContext = runtimeContext; return []; }
    } }
  });
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.equal(result.outputs.fly.stdout, "provider-node-ok");
  assert.equal(received.type, "runtime/fly-io");
  assert.equal(cleanupContext.executionId, "execution-provider-node");
});

test("provider-specific runtime nodes surface missing real provider adapters", async () => {
  let adapterCalls = 0;
  const result = await new GraphEngine().execute(graph([node("cloud", "runtime/google-cloud-shell", {
    accountId: "account-1", command: "echo must-not-run"
  })]), {
    workspaceId: "workspace-1",
    principal,
    services: { runtime: {
      async execute(type) {
        assert.equal(type, "runtime/google-cloud-shell");
        adapterCalls += 1;
        return { error: { message: "Runtime provider unavailable: google-cloud-shell" } };
      },
      async cleanupExecution() { return []; }
    } }
  });
  assert.equal(result.success, false);
  assert.match(result.errors.cloud, /Runtime provider unavailable: google-cloud-shell/);
  assert.equal(adapterCalls, 1);
});
