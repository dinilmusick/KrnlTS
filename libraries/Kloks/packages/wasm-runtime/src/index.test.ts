import { describe, expect, it } from "vitest";
import {
  ForgeToolchainResolver,
  resolveLanguage,
  supportedLanguages,
  supportedRuntimeEnvironments,
} from "../src/index.js";

describe("WASM runtime support matrix", () => {
  it("does not advertise non-Forge-compatible hosts", () => {
    expect(supportedRuntimeEnvironments()).toEqual({
      browser: true,
      node: false,
      vercel: false,
      "cloudflare-worker": false,
    });
  });

  it("exposes Rust and Go as supported languages and does not falsely advertise JS/TS", () => {
    const langs = supportedLanguages();
    expect(langs).toEqual(["rust", "go"]);
    expect(langs).not.toContain("javascript");
    expect(langs).not.toContain("typescript");
  });
});

describe("Language resolution", () => {
  it("resolves explicit language requests", () => {
    expect(resolveLanguage({ language: "rust", source: "" })).toEqual({
      language: "rust",
      confidence: 1,
      reason: "explicit language",
    });
    expect(resolveLanguage({ language: "go", source: "" })).toEqual({
      language: "go",
      confidence: 1,
      reason: "explicit language",
    });
  });

  it("resolves by filename extension", () => {
    expect(resolveLanguage({ filename: "main.rs", source: "" })).toEqual({
      language: "rust",
      confidence: 1,
      reason: "Rust filename",
    });
    expect(resolveLanguage({ filename: "code.go", source: "" })).toEqual({
      language: "go",
      confidence: 1,
      reason: "Go filename",
    });
  });

  it("resolves by source syntax heuristics", () => {
    const rustRes = resolveLanguage({
      source: 'fn main() { println!("hello world"); }',
    });
    expect(rustRes.language).toBe("rust");
    expect(rustRes.confidence).toBeGreaterThan(0.9);

    const goRes = resolveLanguage({
      source: 'package main\nimport "fmt"\nfunc main() { fmt.Println("hello world") }',
    });
    expect(goRes.language).toBe("go");
    expect(goRes.confidence).toBeGreaterThan(0.9);
  });

  it("rejects unsupported languages and ambiguous source", () => {
    expect(() =>
      resolveLanguage({
        filename: "script.js",
        source: 'console.log("hello");',
      }),
    ).toThrow("Unable to resolve source language; provide language or filename.");
  });
});

describe("Toolchain resolution", () => {
  it("resolves Rust and Go toolchain sources with normalized baseUrl", () => {
    const resolver = new ForgeToolchainResolver();
    const rust = resolver.resolve("rust", "/toolchains/") as {
      kind: string;
      baseUrl: string;
      descriptor: { id: string; version: string; assets: unknown[] };
    };
    expect(rust.kind).toBe("browser");
    expect(rust.descriptor.id).toBe("rust");
    expect(rust.baseUrl).toBe("/toolchains/");

    const go = resolver.resolve("go", "/toolchains/") as {
      kind: string;
      baseUrl: string;
      descriptor: { id: string; version: string; assets: unknown[] };
    };
    expect(go.kind).toBe("browser");
    expect(go.descriptor.id).toBe("go");
    expect(go.baseUrl).toBe("/toolchains/");
  });
});
