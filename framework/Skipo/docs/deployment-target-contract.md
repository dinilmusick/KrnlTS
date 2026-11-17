# Deployment Target Contract

Skipo owns the application-level declaration of supported deployment targets. This contract is metadata only; execution is delegated to Kelt and Krusbl through the canonical Kloks WebContainer runtime.

## Providers

- vercel: Vercel project build target.
- cloudflare: Cloudflare Workers or Pages build target.

## Contract rules

- Every target declares its provider and build command.
- Paths are relative to the application root unless explicitly stated.
- Provider configuration remains in the provider's native configuration file.
- Secrets are never stored in this manifest.
- A missing provider configuration is reported as not configured, not silently treated as compatible.
- Static preflight checks are distinct from provider-native build verification.
- The WebContainer workspace root comes from the Skipo WebContainer manifest (default: `/workspace`); provider target root directories resolve beneath that root.

Schema: schemas/deployment-target.schema.json.
WebContainer command and workspace contract: `src/contracts/webContainerManifest.ts`.

## Validation stages

1. Static configuration and manifest inspection.
2. Provider CLI build (`vercel build` / `wrangler deploy --dry-run`) inside the canonical Kloks WebContainer runtime.
3. Runtime smoke tests against the generated provider artifacts.
4. Optional preview deployment and remote verification.

Kelt owns application-level provider builds. Krusbl owns ecosystem-level validation evidence and promotion gating. Neither may create a competing sandbox or deploy production from pull-request validation.
