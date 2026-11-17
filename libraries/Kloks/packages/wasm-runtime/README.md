# @kloks/wasm-runtime

Intelligent polyglot WASM runtime service for Kloks.

## Current Forge integration boundary

The package uses the canonical WASM-OJ Forge browser engine and pinned Rust/Go
toolchains. The execution path is:

`source -> Forge compiler -> WASM artifact -> Forge runner -> RuntimeResult`.

The implementation deliberately does **not** fall back to `@wasm-oj/server`,
native executables, `child_process`, Docker, or another WASM runtime.

The current Forge release exposes:

- browser execution through `@wasm-oj/browser`;
- Node/server execution through `@wasm-oj/server`, which uses native
  `wasm-oj-compiler` / `wasm-oj-runner` processes.

Therefore Node/Vercel/Cloudflare support is not advertised by this package yet.
Adding a second runtime would violate the Kloks architecture. A future Forge
embedded host must expose the same Forge compiler/runner implementation without
native processes before those environments can be promoted to PASS.

## Language boundary

Rust and Go are enabled because Forge currently produces standalone WASM
artifacts for them.

JavaScript/TypeScript are intentionally not enabled because the current Forge
path produces QuickJS runtime bundles rather than a standalone WASM artifact;
claiming them as source -> WASM support would violate the runtime contract.

## Browser deployment

The application must publish the Forge browser and toolchain assets and serve
them from the configured `toolchainBaseUrl`. Forge's browser host also requires
its documented worker/cross-origin-isolation deployment requirements.
