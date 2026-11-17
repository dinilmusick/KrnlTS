import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";

describe("Skipo generated runtime declarations", () => {
  it("marks generated Wrangler scaffolds as standalone Fetch Worker targets without Node compatibility", () => {
    for (const path of [
      "scaffolds/nextjs/wrangler.toml",
      "scaffolds/vite/wrangler.toml",
    ]) {
      const config = readFileSync(path, "utf8");
      expect(config).toContain('main = "dist/providers/cloudflare/worker.js"');
      expect(config).not.toContain('"nodejs_compat"');
    }
  });
});
