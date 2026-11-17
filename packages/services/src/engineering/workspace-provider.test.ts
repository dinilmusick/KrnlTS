import {describe, expect, it} from "vitest";
import {LocalWorkspaceProvider} from "./workspace-provider.js";

describe("LocalWorkspaceProvider", () => {
  it("creates and destroys isolated workspaces", async () => {
    const provider = new LocalWorkspaceProvider();
    const workspace = await provider.create("krusbl-test-");
    expect(provider.get(workspace.id).root).toBe(workspace.root);
    await provider.destroy(workspace.id);
    expect(() => provider.get(workspace.id)).toThrow("Unknown workspace");
  });
});
