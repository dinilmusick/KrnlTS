import {describe, expect, it} from "vitest";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("FrnlTS browser dependency boundary", () => {
  it("uses the explicit browser-safe GutTS entrypoint", () => {
    const source = fs.readFileSync(path.join(root, "src", "index.ts"), "utf8");
    expect(source).toContain("@dinilmusick/gutts/browser");
    expect(source).not.toMatch(/@dinilmusick\/gutts['"]/);
  });

  it("declares GutTS 2.x, which contains the explicit browser/server split", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(manifest.dependencies?.["@dinilmusick/gutts"]).toBe("^2.0.2");
  });

  it("keeps the built public root free of server-only dependency references", () => {
    const built = fs.readFileSync(path.join(root, "dist", "index.js"), "utf8");
    expect(built).toContain("@dinilmusick/gutts/browser");
    expect(built).not.toContain("@dinilmusick/gutts/storage");
    expect(built).not.toMatch(/@aws-sdk\//);
    expect(built).not.toContain("googleapis");
    expect(built).not.toMatch(/node:/);
    expect(built).not.toContain("onnxruntime-node");
    expect(built).not.toContain("@ultrst-armada/kloks");
    expect(built).not.toContain("@ultrst-armada/krnl");
  });
});
