import {describe, expect, it} from "vitest";

describe("GutTS runtime entrypoints", () => {
  it("imports the explicit browser surface in Node without DOM globals", async () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(typeof globalThis.document).toBe("undefined");
    const browser = await import("../dist/browser.js");
    expect(browser).toBeDefined();
  });
});
