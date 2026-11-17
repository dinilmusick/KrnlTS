# Runtime compatibility contract

| Environment | Supported surface | Status | Boundary |
|---|---|---|---|
| Browser | `/ui`, `/canvas-ui`, `/ai`, `/auth` and named UI subpaths | Supported | React, XYFlow, D3, Monaco, drag/drop and CSS belong to browser-facing exports. |
| Node.js / Vercel / Google Cloud Run | `/contracts` and `/universal` | Supported for contract/schema/graph utilities | These entrypoints must execute and bundle without installing or importing browser peers. |
| Cloudflare Workers | `/contracts` and `/universal` | Supported for contract/schema/graph utilities | The universal dependency closure must remain free of Node builtins, DOM renderers and CSS. |
| Node.js SSR | `/contracts` and `/universal` | Supported | The aggregate root and UI exports are browser-facing and are not server-safe entrypoints. |
| TypeScript consumers | Every declared export | Supported when the corresponding entrypoint is used | Export targets and declarations must exist in the packed npm artifact. |

## Import boundaries

- Use `@ultrst-armada/floks/contracts` or `@ultrst-armada/floks/universal` from server routes, Vercel functions, Cloud Run services, Cloudflare Workers and other non-browser code.
- The root export (`@ultrst-armada/floks`) remains an aggregate browser-facing API. It re-exports UI and canvas components and must not be imported by server-only modules.
- Use `@ultrst-armada/floks/ui` and `@ultrst-armada/floks/canvas-ui` only from browser-facing application code.
- Browser runtime dependencies are optional peer dependencies at the aggregate package boundary. Browser applications must provide the peers they use (React, React DOM, Lucide, XYFlow, D3 Force and Zustand). The canonical GutTS and FrnlTS runtime dependencies remain declared as required ecosystem edges; they are not bundled into the `/contracts` or `/universal` entrypoint dependency closure.
- CSS exports are assets, not JavaScript entrypoints. Import them explicitly from browser application stylesheets.
- UI package import-time initialization must not access `window`, `document`, `navigator` or `localStorage` before a component is mounted.
- Floks UI packages must not acquire Kloks/Krnl backend implementation dependencies.

## Verification gates

CI builds and tests the monorepo, then packs the actual npm artifact into an isolated consumer. The server consumer test installs the tarball without optional browser peers, imports both universal entrypoints in Node, bundles the universal graph with Node and Worker conditions, checks that browser peers remain absent, and validates published CSS export targets. The browser consumer test separately verifies browser and neutral builds for the UI, canvas and contracts surfaces.
