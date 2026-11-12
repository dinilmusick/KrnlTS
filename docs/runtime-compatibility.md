# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser / Web Workers | `@ultrst-armada/krnl` default export or `/fetch` | Runtime-neutral kernel and Fetch handler | The emitted default and Fetch import closures are checked for Node built-ins and Node-only adapters. |
| Node.js | `@ultrst-armada/krnl/node` | Supported adapters | Exposes HTTP, WebSocket and UDP transports plus filesystem-based package reconciliation. |
| Node.js | `@ultrst-armada/krnl` default export | Supported | Service execution, in-memory transport, P2P adapter, contracts, lifecycle and telemetry do not statically load Node transports. |
| Cloudflare Workers | `@ultrst-armada/krnl/fetch` | Fetch-native handler | Standard `Request` to `Response` handler; the Worker owns dispatch and lifecycle. |
| Vercel / Google AI Studio / Cloud Run | `@ultrst-armada/krnl/fetch` | Fetch-native handler contract | Use the platform's Request/Response entrypoint and delegate to `FetchProtocolAdapter`; the platform owns listening and request lifecycle. |
| Build-time tooling | `@ultrst-armada/krnl/cli`, `@ultrst-armada/krnl/validate` | Node.js tooling | CLI and validation tooling remain explicit Node-only surfaces. |
| TypeScript consumers | root, `/fetch`, `/node`, `/validate`, `/cli` | Declared; consumer verification required | Each supported public export resolves to built JavaScript and declarations. |

## Boundary contract

The default core entrypoint must not statically or transitively import Node built-ins or Node-only transport/tooling packages. HTTP, WebSocket and UDP server adapters, and filesystem-based package reconciliation are exported only from the explicit `/node` entrypoint. The CLI remains a separate Node-only package surface and imports Node tooling through `@ultrst-armada/krnl-core/node`.

The default entrypoint retains the runtime-neutral service, functionality, orchestration, registry, state, event, lifecycle, in-memory transport, P2P, telemetry, execution and contract APIs. The Node entrypoint re-exports the default API as well as Node adapters.

## Verification gates

CI builds the default, Fetch and Node core entrypoints, traverses both portable ESM import closures, and rejects Node built-ins and known Node-only packages. The package-artifact test imports the root and Fetch entrypoints from a local npm tarball before optional Node peers are installed, then verifies the remaining Node-only exports after installing those peers. Existing CLI integration tests remain the regression gate for command behavior, arguments, exit status and output.


## Fetch handler integration

The portable handler is intentionally a request adapter, not a server. It does not open a TCP listener; the host platform supplies the request and owns the process lifecycle. Import `FetchProtocolAdapter` from `@ultrst-armada/krnl/fetch`, create it with an optional `basePath`, and return `adapter.createHandler(service)(request)` from the platform's Fetch entrypoint. The same Request-to-Response contract can be called from a Vercel route handler or a Cloud Run HTTP server. Node socket listeners, UDP, and the Node WebSocket server remain isolated behind `@ultrst-armada/krnl/node`.


## Optional Node-only peers

The root package keeps its universal production dependency closure small. `esbuild`, `ts-morph`, `ws` and `@types/node` are optional peers for the legacy `/cli`, `/validate` and `/node` surfaces; they are not installed for consumers that use only the root or `/fetch` entrypoints. Prefer the dedicated CLI and validation packages when those tools are needed. The core package also declares `ws` and `@types/node` as optional peers for Node-specific adapters and declarations.

## Fetch handler example

```ts
import { FetchProtocolAdapter } from '@ultrst-armada/krnl/fetch';

const handler = new FetchProtocolAdapter({ basePath: '/api/krnl' }).createHandler(service);
export default { fetch: handler };
```
