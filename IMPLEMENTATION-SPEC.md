# KRNLTS — IMPLEMENTATION SPECIFICATION

STATUS := CANONICAL
AUTHORITY := KRNLTS repository
ROLE := backend framework
SCOPE := backend service construction + execution + validation

## 1. CORE MODEL

KRNLTS := framework for authoring and running backend services.

SERVICE := KRNLTS-defined executable backend unit.
FUNCTIONALITY := discrete callable execution unit belonging strictly to ONE service.
FUNCTIONALITY_ORCHESTRATION := DAG composition of functionalities belonging strictly to ONE service.
KLOKS := distribution/library layer for reusable backend services built on KRNLTS.
SKIPO := application layer consuming KRNLTS + KLOKS; owns cross-service SERVICE_ORCHESTRATION.
CRUCIBLE := SKIPO application + ecosystem control plane; CRUCIBLE does not redefine KRNLTS semantics.

## 2. OWNERSHIP

KRNLTS OWNS:
- service runtime semantics
- service lifecycle/execution semantics
- service input/output contracts
- functionality definitions and within-service functionality orchestrations (FunctionalityOrchestration)
- single-service queue-mediated execution runtime (BullMQ execution engine + worker boundary)
- backend validation rules
- framework-level backend abstractions
- framework tooling/CLI that directly validates or runs KRNLTS services

KRNLTS DOES NOT OWN:
- cross-service orchestration (owned by SKIPO via ServiceOrchestration)
- application-level domain graphs
- KLOKS package catalog/distribution policy
- FLOKS React components
- SKIPO application composition
- KRUSBL promotion orchestration
- CRUCIBLE ecosystem orchestration

## 3. DEPENDENCY DIRECTION

KRNLTS
  ↑
KLOKS
  ↑
SKIPO
  ↑
CRUCIBLE

KRNLTS MUST NOT import:
KLOKS | FLOKS | SKIPO | KRUSBL | CRUCIBLE

## 4. IMPLEMENTATION RULES

SERVICE := {
  identity,
  input,
  output,
  execution,
  errors,
  lifecycle
}

LIFECYCLE := restartable stop + terminal idempotent dispose.

FRAMEWORK_CODE ⊃ reusable runtime primitives.
APPLICATION_CODE ∉ KRNLTS.

∀ public framework API:
  typed
  deterministic where applicable
  runtime-validatable
  independently testable

AST (Abstract Syntax Tree) / purity / contract validation already present in the repository remains authoritative unless this specification explicitly supersedes it.

Existing working APIs MUST be preserved unless a change is required to satisfy this boundary.

## 5. PACKAGE BOUNDARY

Existing package structure remains the implementation substrate.

Required conceptual packages:
- core/runtime
- validation
- CLI/tooling

Additional existing packages remain only where they represent KRNLTS framework functionality.

No new package is justified solely to mirror KLOKS/FLOKS/SKIPO/CRUCIBLE.

## 6. PUBLIC CONTRACT

KRNLTS exports:
- framework primitives
- service definitions
- execution primitives
- validation primitives
- supported CLI entrypoints

KLOKS consumes these contracts.
SKIPO consumes KRNLTS directly only where framework functionality is required.

## 7. TEST MODEL

REPO_TEST:
  framework unit tests
  service execution tests
  lifecycle tests
  validation tests
  type tests
  CLI tests

CONTRACT_TEST:
  public API shape
  lifecycle/disposal semantics
  input/output validation
  deterministic error behavior
  package export integrity

REGRESSION:
  existing tests MUST remain green.

## 8. ACCEPTANCE

PASS ⇔
  build
  ∧ typecheck
  ∧ tests
  ∧ validation
  ∧ public exports resolve
  ∧ no KLOKS/FLOKS/SKIPO/KRUSBL/CRUCIBLE ownership leakage

## 9. CHANGE POLICY

Implement only changes required by:
A := this specification
B := existing repository contracts
C := verified downstream requirements

UNRELATED LEGACY FEATURES ≠ automatically deleted.

## 10. AGENT RULE

AGENT_KRNLTS:
  inspect repository
  preserve valid existing implementation
  implement missing framework requirements
  update tests
  update this spec only when an accepted architectural decision changes

NO ecosystem-wide implementation inside KRNLTS.
