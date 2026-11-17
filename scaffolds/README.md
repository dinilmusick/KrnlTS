# SKIPO App Scaffolds

SKIPO maintains one scaffold per frontend framework. Workspace strategy is selected through the application's KLOKS backend composition and is not represented by separate scaffold variants.

## Canonical Scaffolds

- `scaffolds/nextjs/` — Next.js application scaffold
- `scaffolds/vite/` — Vite + React application scaffold

## Workspace Strategy

Both scaffolds support either KLOKS workspace implementation:

```
Application Backend Facade
        ↓
WorkspaceService
   ┌────┴────┐
   ↓         ↓
Remote    Working
Workspace Workspace
```

### Remote-first

Used by applications such as DEPM.

- authoritative reads/writes go directly to the remote workspace/storage
- no local working-copy requirement

### Local working workspace

Used by applications such as QWNSR.

- reads/writes use the local working workspace
- synchronization persists changes to the authoritative remote workspace
- synchronization/conflict behavior belongs to the workspace implementation

## Scaffold Rule

Do NOT create:

- `nextjs-direct-vault`
- `nextjs-working-workspace`
- `vite-direct-vault`
- `vite-working-workspace`

as independent architectural variants.

Legacy variants are migration sources only. Their required behavior must be consolidated into the canonical framework scaffold and delegated to KLOKS workspace services.

## Generated Execution Path

```
FLOKS component
→ SKIPO event/action
→ SKIPO command
→ browser execution client
→ queue gateway
→ p-queue (in-process scheduler)
→ queue runner
→ application backend facade
→ service
→ operation
```

Frontend generated code must not import backend services, database adapters, server queue internals, provider implementations, credentials, or Node-only modules.

## Validation

Every canonical scaffold must pass:

1. typecheck
2. build
3. SKIPO architecture validation
4. generated-project validation
5. browser dependency-closure checks
6. execution-path tests
7. workspace strategy integration tests

Law L9 remains applicable to generated source files.

## Default storage providers

Both canonical scaffolds (Next.js and Vite) include the Kloks Google Drive workspace adapter by default. The backend exposes `AppBackend.storageProviders.googleDrive.create(connection, oauthConfig)`. The returned handle contains the Kloks `GoogleDriveStorageService` adapter and the connection updated with any refreshed access-token metadata.

The adapter is server-only. The OAuth client secret must come from deployment secrets or another server-owned credential store and must never be exposed to browser code. User authorization and storage-connection ownership remain with SRKL; adding the provider to a scaffold does not silently connect or grant access to a user's Drive. Other providers continue through the canonical Kloks storage service and workspace adapter.
