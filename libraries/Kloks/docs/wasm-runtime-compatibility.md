# Intelligent WASM Runtime Compatibility

## Evidence baseline

The Kloks runtime uses the canonical WASM-OJ Forge browser host and its pinned
Rust and Go toolchains. The application path is:

`source -> Forge compiler -> standalone WASM artifact -> Forge runner -> RuntimeResult`.

The runtime does not import `@wasm-oj/server` because the current Forge server
host requires package-owned native `wasm-oj-compiler` and
`wasm-oj-runner` executables and its server compiler/runner use child
processes. That would violate the Kloks requirement for one embedded runtime
with no native subprocess execution.

## Current matrix

| Capability | Status | Reason |
|---|---|---|
| Rust compilation | BROWSER PASS | Forge browser compiler produces standalone WASM |
| Go compilation | BROWSER PASS | Forge browser compiler produces standalone WASM |
| JavaScript | DEFERRED | Current Forge produces a QuickJS runtime bundle, not standalone WASM |
| TypeScript | DEFERRED | Current Forge transpiles to a QuickJS runtime bundle |
| Browser execution | PASS | Canonical Forge browser host |
| Node execution | BLOCKED | Current public Forge server host requires native executables/processes |
| Vercel execution | BLOCKED | Same Forge server-host constraint; no alternate runtime is permitted |
| Cloudflare Worker execution | BLOCKED | A portable embedded Forge host is not currently exposed; Cloudflare also does not expose browser Web Workers |

## Promotion rule

Node, Vercel, and Cloudflare must not be promoted to PASS until Forge exposes
a host implementation that:

1. embeds the same Forge execution substrate;
2. performs compilation from package-owned WASM toolchains;
3. performs execution without native executables or child processes;
4. works without browser-only IndexedDB/Worker assumptions;
5. preserves the same resource and result contracts.

No environment-specific replacement WASM runtime is permitted.

## Security boundary

The browser Forge host receives explicit resource limits for memory, output,
filesystem growth, instruction budget, logical time and wall time. Host
filesystem, process and network APIs are not exposed by the Kloks API.
