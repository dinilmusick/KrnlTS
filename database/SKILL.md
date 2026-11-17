---
name: database-multi-engine-guidelines
description: Directives for multi-engine database support, Settings modal, live connection testing, and IDatabaseAdapter interface.
---

# MULTI-ENGINE DATABASE ARCHITECTURE GUIDELINES

## 1. FORMAL ADAPTER INTERFACE

$$\text{DBProviders} = \{\text{sqlite}, \text{postgres}, \text{firebase}, \text{mongodb}, \text{custom}\}$$

$$\forall m \in \text{Features}: m \xrightarrow{\text{calls}} \text{IDatabaseAdapter} \quad (\text{Zero Vendor Lock-in})$$

```typescript
export interface IDatabaseAdapter {
  connect(cfg: DatabaseConfiguration): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number }>;
  query<T>(queryObj: QueryDefinition): Promise<T>;
  execute(commandObj: CommandDefinition): Promise<ExecutionResult>;
}
```

## 2. CONNECTION TESTING PROTOCOL

- **Endpoint**: `POST /api/database/test` $\to$ `{ success: boolean, latencyMs: number, engine: DBProvider }`
- **Settings Tab**: `SettingsModal.tsx` $\to$ live status badges (Active/Connecting/Error) + monochromatic cards.

## 3. CANONICAL SYSTEM DATABASE SCHEMA

All ecosystem engines (DEPM, SRKL, Skipo) connect to the 3-tier Postgres infrastructure and maintain five canonical tables:

$$\text{SystemTables} = \{\text{ultrst-users}, \text{ultrst-apps}, \text{ultrst-credentials}, \text{ultrst-system-buckets}, \text{ultrst-srkl-deployments}\}$$

1. **`ultrst-users`**: Unified ecosystem user authentication, progressive trust level, and app profiles.
2. **`ultrst-apps`**: Registered ecosystem applications and their supported service definitions.
3. **`ultrst-credentials`**: Master system administrator credentials (`admin_email`, `admin_password`).
4. **`ultrst-system-buckets`**: System asset storage bucket configurations with `is_primary` flag and optional fallbacks.
5. **`ultrst-srkl-deployments`**: Central directory of active SRKL deployment endpoints for service account federation.

