import {describe, expect, it} from "vitest";

describe("KrnlTS runtime entrypoints", () => {
  it("keeps Node transports and filesystem tooling out of the default kernel entrypoint", async () => {
    const core = await import("../../dist/index.js");
    expect(core.P2PProtocolAdapter).toBeTypeOf("function");
    expect(core.FetchProtocolAdapter).toBeTypeOf("function");
    expect("UdpProtocolAdapter" in core).toBe(false);
    expect("HttpProtocolAdapter" in core).toBe(false);
    expect("WebSocketProtocolAdapter" in core).toBe(false);
    expect("KrnlPackageReconciler" in core).toBe(false);
  });

  it("exposes the Fetch-native entrypoint without Node adapters", async () => {
    const fetch = await import("../../dist/fetch.js");
    expect(fetch.FetchProtocolAdapter).toBeTypeOf("function");
    expect("HttpProtocolAdapter" in fetch).toBe(false);
    expect("UdpProtocolAdapter" in fetch).toBe(false);
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
