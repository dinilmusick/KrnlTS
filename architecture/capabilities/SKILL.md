# Skipo Capability Composition and Dependency Migrations

Capabilities are the application composition unit. Skipo does not use modules as an application architecture primitive.

## Composition model

```
Capability Registry -> Resolver -> Composer -> Application -> Verifier
                                      ^                 |
                                      |                 v
                              Drift Detector <- Repair/Migrate
```

A capability declares canonical provider packages, public symbols, generated wiring surfaces, duplicate-implementation patterns, and verification requirements. Skipo installs canonical dependencies and generates only thin application-owned wiring/adapters; it never copies Floks or Kloks implementation code into an application.

## Dependency migration lifecycle

```
installed dependency change -> discover package contract -> validate compatibility
 -> resolve exact version path -> build ordered dry-run plan -> transform -> repair
 -> verify canonical state -> persist applied migration IDs and dependency baseline
```

Dependency migrations extend the existing `.skipo/migration-state.json` and `.skipo/dependencies.json` state. The dependency-state file retains the declared package specifier and records exact installed versions under `_resolved`, so later upgrades start from the actual prior package version rather than a caret/range lower bound. They are not a second update mechanism. `skipo plan .` exposes the deterministic migration plan; `skipo update .` executes it before advancing the framework manifest; `skipo verify .` rechecks verification operations for applied contracts.

## Package contract discovery

Any installed dependency may publish a JSON contract and point to it from its package manifest. Discovery is package-agnostic; Skipo does not contain Kloks/Floks version branches:

```json
{
  "name": "@vendor/example",
  "version": "2.0.0",
  "skipo": { "migrationContract": "./skipo.migrations.json" }
}
```

Skipo also recognizes `skipo.migrations.json` at the package root and an application override at `.skipo/contracts/<normalized-package>.migrations.json`. Package-declared contract paths must remain inside the package directory.

## Contract schema (version 1)

```json
{
  "schemaVersion": 1,
  "package": "@vendor/example",
  "compatibility": { "skipo": ">=1.1.0" },
  "migrations": [{
    "id": "example-1-to-2",
    "fromVersion": "1.0.0",
    "toVersion": "2.0.0",
    "requiresSkipo": ">=1.1.0",
    "oldState": {},
    "newState": {},
    "apiChanges": [],
    "configurationChanges": [],
    "deprecatedPatterns": [
      { "text": "OldFacade", "paths": ["src/**/*.ts"] }
    ],
    "canonicalReplacements": [
      { "find": "OldFacade", "replace": "NewFacade", "paths": ["src/**/*.ts"] }
    ],
    "transformations": [],
    "repair": [],
    "verification": [],
    "dependsOn": []
  }]
}
```

Migration edges must form a complete path from the recorded installed version to the package's installed version. Skipo rejects missing paths, invalid contract identities, unsupported schemas, incompatible Skipo requirements, unresolved dependencies, and ordering cycles. Version paths are selected deterministically; migrations within one package retain their version-chain order, and `dependsOn` orders migrations across packages. Applied identities are stored as `<package>::<migration-id>` to prevent collisions between packages. An unqualified `dependsOn` refers to the same package; cross-package dependencies use the fully qualified `<package>::<migration-id>` form.

## Deterministic operation handlers

Transformation and repair handlers are declarative; contracts cannot execute shell commands or arbitrary code.

- `replace_text`: `paths`, `find`, `replace`, optional `expectedMatches`.
- `set_json`: `path`, dotted `key`, `value`, optional `expectedOld`.
- `text_absent`: verify deprecated text is absent from `paths`.
- `text_present`: verify canonical text exists in `paths`.
- `json_equals`: verify a JSON `path` and dotted `key` equal `value`.

The plan records every affected application file and match count for declared deprecated patterns. Canonical replacement declarations generate deterministic text transformations; an affected deprecated pattern without a declared transformation/replacement blocks the plan. Paths are constrained to the application root, symlink files are not transformed, and unsupported operation types fail closed. Repeated application is idempotent: an already-applied migration ID is skipped, and replacement operations recognize their canonical replacement.

## Commands

```bash
skipo adopt .
skipo inspect .
skipo diagnose .
skipo plan .
skipo add auth
skipo add workspace
skipo add service storage
skipo add service midi
skipo add ui settings
skipo remove capability-name
skipo sync .
skipo update .
skipo repair .
skipo verify .
skipo test .
```

## Canonical ownership

- Floks owns reusable UI implementations.
- Kloks owns reusable backend services.
- Luth remains the authentication authority.
- Skipo owns application composition, migration state, generated wiring and verification.
- ATAX owns agent coordination and persistent work state; Skipo does not manage agents.

## Safety and compatibility

Repair never deletes arbitrary application code. A duplicate is retired only when a capability registry entry explicitly identifies the file/pattern as safe to replace. Unknown or app-specific code remains protected. Migration contracts describe old/new dependency state, API/configuration changes, deprecated patterns and canonical replacements; deterministic handlers perform the declared transformations, repairs and verification.
