import {describe, expect, it} from "vitest";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

describe("Floks browser/server dependency boundary", () => {
  it("does not declare backend implementation packages in browser package dependencies", () => {
    const rootPkg = readJson("package.json");
    const uiPkg = readJson("packages/ui/package.json");
    const canvasPkg = readJson("packages/canvas-ui/package.json");

    for (const pkg of [rootPkg, uiPkg, canvasPkg]) {
      expect(pkg.dependencies ?? {}).not.toHaveProperty("@ultrst-armada/kloks");
      expect(pkg.dependencies ?? {}).not.toHaveProperty("@ultrst-armada/krnl");
      expect(pkg.peerDependencies ?? {}).not.toHaveProperty("@ultrst-armada/kloks");
      expect(pkg.peerDependencies ?? {}).not.toHaveProperty("@ultrst-armada/krnl");
    }
    expect(rootPkg.dependencies["@dinilmusick/gutts"]).toMatch(/^\^2\./);
    expect(uiPkg.dependencies["@dinilmusick/gutts"]).toMatch(/^\^2\./);
    expect(rootPkg.dependencies["@ultrst-armada/frnlts"]).toMatch(/^\^0\.5\./);
  });

  it("keeps workspace storage as an injected Kloks boundary with no app-specific HTTP routes", () => {
    const source = fs.readFileSync(
      path.join(root, "packages/ui/src/components/workspace/WorkspaceCreateDialog.tsx"),
      "utf8",
    );
    expect(source).not.toContain("/api/auth/storage/");
    expect(source).not.toContain("/api/storage/");
    expect(source).not.toMatch(/credentials\??\s*:/);
    expect(source).toContain("Object.freeze({})");
    expect(source).toContain("storagePolicy?.providers");
    expect(source).toContain("invoker.invoke('kloks.backend.storage'");
    expect(source).toContain("Array.isArray(result)");
    expect(source).toContain(": []");
    expect(source).not.toContain("fetch(");
  });

  it("uses the Krusbl canonical ecosystem policy snapshot for Floks boundary checks", () => {
    const policy = readJson("policies/ecosystem-architecture.json");
    const levels = policy.levels ?? policy.legacy?.levels;
    const edges = policy.edges ?? policy.legacy?.edges;
    expect(levels["@ultrst-armada/floks"]).toBe(2);
    expect(edges).toContainEqual(["@ultrst-armada/floks", "@dinilmusick/gutts"]);
    expect(edges).toContainEqual(["@ultrst-armada/floks", "@ultrst-armada/frnlts"]);
    expect(edges).not.toContainEqual(["@ultrst-armada/floks", "@ultrst-armada/kloks"]);
    expect(fs.existsSync(path.join(root, "architecture-boundary.json"))).toBe(false);
  });

  it("routes Luth authentication through GutTS instead of Kloks", () => {
    const source = fs.readFileSync(path.join(root, "packages/ui/src/components/auth/LuthAuthClient.ts"), "utf8");
    expect(source).toContain("@dinilmusick/gutts/auth");
    expect(source).not.toContain("@ultrst-armada/kloks");
    expect(source).not.toContain("@ultrst-armada/krnl");
  });

  it("keeps service UI components and editor UI adapter-driven", () => {
    const serviceFiles = [
      "packages/ui/src/components/services/ClockServicePanel.tsx",
      "packages/ui/src/components/services/MidiServicePanel.tsx",
      "packages/ui/src/components/services/OscServicePanel.tsx",
    ];
    for (const file of serviceFiles) {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      expect(source).not.toContain("@ultrst-armada/kloks");
      expect(source).not.toContain("@ultrst-armada/krnl");
    }
    const editor = fs.readFileSync(path.join(root, "packages/canvas-ui/src/editor/MonacoEditor.tsx"), "utf8");
    expect(editor).not.toContain("@ultrst-armada/kloks");
    expect(editor).not.toContain("@ultrst-armada/krnl");
  });

  it("keeps the built auth surface free of backend implementation imports", () => {
    const authDir = path.join(root, "packages/ui/dist/components/auth");
    const files = fs.readdirSync(path.join(root, "packages/ui/dist"), {recursive: true})
      .filter((file) => String(file).endsWith(".js"))
      .map((file) => path.join(root, "packages/ui/dist", String(file)));
    const built = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
    expect(fs.existsSync(path.join(authDir, "index.js"))).toBe(true);
    expect(built).toContain("LuthAuthClient");
    expect(built).not.toContain("@ultrst-armada/kloks");
    expect(built).not.toContain("@ultrst-armada/krnl");
    expect(built).not.toMatch(/node:/);
    expect(built).not.toMatch(/@aws-sdk\//);
    expect(built).not.toContain("googleapis");
  });
});
