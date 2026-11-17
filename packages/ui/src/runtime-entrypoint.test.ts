import {describe, expect, it} from "vitest";

describe("Floks UI entrypoint", () => {
  it("loads the built UI module without requiring a mounted DOM", async () => {
    const ui = await import("../dist/index.js");
    expect(ui).toBeDefined();
    expect(ui.frnlButton).toBeTypeOf("function");
  });
});
