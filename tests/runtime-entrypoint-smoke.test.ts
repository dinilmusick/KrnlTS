import {describe, expect, it} from "vitest";
import {execFileSync} from "node:child_process";
import path from "node:path";

describe("FrnlTS headless runtime entrypoint", () => {
  it("imports the built headless runtime in a clean Node process without DOM globals", () => {
    const entry = path.resolve("dist/runtime/index.js");
    const probe = `if (typeof window !== "undefined" || typeof document !== "undefined") process.exit(2); await import(${JSON.stringify(entry)});`;
    expect(() => execFileSync(process.execPath, ["--input-type=module", "--eval", probe], {stdio: "pipe"})).not.toThrow();
  });
});
