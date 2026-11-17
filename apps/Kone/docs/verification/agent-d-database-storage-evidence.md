# Agent D — KONE Database and Storage Evidence

Captured: 2026-11-17
Repository: `dinilmusick/Kone`
Branch: `fix/fetch-native-entrypoint-env-2026-11-16`
PR: [#25](https://github.com/dinilmusick/Kone/pull/25)
Implementation snapshot before final evidence capture: `4c8cf63bf0bdba9fec88b544965743f69cd8a41f`

## 1. Exact Fetch environment trace

```text
Cloudflare Worker bindings
  SYSTEM_DATABASE_URL
  SYSTEM_DATABASE_URL_2
  SYSTEM_DATABASE_URL_3
  APP_URL
       |
       v
api/index.js (generated Worker entrypoint)
       |
       v
src/backend/adapters/universalEntry.ts
  default.fetch(request, env)
       |
       v
normalizeEnv(env, request.url)
       |
       v
src/backend/adapters/systemEnvironment.ts
  clean primary / fallback 2 / fallback 3
  tryResolveSystemDatabaseUrl(explicit binding object)
  promote selected URL to SYSTEM_DATABASE_URL
  preserve fallback 2 / fallback 3
  remove legacy SYSTEM_DATABASE_URL_1
  preserve APP_URL or derive request origin
       |
       v
src/backend/adapters/httpsAdapter.ts
  fetchHandler(request, normalizedEnv)
       |
       v
serviceEnv(env, request.url)
  normalize again and add WORKSPACE_APP_ID=kone
       |
       +--> WorkspaceServiceFacade.execute(...)
       |
       +--> StorageServiceFacade.execute(...)
       |
       +--> SrklServiceFacade.execute(...) where retained
                    |
                    v
Kloks WorkspaceServiceDefinition.listWorkspaces
  -> getWorkspaces(userId, env)
  -> queryUnifiedDb(sql, params, env)
  -> getUnifiedDbUrl(env)
  -> Neon serverless query execution
```

Source trace verified against the canonical Kloks 2.0.5 implementation branch
`fix/canonical-storage-runtime-contracts-2026-11-16`:

- `packages/backend/src/krnl-services.ts`: `listWorkspaces` passes `input.env` to `getWorkspaces`.
- `packages/backend/src/core/workspaceCore.ts`: `getWorkspaces(userId, env)` calls `queryUnifiedDb(..., env)`.
- `packages/backend/src/core/unifiedDb.ts`: `queryUnifiedDb` resolves the URL through `getUnifiedDbUrl(env)`, then creates the Neon client and executes the query.

The canonical query consumer checks the explicit binding record first, then has a Node `process.env` fallback when no binding resolves. KONE prevents stale Worker environment values from entering that fallback by removing `nodejs_compat_populate_process_env` from `wrangler.toml`. The Node development bootstrap remains explicit: `server.ts` passes `process.env` into `normalizeEnv`.

## 2. Configuration contract

| Binding | Behavior |
|---|---|
| `SYSTEM_DATABASE_URL` | Primary; retained when configured |
| `SYSTEM_DATABASE_URL_2` | First fallback |
| `SYSTEM_DATABASE_URL_3` | Second fallback |
| `APP_URL` | Retained as canonical app origin; request origin is used only when absent |
| `SYSTEM_DATABASE_URL_1` | Legacy alias is removed from normalized service environment |

The resolver is always called with an explicit object containing only the supported three database keys. It is never called with omitted arguments on the Fetch path.

## 3. Storage route contract

All routes below pass through Luth authentication except the Google callback, which validates Kloks-signed OAuth state and the HttpOnly nonce cookie.

| Operation | Route |
|---|---|
| Provider capabilities | `GET /api/storage/providers` |
| Existing user connections | `GET /api/storage/connections` |
| B2 credential test | `POST /api/storage/connections/backblaze/test` |
| B2 connection creation | `POST /api/storage/connections/backblaze` |
| B2 bucket discovery | `POST /api/storage/connections/backblaze/buckets` |
| Google authorization start | `GET /api/storage/connections/google/authorize` |
| Google OAuth callback | `GET /api/storage/connections/google/callback` |
| Google account identity | `POST /api/storage/connections/google/identity` |
| Google folder listing | `POST /api/storage/connections/google/folders` |
| Google root selection | `POST /api/storage/connections/google/root` |
| Authenticated database smoke | `GET /api/health/database` |

Storage ownership is derived from the verified Luth principal. Google callback ownership is taken from the state payload only after Kloks verifies its signature, expiry, callback origin, and nonce. B2 and Google credential persistence is delegated to the canonical Kloks storage operations; KONE does not persist provider credentials.

## 4. Google OAuth deployment prerequisite

Google OAuth runtime configuration prerequisite: the system-owned Kloks Google OAuth `redirectUri` must be configured to the KONE callback URL `https://kone.todadjp.workers.dev/api/storage/connections/google/callback`. The configured callback origin must match KONE's origin. The current KONE source cannot verify or change this secret-backed system credential; validate it during deployment smoke testing.

## 5. Changes committed in KONE

- Fetch-safe environment adapter using Kloks' canonical resolver.
- Worker compatibility configuration no longer populates `process.env`.
- Every database-backed Kloks facade invocation receives normalized environment.
- Authenticated database query smoke endpoint through the real workspace facade.
- B2 and Google Drive route coverage.
- Google OAuth signed-state callback and nonce cookie.
- Floks canonical storage adapter now uses its one-argument `createKloksWorkspaceStorageService({ invoke })` contract.
- Regression tests for database normalization, stale process environment, route ownership, B2 operations, Google OAuth, folder/root selection, and the database query route.
- Static Fetch boundary assertions.

## 6. Verification evidence and outstanding gates

### Completed observations

- Live deployed KONE health request:
  `GET https://kone.todadjp.workers.dev/api/health`
  returned `{"status":"ok","service":"kone","timestamp":"2026-11-16T20:57:23.974Z"}`.
  This verifies the currently deployed service only; it does not prove that this PR is deployed.
- Current GitHub PR #25 head at evidence capture: `529f70ac37a7a5174d8f6f94de91129d550797c2`.
- Previous observed GitHub Actions run: Kone CI run `43954562229`, job `validate`, conclusion `failure`, associated with commit `c06e757bb4ca9f9021365b4ef4f0d0d38368ed5520c` (job logs endpoint returned 404, so the failing step is not established).
- Current Vercel status: failure, target reports build-rate-limit.

### Dependency gate

The KONE manifest requests `@ultrst-armada/kloks@^2.0.5` and `@ultrst-armada/floks@^2.0.5`. Both exact npm registry metadata URLs for version `2.0.5` returned HTTP 404 at evidence capture. The corresponding implementation branches exist, but the releases are not yet available from npm. The committed package lock still contains version `2.0.4` for both packages.

Do not replace these with 2.0.4: the KONE code consumes resolver and storage operations that are present in the 2.0.5 source branches and absent from the inspected 2.0.4 Kloks facade.

### Not yet verified

The following remain pending and must not be reported as passing:

- `npm install --no-audit --no-fund` against published 2.0.5 dependencies.
- `npm run validate` (system environment script, TypeScript, Vitest, build).
- A fresh successful GitHub Actions run on the latest PR head.
- Live authenticated `/api/health/database` execution against the configured system database.
- Live authenticated B2 and Google Drive route smoke tests.
- Deployment smoke tests against the PR build.

The ATAX Supabase project discovered during this session is inactive; no ATAX ledger write was possible. This evidence is therefore persisted in the KONE repository and the PR description until the canonical ledger is available.
