---
name: npm-trusted-publishing
description: Strict governance for npm publishing using GitHub Actions OIDC Trusted Publishing exclusively instead of token-based authentication.
---

# GutTS npm Trusted Publishing Specification

## Inviolable Rule
**NEVER** use token-based authentication (`npm login`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or local token `.npmrc`) for publishing `@dinilmusick/gutts`.

The canonical package publication mechanism is **OIDC Trusted Publishing**, executed exclusively within the repository's GitHub Actions workflow:
`.github/workflows/npm-release.yml`

## Invariants & Rules

1. **Zero Secret Tokens**:
   - `NODE_AUTH_TOKEN` is explicitly kept empty or unset in the publishing environment.
   - GitHub Actions issues short-lived OIDC tokens directly to the npm registry with provenance.

2. **Triggering npm Release**:
   - Primary: Triggered automatically via `workflow_run` when `GutTS CI` succeeds on the `main` branch.
   - Manual: Triggered via GitHub Actions `workflow_dispatch` on `main` with `publish: true`.

3. **Release Preconditions**:
   - `package.json` version and `gutts.manifest.json` version must match exactly.
   - `pnpm test` (all unit and contract tests) must pass.
   - `pnpm typecheck` must pass with zero TypeScript errors.
   - `pnpm build` must succeed and generate all declaration and bundle artifacts.
   - The version must not already exist on the npm registry.

4. **Provenance & Attestation**:
   - Publication publishes with `--access public` and records release attestation (`.krusbl-release-attestation.json`) linking to the immutable commit SHA and workflow run.
