import {describe, expect, it} from "vitest";

describe("Kloks state-graph Node entrypoint", () => {
  it("loads the built state-graph entrypoint in Node", async () => {
    const stateGraph = await import("../dist/index.js");
    expect(stateGraph).toBeDefined();
    expect(stateGraph.StateLifecycleServiceDefinition).toBeDefined();
  });
});
