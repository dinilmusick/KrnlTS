# Runtime compatibility contract

| Environment | Surface | Status | Evidence / limitation |
|---|---|---|---|
| Browser | generated Vite/Next.js frontend | Scaffold-dependent | Validate the generated application bundle and browser execution; the Skipo builder itself is not browser code. |
| Node.js | Skipo application builder and backend tooling | Intended primary build-time environment | Python helper scripts are also part of the toolchain and must be identified explicitly. |
| Cloudflare Workers | generated API/runtime target in Wrangler scaffolds | Declared scaffold target; execution unverified | Presence of `wrangler.toml` does not prove the generated Worker bundle has no Node-only imports. |
| Build-time tooling | Python builder, TypeScript CLI/build scripts | Intended | Keep build-time filesystem/process dependencies out of generated browser and Worker bundles. |
| TypeScript consumers | generated frontend/API tsconfig surfaces | Scaffold-dependent | Validate declarations and module resolution in the generated project, not only in Skipo's own source tree. |

## Boundary rules

- Separate the Skipo builder's Node/Python execution environment from generated application runtime environments.
- Test generated Vite browser output independently from generated Next.js server/API output.
- For Cloudflare Worker scaffolds, bundle and execute a representative generated handler in a Workers-compatible runtime. A Wrangler configuration file alone is insufficient evidence.
- Generated package imports must use supported public package exports; do not depend on repository-internal paths.
- Do not claim one runtime's compatibility based on another runtime's successful build.
