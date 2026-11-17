# Multi-Environment Hosting Directives

## Standard Skipo application environment

The canonical application contract is intentionally small:

- APP_URL — application origin; optional where the platform supplies an equivalent canonical origin.
- SYSTEM_DATABASE_URL — mandatory system database connection.
- SYSTEM_DATABASE_URL_2 / SYSTEM_DATABASE_URL_3 — optional fallback system database connections.
- DEPM_GATEWAY_DOMAIN — DEPM-Engine only exception.

All other application environment variables are allowed but strongly discouraged. The Skipo runtime-environment validator reports ENV-001 warnings for them rather than failing validation. This preserves a controlled escape hatch for genuinely necessary integrations without allowing application-specific environment contracts to become the default.

Prefer storing service URLs, provider configuration, and mutable runtime settings in the system database or the appropriate runtime settings/credential store.

## Serverless execution constraints

E5 (Strict Env Governance): AppEnvVars SHOULD be a subset of {APP_URL, SYSTEM_DATABASE_URL, SYSTEM_DATABASE_URL_2, SYSTEM_DATABASE_URL_3}. DEPM_GATEWAY_DOMAIN is an explicit DEPM-Engine-only exception. Any other variable is a governance warning, not a hard failure.

## Desktop local SQLite contract

```typescript
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
```
