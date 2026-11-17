# KLOKS — IMPLEMENTATION SPECIFICATION

STATUS := CANONICAL
AUTHORITY := KLOKS repository
ROLE := backend service/library distribution layer

## 1. CORE MODEL

KRNLTS := backend framework.
KLOKS := reusable backend service/library layer built on KRNLTS.
SKIPO := application layer consuming KLOKS.
CRUCIBLE := SKIPO application + ecosystem control plane.

KLOKS := STORE + EXPORT + CONTRACT surface for reusable backend functionality.

## 2. OWNERSHIP

KLOKS OWNS:
- reusable backend service implementations
- backend package organization
- backend package exports
- service manifests/contracts
- reusable backend functions
- reusable backend state/execution modules already belonging to the package library
- KLOKS package compatibility metadata

KLOKS DOES NOT OWN:
- KRNLTS runtime semantics
- React itself
- FLOKS UI implementation
- SKIPO application orchestration
- KRUSBL promotion mechanics
- CRUCIBLE ecosystem orchestration

## 3. DEPENDENCY DIRECTION

KRNLTS → KLOKS → SKIPO → CRUCIBLE

KLOKS MAY DEPEND ON:
KRNLTS
external runtime libraries

KLOKS MUST NOT depend on:
FLOKS | SKIPO | KRUSBL | CRUCIBLE

## 4. SERVICE MODEL

SERVICE_ARTIFACT :=
  KRNLTS_SERVICE
  + KLOKS_EXPORT
  + KLOKS_MANIFEST
  + PUBLIC_CONTRACT

SERVICE_PACKAGE :=
{
  source,
  implementation,
  exports,
  types,
  manifest,
  tests
}

KLOKS is not a second backend framework.
KLOKS uses KRNLTS.

## 5. PACKAGE MODEL

Existing package namespaces remain authoritative.

Current exported areas include:
functions
state-graph
audio-midi
services
backend
orchestrations
contracts

Each package MUST have:
- explicit public entrypoint
- type declarations
- tests appropriate to its behavior
- manifest where required by current KLOKS tooling

No duplicate service runtime is introduced.

## 6. CONTRACT AUTHORITY

PACKAGE_CONTRACT > generated metadata
EXPORT_CONTRACT > generated metadata
COMPATIBILITY_CONTRACT > generated metadata

KLOKS contracts MUST describe the actual published API.

KRUSBL may consume KLOKS contracts.
KRUSBL does not redefine them.

## 7. DISTRIBUTION

NPM (Node Package Manager) package:
@ultrst-armada/kloks

Published artifacts MUST correspond to repository source + package manifests + exports.

Build:
pnpm -r run build

Typecheck:
pnpm -r run typecheck

Tests:
pnpm -r run test

## 8. IMPLEMENTATION RULES

- preserve existing package boundaries unless evidence requires change
- no application-specific logic
- no CRUCIBLE control-plane logic
- no repository-promotion engine
- no duplicate KRNLTS runtime
- public exports must remain explicit
- dependency closure must be resolvable

## 9. TEST MODEL

REPO_TEST:
  package build
  typecheck
  unit tests
  manifest/export tests

CONTRACT_TEST:
  public exports
  public type surface
  manifest correctness
  KRNLTS compatibility

INTEGRATION_CONTRACT:
  SKIPO can consume published/local KLOKS packages.

## 10. ACCEPTANCE

PASS ⇔
  build
  ∧ typecheck
  ∧ tests
  ∧ exports valid
  ∧ manifests valid
  ∧ KRNLTS dependency valid
  ∧ no ownership leakage

## 11. AGENT RULE

AGENT_KLOKS:
  inspect actual packages first
  preserve valid implementations
  implement only missing KLOKS requirements
  update tests/contracts
  never move KRNLTS responsibilities into KLOKS
  never move SKIPO/CRUCIBLE/KRUSBL responsibilities into KLOKS
