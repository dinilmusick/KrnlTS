# KrnlTS

KrnlTS is the backend semantic kernel for defining, validating, and running modular TypeScript services.

## Architecture

```text
KrnlTS
├── packages/core      Service contracts, runtime, lifecycle, registry,
│                      protocols, transports, state, events, discovery
├── packages/validate  AST/static architecture and purity validation
└── packages/cli       krnl command-line tooling
```

`IMPLEMENTATION-SPEC.md` is the canonical architecture specification.

KrnlTS owns backend service semantics and framework tooling. It does not own downstream service catalogs, frontend libraries, application composition, or ecosystem orchestration.

## Core service model

A service defines:

- identity and version
- operations with input/output contracts
- execution handlers
- optional state
- typed events
- lifecycle hooks
- dependencies, capabilities, and protocol metadata

Public service construction is runtime-validated through the service generators.

Lifecycle is an explicit state machine:

```text
uninitialized -> initializing -> ready -> starting -> running
                                               |
                                               v
                                           stopping -> stopped
```

A stopped service may be restarted. Invalid lifecycle transitions fail deterministically.

## Remote service contract

`ServiceProxy` implements the same `IService` contract as a local service while operation execution is mediated by a `ProtocolAdapter`.

Proxy lifecycle is local client lifecycle. Proxy state is a local cache and proxy events are local subscriptions unless a transport explicitly implements synchronization.

## Validation

KrnlTS has two complementary validation layers:

1. **Runtime contract validation** — validates service definitions and registration boundaries.
2. **AST/static validation** — validates source architecture and purity rules through `@ultrst-armada/krnl-validate`.

Both are part of the framework contract and require regression coverage.

## CLI

The `@ultrst-armada/krnl-cli` package exposes:

```bash
krnl validate
krnl build
krnl dev
krnl sync
krnl watch
krnl generate <entity|functionality|library> <Name>
```

## Packages

| Package | Purpose |
|---|---|
| `@ultrst-armada/krnl-core` | Canonical runtime and framework primitives |
| `@ultrst-armada/krnl-validate` | AST/static validation |
| `@ultrst-armada/krnl-cli` | CLI tooling |
| `@ultrst-armada/krnl` | Root distribution package/export surface |

The legacy root `src/` tree is compatibility-only. Canonical implementations live under `packages/core/src`.

## Acceptance

A KrnlTS change is complete only when build, typecheck, tests, validation, CLI behavior, and public package exports pass, with no ownership leakage into downstream ecosystem layers.
