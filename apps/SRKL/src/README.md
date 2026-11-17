# Source Core Directory (`src/`)

## Architectural Role
Houses the entire core application implementation for SRKL Engine, spanning the frontend React single-page application and the backend Express runtime server.

## Layers
1. **Frontend UI Components (`src/components/`)**:
   - `AppShell/`: TopToolbar, BottomStrip, and root layout shell.
   - `Dashboard/`: Service overview, health indicators, and active service tiles.
   - `Services/`: Service configuration forms, credential management, endpoints, and cloud interfaces (Backblaze B2, GitHub, Vercel, Google AI Studio).
   - `Settings/`: Workspace storage configuration, appearance, ergonomics, and system preferences.
   - `Admin/`: Ecosystem database cluster monitoring and audit trails.
   - `common/`: Atomic UI primitives and brutalist design components.
2. **Context & State (`src/context/`)**:
   - `HubContext.tsx`: Universal workspace, service, and session persistence context.
3. **Core Abstractions (`src/core/`)**:
   - `ServiceResource.ts`, `ServiceAccount.ts`, `ServiceProvider.ts`: Domain models.
4. **Backend Server & Storage (`src/server/`)**:
   - `AppFactory.ts`: Express application bootstrap and middleware composition.
   - `db.ts`: PostgreSQL pool connecting to universal ecosystem `ultrst-users` table.
   - `storage/`: Encrypted SQLite workspace vault coordinator (`cryptoVault.ts`, `sqliteWorkspaceManager.ts`, `cloudStorageService.ts`, `workspaceLogService.ts`).
   - `routes/`: REST API endpoints for authentication, workspaces, services, and telemetry.
