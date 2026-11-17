# KLOKS — Canonical Execution, Workspace & NPM Implementation Plan

STATUS := CANONICAL
DATE := 2026-10-15

## PURPOSE

KLOKS provides the reusable backend execution and workspace capabilities consumed by SKIPO applications such as DEPM and QWNSR.

KLOKS owns mechanisms and reusable services. Consumer repositories own application-specific service registration and backend facades.

## CANONICAL EXECUTION

```
SKIPO command
→ queue transport
→ BullMQ
→ worker
→ application backend facade
→ KLOKS/application service
→ operation
```

Worker access to the backend facade is mandatory. Worker → service direct dispatch is forbidden.

Browser code MUST NOT import KLOKS server backend implementation, BullMQ server/Redis code, database adapters, Node builtins, credentials, or application services.

## GLOBAL KLOKS CAPABILITIES

KLOKS MUST provide reusable contracts/implementations for:

1. Command/job contracts
2. Queue transport boundary
3. BullMQ producer/gateway
4. BullMQ worker boundary
5. Backend facade contract/mechanism
6. Service discovery/registration/dispatch through the facade
7. Operation-component execution contracts
8. Result/error normalization
9. Correlation + idempotency metadata
10. Browser-safe execution client/transport
11. Backend capability manifests/contracts
12. Workspace service contract
13. Remote-first workspace implementation
14. Local working-workspace implementation
15. Working-workspace synchronization primitives
16. Public package exports separating browser-safe and server-only entrypoints

## WORKSPACE MODEL

One WorkspaceService contract; multiple implementations:

```
WorkspaceService
├── RemoteWorkspaceService
└── WorkingWorkspaceService
```

RemoteWorkspaceService:
- reads/writes the authoritative remote workspace directly
- no local working copy requirement

WorkingWorkspaceService:
- reads/writes a local working workspace
- synchronizes with authoritative remote storage
- owns sync/conflict semantics appropriate to the implementation

Workspace strategy is selected by application backend composition. It is NOT a SKIPO scaffold variant.

## APPLICATION OWNERSHIP

DEPM:
```
DepmBackend → RemoteWorkspaceService
```

QWNSR:
```
QwnsrBackend → WorkingWorkspaceService
```

KLOKS MUST NOT contain DEPM or QWNSR business logic.

## PACKAGE / EXPORT BOUNDARY

Expose explicit browser-safe/shared contracts separately from server-only implementation.

Conceptual surface:

```
@ultrst-armada/kloks/shared
@ultrst-armada/kloks/backend/client
@ultrst-armada/kloks/backend
@ultrst-armada/kloks/backend/worker
```

Exact package layout MUST follow the existing repository/package structure rather than duplicating packages unnecessarily.

Browser-safe imports MUST have no transitive dependency on:
- node:*
- fs/path/process-only modules
- Redis clients
- BullMQ server Worker/Queue implementation
- server credentials

## NPM DISTRIBUTION

KLOKS MUST be publishable as:
```
@ultrst-armada/kloks
```

Before publication:
- build all packages
- typecheck all packages
- run tests
- verify package exports
- verify declaration output
- verify dependency closure
- verify browser-safe entrypoints
- verify packed artifact with `npm pack --dry-run`
- verify consumer fixture can install/import the package

Publishing MUST use the repository's existing release/versioning mechanism. Do not invent a second release system.

## ACCEPTANCE

KLOKS passes when:
- canonical execution path works end-to-end
- worker reaches backend facade, not services directly
- workspace contract supports both implementations
- browser/server export boundaries are enforceable
- no application-specific service leakage exists
- NPM package can be consumed by a clean consumer fixture
- build/typecheck/tests/package validation pass
