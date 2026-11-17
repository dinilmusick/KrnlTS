import {describe, expect, it} from "vitest";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const forbidden = [
  /^node:/m,
  /@aws-sdk\//,
  /\bgoogleapis\b/,
  /onnxruntime-node/,
];

function localImportTargets(source: string): string[] {
  const targets = new Set<string>();
  const patterns = [
    /import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:[\w\s,{}*]+))\s+from\s+["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /export\s+(?:\*\s+from|\{[^}]*\}\s+from)\s+["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const target = match[1];
      if (target?.startsWith(".")) targets.add(target);
    }
  }
  return [...targets];
}

function resolveDistModule(from: string, specifier: string): string {
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [
    base,
    base.endsWith(".js") ? base : `${base}.js`,
    base.endsWith(".json") ? base : `${base}.json`,
    path.join(base, "index.js"),
  ];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) throw new Error(`Unable to resolve built GutTS browser import '${specifier}' from ${from}`);
  return resolved;
}

function collectBrowserClosure(entry: string): Set<string> {
  const visited = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const source = fs.readFileSync(current, "utf8");
    for (const specifier of localImportTargets(source)) {
      queue.push(resolveDistModule(current, specifier));
    }
  }
  return visited;
}

describe("GutTS browser/server dependency boundary", () => {
  it("publishes explicit browser and server surfaces", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(manifest.exports["./browser"]).toBe("./dist/browser.js");
    expect(manifest.exports["./server"]).toBe("./dist/server/index.js");
    expect(manifest.exports["./storage"]).toBe("./dist/storage/index.js");
    expect(manifest.exports["./worker"]).toBeDefined();
    expect(manifest.exports["./storage/s3"]).toBeDefined();
    expect(manifest.exports["./storage/google-drive"]).toBeDefined();
    expect(manifest.exports["." ]).toBe("./dist/index.js");
  });

  it("does not install server-only SDKs as regular browser dependencies", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    expect(manifest.dependencies).not.toHaveProperty("@aws-sdk/client-s3");
    expect(manifest.dependencies).not.toHaveProperty("googleapis");
    expect(manifest.peerDependencies).not.toHaveProperty("googleapis");
    expect(manifest.peerDependencies?.["@aws-sdk/client-s3"]).toBeDefined();
    expect(manifest.peerDependenciesMeta?.["@aws-sdk/client-s3"]?.optional).toBe(true);
    expect(manifest.pnpm?.overrides?.["onnxruntime-node"]).toBeUndefined();
  });

  it("keeps the built browser closure free of server implementations and Node runtime imports", () => {
    const entry = path.join(root, "dist", "browser.js");
    expect(fs.existsSync(entry)).toBe(true);
    const closure = collectBrowserClosure(entry);
    for (const file of closure) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source, `${file} matched ${pattern}`).not.toMatch(pattern);
      }
    }
    expect([...closure].some((file) => file.includes(`${path.sep}storage${path.sep}`))).toBe(false);
  });

  it("keeps the universal root free of optional server-only implementations", () => {
    const rootEntry = path.join(root, "dist", "index.js");
    expect(fs.existsSync(rootEntry)).toBe(true);
    const closure = collectBrowserClosure(rootEntry);
    for (const file of closure) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source, `${file} matched ${pattern}`).not.toMatch(pattern);
      }
    }
    expect([...closure].some((file) => file.includes(`${path.sep}storage${path.sep}`))).toBe(false);
    expect([...closure].some((file) => file.includes(`${path.sep}server${path.sep}`))).toBe(false);
  });

  it("keeps server storage available without exposing it from the browser root", () => {
    const browserSource = fs.readFileSync(path.join(root, "dist", "browser.js"), "utf8");
    const serverSource = fs.readFileSync(path.join(root, "dist", "server", "index.js"), "utf8");
    expect(browserSource).not.toContain("./storage/");
    expect(serverSource).not.toContain("../storage/");
    const serverStorageSource = fs.readFileSync(path.join(root, "dist", "server", "storage", "index.js"), "utf8");
    expect(serverStorageSource).toContain("../../storage/");
    expect(fs.existsSync(path.join(root, "dist", "storage", "index.js"))).toBe(true);
  });
});
