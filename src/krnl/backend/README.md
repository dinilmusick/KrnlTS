# Universal Backend Module (`src/krnl/backend/`)

## 1. Directory Purpose & Architectural Role
This directory implements the **Universal Backend Architecture**, decoupling the Control Plane (user identities, tokens, admin barriers, and workspace descriptors) from the Workspace Data Plane across 3 deployment modes (Mode 1 Local FS, Mode 2 Local BaaS, Mode 3 Cloud BaaS).

## 2. Subdirectory & File Manifest
| File / Directory | Responsibility |
| :--- | :--- |
| [`control_plane/`](./control_plane/README.md) | Identity management (`LocalSQLiteAccountProvider`, `HostedAccountProvider`, `AdminGuard`, `ControlPlaneManager`). |
| [`providers/`](./providers/README.md) | Concrete implementations of decoupled `IWorkspaceDataProvider` and `IStorageProvider`. |
| `FunctionalityTable.ts` | The built-in CRUD engine bound to functionalities via `context.table` (`find`, `findOne`, `create`, `insert`, `update`, `delete`, `upsert`, `count`, `query`, `clear`). |
| `WorkspaceBackendFactory.ts` | Resolves unified backend instances and handles multi-environment provider switching. |
| `types.ts` | Core TypeScript interfaces and type definitions for the backend ecosystem. |
| `index.ts` | Public barrel export file for the backend module. |

## 3. Data Flow
- Parent entities configure credentials via `entity.configureBackend(...)`.
- Child functionalities declare flags (`backend: "sqlite"` | `"supabase"`) $\implies$ auto-bound to `FunctionalityTable` instances.
- Handlers execute CRUD directly against `context.table` with zero boilerplate connection code.
