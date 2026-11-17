# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser | `@ultrst-armada/frnlts`, `/react`, `/runtime` | Intended browser surfaces; import and browser execution required | React integration and headless runtime are explicit exports. GutTS is consumed through its browser entry. |
| Node.js | `/runtime` | Intended for headless/SSR use; verify import-time safety | React integration may be used by SSR consumers but must not assume DOM globals at module initialization. |
| Cloudflare Workers | No dedicated Worker export | Unsupported / unverified | Do not infer Worker support from the headless runtime export. |
| Build-time tooling | `/cli`, `/validate` | Node.js tooling | These exports are not browser runtime surfaces. |
| TypeScript consumers | all package exports | Declared; clean-consumer verification required | Verify declarations for root, runtime, react, cli and validate independently. |

## Boundary rules

- Keep React-specific code behind `/react`; keep headless semantic functionality behind `/runtime`.
- Browser-compatible source must use `@dinilmusick/gutts/browser`, not the GutTS root or server entry.
- CLI and validator packages are Node build-time tools and must not be re-exported by browser runtime entry points.
- No Worker compatibility claim until Worker execution tests exist.

## Verification gates

CI must build, import the headless runtime in Node without DOM globals, mount representative React components in a real browser-compatible environment, and compile a clean TypeScript consumer for every public subpath. Node SSR support must be tested separately from browser rendering.
