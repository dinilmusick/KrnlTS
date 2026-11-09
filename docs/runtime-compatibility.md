# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser | No browser-specific export | Unsupported | Core protocols include Node `dgram` and `http` adapters; the root entry re-exports protocol modules. |
| Node.js | `@ultrst-armada/krnl` | Intended primary runtime | Core protocol adapters use Node networking APIs. Import and representative service/protocol execution must remain covered by Node CI. |
| Cloudflare Workers | No Worker-specific export | Unsupported / unverified | Node networking adapters are not Worker-compatible. A future Worker surface must exclude them transitively. |
| Build-time tooling | `@ultrst-armada/krnl/cli`, validation package | Node.js tooling | CLI and validation tooling are separate from the service runtime contract. |
| TypeScript consumers | root, `/validate`, `/cli` | Declared; consumer verification required | Compile imports from each supported public export in a clean consumer. |

## Boundary findings

The core package's `src/index.ts` re-exports `./protocols/index.js`. The UDP adapter imports Node `dgram`; the HTTP adapter imports Node `http`. Consequently, the root export must be treated as Node-targeted. Do not describe the current root as browser or Cloudflare Worker compatible.

Preserve the existing root API for compatibility. If a browser or Worker surface is introduced, make it a separate explicit entry with a transitive dependency closure that excludes Node protocol adapters. Do not solve this by relying on tree-shaking of an unsafe root entry.

## Verification gates

Node CI must import the built public root and execute representative service behavior. Any future browser/Worker entry must be imported in its actual target runtime, not merely typechecked. CLI/build-time tools are Node-only and must not leak into runtime entry points.
