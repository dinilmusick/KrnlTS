# Skipo maintenance contract

## Purpose and ownership

Skipo is an installed application framework, not a one-time scaffold generator. Every adopted or generated Skipo application carries a local framework manifest and state directory. The installed Skipo CLI is the operator for inspecting, reconciling and validating that state.

Skipo owns framework composition and application wiring. Canonical provider packages remain the implementation owners for their services and UI capabilities. Applications may own application-specific behavior, but they must not fork or replace canonical framework infrastructure. Unknown or application-owned state is preserved and reported rather than destructively rewritten.

Skipo maintains application-side framework state under `.skipo/`:

| File | Responsibility |
|---|---|
| `.skipo/project.json` | Framework identity, installed framework version and migration metadata |
| `.skipo/dependencies.json` | Tracked ecosystem package versions |
| `.skipo/capabilities.json` | Installed capabilities and Skipo-generated file ownership/checksums |
| `.skipo/overrides.json` | Explicit capability overrides |
| `.skipo/migration-state.json` | Applied and pending migration identifiers |

The versioned canonical application-state registry is `architecture/capabilities/registry.json`. Its schema, version and required state sections are validated before capability resolution. The registry is the source of canonical framework capability metadata; the per-application `.skipo/` files record the application's local state.

## Deterministic maintenance lifecycle

The maintenance lifecycle is an ordered operating model. `skipo plan` produces a deterministic read-only plan and `skipo update`/`skipo repair` execute that plan with stale-state checks and independent post-verification.

```text
inspect
  ↓
diagnose
  ↓
plan
  ↓
update
  ↓
repair
  ↓
sync
  ↓
verify
```

| Stage | Command | Contract |
|---|---|---|
| Inspect | `skipo inspect [target]` | Read the project manifest and capability state. It is an informational snapshot, not a drift repair. |
| Diagnose | `skipo diagnose [target]` | Scan application source for registry-declared patterns and classify findings as `keep`, `adapt` or `retire`. A pattern match alone is not proof that application code is a duplicate. |
| Plan | `skipo plan [target]` | Produce findings and safe retirement actions without applying them. |
| Update | `skipo update [target]` | Reconcile dependency migrations, framework self-upgrade migrations, canonical environment changes, capability repair and lockfile state, then independently verify the resulting state. |
| Repair | `skipo repair [target]` | Execute the same deterministic maintenance plan while repairing safe canonical drift and environment aliases. `skipo repair --plan` reports the planned operation without applying it. |
| Sync | `skipo sync [target]` | Recompose the capabilities already recorded as installed. Use `--install` to run the detected package manager after composition. |
| Verify | `skipo verify [target]` | Run the independent canonical-state verifier, including capability ownership/checksums, migration state, dependency state, environment constraints and architectural drift. |

The lifecycle is deterministic in ordering and decision inputs. Repeated composition and synchronization should converge on the same registry-derived wiring. Repair is conservative: it must not overwrite modified application-owned generated files, and it must not delete paths unless the registry explicitly declares them safe to retire.

### Related validation commands

- `skipo check [target]` invokes the full-system validator. It is broader than the capability-state checks performed by `skipo verify`.
- `skipo test [target]` runs the target application's available `typecheck`, `lint`, `test` and `build` scripts, then runs `skipo verify`.
- `skipo update` and `skipo repair` invoke verification before reporting successful completion through their CLI handlers (repair verifies after an applied repair).

A successful `verify` is not a substitute for the application's test, typecheck, build, deployment or external integration checks.

## Update and migration boundary

The installed framework CLI is the entry point for `skipo update`. The framework self-upgrade engine applies versioned Skipo migrations already shipped with the installed CLI. It does **not** download or replace the CLI package itself; obtaining a newer Skipo CLI remains the responsibility of the package manager or dependency-update workflow.

The migration registry is `architecture/capabilities/migrations.json`; application progress is recorded in `.skipo/migration-state.json`. Framework migrations are version-aware, resumable and idempotent. Dependency migrations are discovered from package-shipped declarative contracts and recorded with package-scoped migration identities.

### Canonical dependency migration extension point

Future upstream dependency migrations must be expressed as versioned, declarative contracts, rather than application-specific scripts or duplicated downstream implementations. A contract should identify, at minimum:

- a stable migration identifier and schema/version;
- the canonical source dependency and target version/contract;
- applicable preconditions and supported source states;
- deterministic, ordered migration actions;
- ownership boundaries and explicit safe-to-change paths;
- unknown-state and conflict behavior (preserve and report by default);
- postconditions and machine-verifiable acceptance checks;
- an idempotency rule and recorded applied state.

The registry and migration-state file are Skipo-owned state surfaces. Installed dependencies may publish a constrained declarative migration contract; Skipo resolves deterministic version paths, rejects missing/unsafe operations, executes only supported transformations, records applied identities, and independently verifies postconditions.

## Environment contract

Skipo's standard application environment contract uses these names:

| Variable | Contract |
|---|---|
| `SYSTEM_DATABASE_URL` | Primary system database connection |
| `SYSTEM_DATABASE_URL_2` | Optional additional system database connection slot |
| `SYSTEM_DATABASE_URL_3` | Optional additional system database connection slot |
| `APP_URL` | Canonical application URL |

Values and credentials belong in the application's deployment environment or secret store, not in source control. Scaffold examples may leave secondary database slots unset. Runtime/tooling variables and explicitly governed exceptions are separate from these four standard application contract names; their presence does not change the canonical names above.

## Framework and dependency boundaries

- Skipo is installed in each Skipo application and maintains that application's Skipo-specific state.
- Canonical service and UI implementations remain in their owning provider packages; Skipo composes application wiring and records ownership.
- Skipo may consume versioned canonical dependency contracts through a future generic migration interface, but it must not embed downstream-application identities or downstream-specific repair logic in the framework registry.
- Downstream applications consume canonical framework and provider packages. They must not independently reimplement Skipo's registry, capability composition, migration-state, or verification infrastructure.
- Application-owned code and unknown state remain application-owned. Conflicts must be surfaced for review, not silently overwritten.

## Acceptance criteria for maintenance changes

A maintenance change is complete only when:

1. The documented behavior matches the actual CLI dispatch and implementation.
2. Registry inputs and generated output ordering are deterministic.
3. Re-running an already-applied operation does not introduce additional changes.
4. Unknown or application-owned state is preserved and reported.
5. Destructive retirement is limited to explicitly declared safe paths.
6. Migration state is persisted and can be independently verified.
7. `skipo verify` passes for the resulting capability state.
8. Relevant repository tests and GitHub Actions checks pass.
9. No downstream repository or downstream-specific application implementation is modified as part of a Skipo-only maintenance change.

This document defines the current maintenance contract and explicitly labels extension points that are not yet executable. When implementation changes, update this contract and its regression tests in the same Skipo change.
