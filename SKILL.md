---
name: krnlts-guide
description: Canonical agent guidance for the KrnlTS backend service framework.
---

# KrnlTS Agent Guide

KrnlTS is the backend semantic kernel for authoring, validating, and running executable services.

## 1. Canonical architecture

The authoritative implementation is the workspace package tree:

- `packages/core` — service contracts, runtime, lifecycle, registry, protocols, transports, state, events, discovery, and connectivity.
- `packages/validate` — AST/static validation.
- `packages/cli` — public CLI and tooling.
- `IMPLEMENTATION-SPEC.md` — canonical architecture and acceptance rules.

The legacy `src/` surface is compatibility-only and must not become a second implementation. Core files under `src/` re-export the canonical `packages/core` implementation.

## 2. Dependency direction

KrnlTS may be consumed by downstream service libraries and applications.

KrnlTS MUST NOT import or own:

- KLOKS
- FLOKS
- SKIPO
- KRUSBL
- CRUCIBLE

Do not add ecosystem-specific abstractions to the kernel.

## 3. Public framework rules

Every public framework API must be:

- strongly typed
- runtime-validatable at semantic boundaries
- deterministic where applicable
- independently testable
- covered by regression/contract tests

Service lifecycle is an explicit state machine:

`uninitialized -> initializing -> ready -> starting -> running -> stopping -> stopped`

A stopped service may transition to `starting` for restart. Invalid transitions must throw.

## 4. Service contract

A service consists of:

- identity
- operations and input/output contracts
- execution handlers
- state
- events
- lifecycle
- dependencies/capabilities/protocol metadata

Use `createServiceDefinition`, `createService`, and `createServiceProxy` for validated construction.

## 5. Proxy semantics

A `ServiceProxy` implements the same service contract while remote operation execution is mediated by a `ProtocolAdapter`.

Proxy lifecycle is local client lifecycle. Proxy state is a local cache and proxy events are local subscriptions unless a protocol adapter explicitly provides remote synchronization.

Do not describe local proxy state/events as authoritative remote state.

## 6. Runtime semantics

`ServiceRuntime` owns registered service instances and their registry records.

- duplicate service IDs are rejected unless the same instance is registered again
- startup is ordered and rolls back services started earlier when a later service fails
- shutdown is reverse-ordered and attempts every service before surfacing the first failure
- registry metadata is validated at registration

## 7. Static validation and CLI

Static AST/purity validation remains authoritative and must not be replaced by runtime validation.

Runtime contract validation and AST validation solve different problems:

- runtime validation checks framework objects at execution/registration boundaries
- AST validation checks source-code architecture and purity rules

Both must remain covered by tests.

## 8. Agent workflow

Before changing KrnlTS:

1. Read `IMPLEMENTATION-SPEC.md`.
2. Inspect the canonical package under `packages/`.
3. Preserve working APIs unless a specification or verified contract requires change.
4. Add regression tests for every invariant changed.
5. Run build, typecheck, tests, validation, CLI checks, and public export checks.
6. Re-run the complete suite after fixes.

Do not reintroduce a parallel implementation under `src/`.
