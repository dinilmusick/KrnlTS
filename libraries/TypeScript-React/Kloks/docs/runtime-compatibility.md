# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser | `/client`, selected UI-independent state surfaces | Partial / unverified | Audit each subpath's full import closure. The root package and backend exports are not browser surfaces. |
| Node.js | `/`, `/backend`, `/services`, `/audio-midi`, `/osc/node` | Intended, subpath-specific | Optional database/storage providers must remain lazy; Node-only networking belongs behind explicit Node exports. |
| Cloudflare Workers | Fetch/Web Crypto-based storage implementations | Candidate, not yet certified | PR #45 is a candidate implementation; its mocked Fetch tests do not prove Workers-runtime execution. |
| Build-time tooling | `/development`, `/browser-inspection`, CLI/build scripts | Node or browser-host tooling by subpath | Playwright and WebContainer host integrations must not leak into general runtime imports. |
| TypeScript consumers | package root and declared subpaths | Declared; export/declaration alignment needs clean-consumer tests | Every public subpath must resolve to its matching declaration and runtime file. |

## Outstanding state-graph work

PR #44 and PR #46 both address a browser-safe state-graph surface. PR #45 addresses Fetch-native Google Drive storage. Keep all three unmerged while reconciling their changes. PR #46's observed CI run failed during build, typecheck and tests; inspect the uploaded diagnostics artifact before accepting its export/build changes.

## Boundary rules

- Do not treat the root package as browser-safe.
- Optional providers must be loaded only when selected; importing unrelated backend functionality must not require every provider SDK.
- CSS and DOM-dependent modules must not enter pure Node entry points.
- Worker support requires a Worker-compatible transitive graph and a Workers-runtime integration test, not only mocked Fetch tests.
