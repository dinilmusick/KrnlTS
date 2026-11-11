import {describe, expect, it} from "vitest";

describe("KrnlTS runtime entrypoints", () => {
  it("keeps Node transports and filesystem tooling out of the default kernel entrypoint", async () => {
    const core = await import("../../dist/index.js");
    expect(core.P2PProtocolAdapter).toBeTypeOf("function");
    expect(core.UdpProtocolAdapter).toBeUndefined();
    expect(core.HttpProtocolAdapter).toBeUndefined();
    expect(core.WebSocketProtocolAdapter).toBeUndefined();
    expect(core.KrnlPackageReconciler).toBeUndefined();
  });

  it("exposes Node transports and filesystem tooling through the explicit Node entrypoint", async () => {
    const node = await import("../../dist/node.js");
    expect(node.UdpProtocolAdapter).toBeTypeOf("function");
    expect(node.HttpProtocolAdapter).toBeTypeOf("function");
    expect(node.WebSocketProtocolAdapter).toBeTypeOf("function");
    expect(node.KrnlPackageReconciler).toBeTypeOf("function");
    expect(node.gutts).toBeTypeOf("object");
  });
});
