# SKIPO — Canonical Scaffold, Execution & Workspace Plan

STATUS := CANONICAL
DATE := 2026-10-15

## CORE DECISION

SKIPO has ONE scaffold per frontend framework, not one scaffold per workspace strategy.

Canonical scaffold families:

```
scaffolds/
├── nextjs/
└── vite/
```

Workspace strategy is selected through KLOKS backend workspace services.

## WORKSPACE STRATEGY

```
Application
  ↓
Application Backend Facade
  ↓
WorkspaceService
  ├── RemoteWorkspaceService
  └── WorkingWorkspaceService
```

DEPM selects RemoteWorkspaceService.

QWNSR selects WorkingWorkspaceService.

The frontend scaffold MUST NOT know which implementation is selected.

## SCAFFOLD CONSOLIDATION

The existing `*-direct-vault` and `*-working-workspace` scaffold variants are legacy duplication of application architecture.

Implementation MUST:
1. diff the variants against the canonical `nextjs` / `vite` scaffolds
2. preserve required framework/build/auth/API behavior
3. move workspace-specific behavior behind KLOKS workspace services
4. delete obsolete duplicated scaffold variants after migration
5. update scaffold registry/generator tests
6. update scaffold README and metadata
7. ensure generated applications select workspace strategy through backend composition/configuration

Do not preserve workspace strategy as a scaffold dimension.

## EXECUTION CONTRACT

Generated applications MUST use:

```
FLOKS component
→ SKIPO event/action
→ SKIPO command
→ browser execution client
→ queue gateway
→ BullMQ
→ worker
→ application backend facade
→ service
→ operation
```

Frontend components MUST NOT import:
- backend services
- backend implementation
- database
- provider implementation
- server BullMQ/Redis
- Node-only modules

Worker MUST call the backend facade.

## STATE

Generated frontend state remains SKIPO_STATE/Zustand according to the canonical state-execution specification. Do not introduce per-component state stores that bypass SKIPO_STATE.

## ENFORCEMENT

Extend existing validators to inspect transitive dependency closure.

Required failures:
- component → service
- component → backend implementation
- component → database
- component → external provider
- component → BullMQ server
- component → Node builtin
- worker → service direct

Required pass:
- worker → backend facade

Add negative fixtures and generated-scaffold validation.

## NPM CONSUMPTION

Generated applications must consume released/public KLOKS and FLOKS package entrypoints through explicit exports. Local repository-relative imports into KLOKS/FLOKS internals are forbidden.

## ACCEPTANCE

Both canonical scaffolds generate applications that:
- compile
- pass SKIPO validators
- use the canonical execution path
- can select either workspace strategy without scaffold duplication
- consume public KLOKS/FLOKS contracts
