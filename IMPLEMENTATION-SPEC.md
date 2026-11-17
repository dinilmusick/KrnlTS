# SKIPO — IMPLEMENTATION SPECIFICATION

STATUS := CANONICAL
ROLE := deterministic application construction and evolution layer

## 1. CORE MODEL

KRNLTS := backend framework.
KLOKS := canonical backend service library.
REACT := frontend framework.
FLOKS := canonical React UI library.
SKIPO := application builder, composer, migrator, drift detector and verifier.

## 2. OWNERSHIP

SKIPO OWNS:
- application construction
- capability composition
- application wiring and generated adapters
- application contracts
- capability registry and provider resolution
- versioned migrations and update flow
- duplicate detection and canonicalization
- validation and verification

SKIPO DOES NOT OWN:
- ATAX agent coordination
- KRNLTS framework internals
- KLOKS service implementations
- FLOKS reusable component implementations
- Luth authentication authority

## 3. CAPABILITY MODEL

A capability is the deterministic application composition unit.

```text
capability
  -> canonical providers
  -> dependencies
  -> generated wiring
  -> duplicate patterns
  -> migration/verification rules
```

Skipo does not copy provider implementations into applications.

## 4. DETERMINISTIC OPERATIONS

```text
adopt     register an existing application without replacing code
add       ensure a capability exists and is canonically wired
diagnose  detect local/custom duplicate implementations
plan      show deterministic repair/composition actions without mutation
repair    diagnose + canonicalize + migrate + verify
sync      reconcile installed capabilities with the registry
update    apply framework migration state and version metadata
remove    remove Skipo-generated capability wiring
verify    prove capability state and drift status
test      execute application tests/build plus Skipo verification
```

All mutations are idempotent.

## 5. NO MODULE ARCHITECTURE

Applications do not contain a Skipo module layer. Reusable infrastructure is provided by canonical ecosystem libraries and composed as capabilities. Application-specific functionality remains application code.

## 6. PROVIDER BOUNDARY

Skipo → Kloks / Floks
Kloks / Floks → their own implementations

Skipo owns only the wiring and contract between them.

## 7. ACCEPTANCE

PASS ⇔
- deterministic capability commands work
- duplicate detection distinguishes keep/adapt/retire
- repair uses the same composer as add
- update records and applies migrations
- generated state is explicit and reproducible
- no legacy module architecture remains
- verification fails on unresolved canonical duplicates
