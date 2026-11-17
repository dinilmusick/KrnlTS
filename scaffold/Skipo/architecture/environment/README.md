# Canonical Skipo environment contract

The authoritative classification registry is `architecture/environment/contract.json`.

## Framework contract

- Required: `SYSTEM_DATABASE_URL`
- Optional: `SYSTEM_DATABASE_URL_2`, `SYSTEM_DATABASE_URL_3`
- Application origin: `APP_URL`

A deprecated name is migrated only when the registry provides a canonical target. The current compatibility mapping is `DEPM_GATEWAY_DOMAIN → APP_URL`.

## Classification

1. **Canonical** — accepted as declared.
2. **Known deprecated alias** — planned for deterministic rename to its canonical target.
3. **Known obsolete framework variable** — must have a safe declared target; otherwise repair is blocked for manual review.
4. **Undeclared configuration** — blocking violation; repair does not mutate any file while an undeclared name remains.
5. **Explicitly supported product/tooling configuration** — preserved only when listed in the registry or matched by an explicitly declared platform pattern.

Product-specific additions must include a short ownership rationale in the registry. Do not add broad prefix wildcards for application settings.

## Coverage

The scanner includes environment files, scaffold templates, runtime and source references, build/deployment/CI configuration, generated configuration, tests and concrete fixtures, plus fenced configuration examples in documentation. It excludes dependency trees, caches and compiled build output. Test implementation strings and negative assertions are not treated as live runtime references; concrete configuration fixtures under test directories remain in scope.

## Maintenance commands

- `skipo diagnose` reports environment findings alongside capability findings.
- `skipo plan` emits deterministic migration actions and fail-closed conflicts.
- `skipo repair` applies only safe, registry-backed migrations, then verifies.
- `skipo verify` independently checks the canonical environment invariant.

The full-system validator enforces the same contract as blocking Aspect 26. A repair is not successful unless the post-repair verification passes.
