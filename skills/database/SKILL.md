---
name: database-multi-engine-guidelines
description: Directives for multi-engine database support (SQLite, PostgreSQL/Supabase, Firebase, MongoDB Atlas, Custom REST), Settings modal configuration, and live connection testing.
---

# MULTI-ENGINE DATABASE ARCHITECTURE GUIDELINES

## 1. DATABASE CONFIGURATION PANEL (`DATABASE & HYBRID`)
- **Settings Modal Component**: Dedicated database tab in `SettingsModal.tsx`.
- **Runtime Environment Indicator**:
  - `Local Desktop` (Desktop runtime / Electron / Tauri / Node.js)
  - `Vercel Serverless` (Cloud serverless / edge runtime)
- **Visual Feedback**:
  - Real-time connection status badges (Active, Connecting, Error, Offline).
  - Provider selection cards styled with locked theme and monochromatic icons.

---

## 2. MULTI-ENGINE ADAPTER SPECIFICATION
```typescript
type DatabaseProviderType = "sqlite" | "postgres" | "firebase" | "mongodb" | "custom";

interface DatabaseConfiguration {
  provider: DatabaseProviderType;
  sqlite?: {
    vaultPath: string;            // e.g., "./docustack_vault/docustack.db"
    enableWAL: boolean;           // Write-Ahead Logging toggle
  };
  postgres?: {
    connectionMode: "uri" | "discrete";
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl: boolean;                 // SSL enforcement for Supabase / Vercel
  };
  firebase?: {
    projectId: string;
    apiKey: string;
  };
  mongodb?: {
    connectionString: string;     // MongoDB Atlas URI
    databaseName: string;
  };
  custom?: {
    endpointUrl: string;          // REST Proxy URL
    bearerToken: string;
  };
}
```

---

## 3. LIVE CONNECTION TESTING PROTOCOL
```
Endpoint: POST /api/database/test
Payload : DatabaseConfiguration

Response:
  success  : boolean
  latencyMs: number
  message  : string
  details  : { version?: string, engine: DatabaseProviderType }
```
- **Action**: "TEST DB CONNECTION" button in Settings panel.
- **Behavior**: Executes an on-demand ping verifying credentials, network reachability, and schema access.
- **Feedback**: Displays non-blocking real-time feedback banner with latency metrics ($t_{\text{ping}} < 300\,\text{ms}$).

---

## 4. ADAPTER INTEGRATION & INTERFACE
```typescript
interface IDatabaseAdapter {
  connect(config: DatabaseConfiguration): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number }>;
  query<T>(queryObj: QueryDefinition): Promise<T>;
  execute(commandObj: CommandDefinition): Promise<ExecutionResult>;
}
```
- All feature layers MUST interact with `IDatabaseAdapter` abstractions, ensuring zero vendor lock-in to a single storage engine.
