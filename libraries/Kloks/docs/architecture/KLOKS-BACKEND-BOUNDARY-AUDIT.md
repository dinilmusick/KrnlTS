# Kloks Backend, Storage and Runtime Boundary Audit

**Scope:** Agent 8 — backend integration, storage/workspace providers, state-graph runtime surfaces, authentication ownership and package boundary enforcement.

**Baseline:** `main` at the time this audit branch was created. This report is an audit record, not a claim that the open PRs have been merged or that runtime tests have passed.

## Ownership contract

Kloks owns backend integration implementations and provider-specific adapters. It may implement database, object-storage, workspace and external-service integrations. It consumes identity and session authority from Luth through canonical GutTS contracts. It must not own credentials, canonical sessions, identity lifecycle or application-specific authorization policy.

Browser and Worker consumers must use narrow runtime-compatible contracts and exports. Node-only implementations must remain isolated behind server-specific entry points.

## Findings from current main

### Public storage surface

- `packages/backend/src/storage/index.ts` re-exports LocalFS, S3, Backblaze, Google Drive, Supabase and shared storage abstractions from one barrel.
- `LocalFSAdapter` imports Node filesystem and path APIs.
- `GoogleDriveAdapter` imports `node:stream` and the Google SDK.
- S3 implementation uses Node Buffer values.
- This is a server-oriented surface and must not be treated as browser/Worker safe.
- Keep provider implementations server-side; expose only deliberate contracts and Fetch-native implementations from Worker-specific entry points.

### Authentication ownership

- `UnifiedAuthCore` imports `LuthAuthClient` and contracts from `@dinilmusick/gutts/auth`.
- This is directionally consistent with Luth being the sole identity/session authority.
- Continue auditing callers and persistence paths to ensure Kloks does not mint, persist or independently validate canonical credentials or sessions.
- The helper currently reads `process.env.APP_URL`; runtime configuration must be injected or isolated from Worker/browser entry points.

### State-graph exports

The current root package exports `./state-graph` to the aggregate state-graph entry. That entry imports KrnlTS service definitions. A browser consumer therefore needs an explicit browser-safe path.

The outstanding PRs overlap:

- [PR #44](https://github.com/dinilmusick/Kloks/pull/44) adds a browser conditional target to the root `./state-graph` export and includes `src/browser.ts`.
- [PR #46](https://github.com/dinilmusick/Kloks/pull/46) adds an explicit `./browser` export to the `@kloks/state-graph` workspace package and a built-output regression test.

These are not fully independent: both introduce a browser entry, but at different package-export layers and with different entrypoint contents. Reconcile into one authoritative source file and expose a stable root-package subpath such as `@ultrst-armada/kloks/state-graph/browser`. Keep the Node aggregate entry unchanged.

**Build defect to correct before adoption:** PR #46 runs a second tsup invocation with `--clean` after the Node build and declaration emit. That can remove previously generated distribution outputs. The browser build must not clean the shared output directory; clean once before the complete build, or use a separate output directory and explicit copy/emit strategy.

### Google Drive Worker service

[PR #45](https://github.com/dinilmusick/Kloks/pull/45) adds a separate Fetch-native service and a narrow `backend/storage-workspace` entry. The separation from the existing Google SDK adapter is correct in principle.

Mandatory acceptance work:

1. OAuth callback handlers must validate state against a server-held, one-time state value; including a caller-supplied state string in the authorization URL is not validation.
2. PKCE must be complete end-to-end: generate/use a verifier, include the derived S256 challenge in the authorization URL, and submit the verifier during code exchange.
3. Refresh-token persistence must be an injected trusted-server operation. The service must not claim encryption or durable-storage guarantees that the caller's persistence adapter does not provide.
4. Worker compatibility must be verified against the built entrypoint and dependency graph, not inferred solely from using `fetch`.
5. Multipart upload boundaries and byte framing must be tested with binary payloads, including CRLF framing.
6. Error handling must not expose access tokens, refresh tokens, client secrets or raw provider response bodies in logs/errors.
7. Folder traversal and file operations must be constrained to the selected root and validated provider IDs.

The current PR tests cover authorization URL creation, code exchange, refresh persistence, folder selection and missing credentials. Extend them for state mismatch/replay, PKCE, binary multipart uploads, 401 refresh retry, refresh persistence failure, root containment and Worker bundle imports.

## PR disposition

| PR | Relationship | Recommendation |
|---|---|---|
| #44 | Earlier browser-entry implementation | Preserve useful exported primitives; do not merge independently. |
| #46 | Follow-up/refinement of #44 at workspace package level | Preferred basis for the browser entry, after removing destructive second `--clean`, reconciling root exports and combining required primitives. |
| #45 | Separate Worker storage capability | Keep separate from state-graph work; require OAuth/PKCE, upload framing, root containment and actual Worker-runtime verification before acceptance. |

No PR #44, #45 or #46 is merged by this work.

## Required verification evidence

- [ ] Architecture checker consumes canonical Krusbl policy and Agent 2 checker.
- [ ] Browser import test against packed package.
- [ ] Node import test against packed package.
- [ ] Worker bundle/import test for Fetch-native workspace entry.
- [ ] State-graph browser build preserves Node and declaration outputs.
- [ ] Google OAuth state and PKCE tests.
- [ ] Token refresh, persistence failure and 401 retry tests.
- [ ] Binary multipart upload and root-containment tests.
- [ ] Storage provider tests.
- [ ] Full typecheck, build, unit tests and clean-room package test.

## Status

This branch adds the audit report and wires the repository's existing boundary and clean-room checks into CI. It does not certify those checks as passing; GitHub Actions is the evidence gate. Runtime/security implementation items above remain explicit acceptance work, not assumed-complete work.
