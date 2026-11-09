import {describe, expect, it} from "vitest";

describe("KrnlTS Node runtime entrypoint", () => {
  it("loads the built core entrypoint in Node and exposes Node protocol adapters", async () => {
    const core = await import("../../dist/index.js");
    expect(core.UdpProtocolAdapter).toBeTypeOf("function");
    expect(core.HttpProtocolAdapter).toBeTypeOf("function");
  });
});
