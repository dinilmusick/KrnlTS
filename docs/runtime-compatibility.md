# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser / Web Workers | `@ultrst-armada/krnl` default export | Runtime-neutral kernel contract | The emitted default import closure is checked for Node built-ins and Node-only adapters. Platform I/O is supplied by explicit adapters. |
| Node.js | `@ultrst-armada/krnl/node` | Supported adapters | Exposes HTTP, WebSocket and UDP transports plus filesystem-based package reconciliation. |
| Node.js | `@ultrst-armada/krnl` default export | Supported | Service execution, in-memory transport, P2P adapter, contracts, lifecycle and telemetry do not statically load Node transports. |
| Cloudflare Workers | `@ultrst-armada/krnl` default export | Portable closure; runtime validation required | The kernel entrypoint excludes Node networking and filesystem adapters. Platform integration still depends on available Web APIs and the consuming service's dependencies. |
| Build-time tooling | `@ultrst-armada/krnl/cli`, `@ultrst-armada/krnl/validate` | Node.js tooling | CLI and validation tooling remain explicit Node-only surfaces. |
| TypeScript consumers | root, `/node`, `/validate`, `/cli` | Declared; consumer verification required | Each supported public export resolves to built JavaScript and declarations. |

## Boundary contract

The default core entrypoint must not statically or transitively import Node built-ins or Node-only transport/tooling packages. HTTP, WebSocket and UDP server adapters, and filesystem-based package reconciliation are exported only from the explicit `/node` entrypoint. The CLI remains a separate Node-only package surface and imports Node tooling through `@ultrst-armada/krnl-core/node`.

The default entrypoint retains the runtime-neutral service, functionality, orchestration, registry, state, event, lifecycle, in-memory transport, P2P, telemetry, execution and contract APIs. The Node entrypoint re-exports the default API as well as Node adapters.

## Verification gates

CI builds both core entrypoints, traverses the emitted default entrypoint's transitive ESM import closure, and rejects Node built-ins and known Node-only packages. Public export tests import both the default and Node entrypoints. Existing CLI integration tests remain the regression gate for command behavior, arguments, exit status and output.
