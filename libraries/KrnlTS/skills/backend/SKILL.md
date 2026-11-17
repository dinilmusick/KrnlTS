---
name: universal-backend-router
description: Universal Backend Architecture master router for multi-environment hosting (Local Desktop, LAN/Docker, Remote/Vercel Serverless) with decoupled Control Plane vs Workspace Data Plane, independent Data/Storage providers, and strict Admin authorization.
---

# UNIVERSAL BACKEND ARCHITECTURE SUB-ROUTER

## 0. INVIOLABLE BACKEND STRUCTURAL LAWS (ENFORCE BEFORE EVERY FILE WRITE)

### LAW A: Top-Level Entry File Purity
```
BACKEND TOP-LEVEL FILES = { server.ts, index.ts, app.ts, main.ts, entry.ts }

THESE FILES MUST CONTAIN ONLY:
  ✓ Import statements (factories, providers, configuration loaders)
  ✓ A single startup/bootstrap call (e.g., createApp().listen(PORT))
  ✓ Optionally: environment variable reads for port/host

ABSOLUTELY FORBIDDEN:
  ✗ Route handler definitions (app.get(), router.post(), etc.)
  ✗ Middleware registration (app.use(...))
  ✗ Business logic, database queries, or service instantiation inline
  ✗ More than ~10 lines of non-import, non-bootstrap code

CANONICAL VALID server.ts:
  import { createApp } from "./app/AppFactory";
  const app = createApp();
  app.listen(process.env.PORT ?? 3000);

CANONICAL VALID AppFactory.ts:
  import express from "express";
  import { applyMiddleware } from "./middleware/applyMiddleware";
  import { mountRoutes } from "./routes/mountRoutes";
  export function createApp() {
    const app = express();
    applyMiddleware(app);
    mountRoutes(app);
    return app;
  }
```

### LAW B: One Module Per File
```
Every .ts backend file exports exactly ONE primary module:
  ONE service class  |  ONE controller  |  ONE router factory  |  ONE utility

FORBIDDEN:
  ✗ Multiple service classes in one file
  ✗ Multiple express Router definitions in one file
  ✗ Mixed service + controller logic in one file

DECOMPOSITION PATTERN (when a controller/service grows):
  users/
    UsersController.ts       ← route handlers only, delegates to service
    UsersService.ts          ← business logic, calls repository
    UsersRepository.ts       ← database queries only
    users.routes.ts          ← router factory, mounts controller methods
    users.types.ts           ← shared interfaces/types
    users.validators.ts      ← zod/joi schemas for request validation
```

### LAW C: 200-Line Maximum (Backend = Same as Frontend)
```
HARD LIMIT: 200 lines per .ts file — no exceptions.
At 180 lines → split into sub-modules.
Applies to: controllers, services, repositories, route files, middleware, utilities.
```

---

Architectural standard for constructing portable, scalable, environment-agnostic backends capable of running seamlessly on local runtimes (Node.js, Electron, Tauri), local-network services (Docker, LAN, self-hosted BaaS), or cloud serverless environments (Vercel, Supabase, AWS, Cloudflare).

---

## 1. Core Principle & Cardinal Rule

$$\text{Backend} = \text{Control Plane} \oplus \text{Workspace Data Plane} \oplus \text{Application Logic}$$

$$\text{Control Plane (User Accounts/Auth/Config)} \cap \text{Data Plane (Workspace Data/Media)} = \emptyset$$

```
APPLICATION
│
├── 1. CONTROL PLANE
│      ├── User Accounts
│      ├── Authentication
│      ├── Admin Configuration
│      └── Backend Connections
│
├── 2. WORKSPACE DATA PLANE
│      ├── Project Data
│      ├── Metadata
│      └── Media / Large Files
│
└── 3. APPLICATION LOGIC
       └── Uses the above through provider interfaces
```

> [!IMPORTANT]
> **The Cardinal Rule**: User-account storage and workspace/project storage are distinct, decoupled systems. The application must **never** assume that the database used for user accounts is also the database used for a user’s workspace.

---

## 2. Backend Sub-Skill Routing Table

| Sub-Domain | Target Sub-Skill | Scope & Key Directives Covered | Trigger Keywords |
| :--- | :--- | :--- | :--- |
| **Control Plane & Auth** | [`control-plane/SKILL.md`](./control-plane/SKILL.md) | User accounts (Local SQLite vs Hosted BaaS), Auth/Tokens, Workspace registry, User $\to$ Workspace resolution, Admin authorization boundaries | `control_plane`, `user_accounts`, `auth_provider`, `admin_security`, `workspace_registry`, `user_resolution` |
| **Workspace Storage & Sync** | [`workspace-storage/SKILL.md`](./workspace-storage/SKILL.md) | Pure Virtual Filesystem (NO user databases), Decoupled WorkspaceStorageAdapters (Local, iCloud, Google Drive, OneDrive, Supabase, Firebase), WorkspaceFS, SyncEngine | `workspace_storage_spec`, `workspace_fs`, `sync_engine`, `primary_storage`, `backup_storage`, `icloud_storage`, `multi_cloud_sync`, `storage_adapters` |
| **Workspace Data Plane** | [`data-plane/SKILL.md`](./data-plane/SKILL.md) | 3 Workspace storage modes (Mode 1: Local FS, Mode 2: Local-Hosted LAN/Docker, Mode 3: Remote Cloud BaaS), Multi-tenancy strategies | `data_plane`, `workspace_storage`, `mode_1_local`, `mode_2_local_hosted`, `mode_3_remote`, `sqlite_fs`, `storage_modes` |
| **Decoupled Providers** | [`providers/SKILL.md`](./providers/SKILL.md) | Independent `IDataProvider` vs `IStorageProvider`, `IWorkspaceBackend`, normalized `BackendConnectionConfig`, Factory resolution | `backend_providers`, `data_provider`, `storage_provider`, `backend_connection_config`, `provider_interfaces` |
| **Environment Hosting** | [`environments/SKILL.md`](./environments/SKILL.md) | Vercel Serverless / Edge hosting, Connection pooling, SSL, Local Desktop (Tauri/Electron), Docker / LAN ingress & CORS | `vercel_backend`, `serverless_hosting`, `desktop_runtime`, `docker_lan`, `connection_pooling`, `ssl_enforce` |

---

## 3. The 3 Fundamental Workspace Storage Modes

```
       Mode 1: Local FS                 Mode 2: Local-Hosted                Mode 3: Remote-Hosted
   ┌──────────────────────┐           ┌──────────────────────┐            ┌──────────────────────┐
   │      Workspace       │           │      Workspace       │            │      Workspace       │
   │  ┌────────────────┐ │           │  ┌────────────────┐ │            │  ┌────────────────┐ │
   │  │ database.sqlite│ │           │  │ http://local.. │ │            │  │ https://cloud..│ │
   │  ├────────────────┤ │           │  ├────────────────┤ │            │  ├────────────────┤ │
   │  │ /storage/media │ │           │  │ Local Supabase │ │            │  │ Remote Supabase│ │
   │  └────────────────┘ │           │  └────────────────┘ │            │  └────────────────┘ │
   └──────────────────────┘           └──────────────────────┘            └──────────────────────┘
```

1. **Mode 1 — Local Filesystem**: Local-first, `database.sqlite` + `./storage/`. Zero cloud, zero external servers.
2. **Mode 2 — Local-Hosted Backend**: Connected to local network/Docker backend (`http://localhost:XXXX` or LAN IP).
3. **Mode 3 — Remote-Hosted Backend**: Cloud backend (`https://backend.example.com`). Identical provider interface as Mode 2.

---

## 4. Complete Backend Architecture Matrix

$$\begin{array}{|c|c|l|}
\hline
\textbf{Account Backend} & \textbf{Workspace Backend} & \textbf{Deployment / Target Use Case} \\
\hline
\text{Local SQLite} & \text{Local FS + SQLite} & \text{Fully offline desktop / local-first} \\
\text{Local SQLite} & \text{Local Supabase / BaaS} & \text{Local identity + local containerized BaaS} \\
\text{Local SQLite} & \text{Remote Supabase / S3} & \text{Local identity + cloud-backed workspace} \\
\text{Hosted PostgreSQL} & \text{Local FS + SQLite} & \text{Cloud identity + local cached/hybrid workspace} \\
\text{Hosted PostgreSQL} & \text{Local BaaS (LAN)} & \text{Enterprise SSO + on-prem LAN storage} \\
\text{Hosted Supabase / Auth} & \text{Remote Supabase / S3} & \text{Fully cloud-hosted / Vercel Serverless} \\
\hline
\end{array}$$

---

## 5. Canonical Mental Model

```
                         APPLICATION
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
          CONTROL PLANE                DATA PLANE
                │                           │
          "WHO?" / "HOW?"              "WHAT?"
                │                           │
        ┌───────┴────────┐          ┌───────┴────────┐
        │                │          │                │
     Accounts          Admin      Database         Storage
        │                │          │                │
   Local SQLite      Protected   SQLite/Postgres   Files/S3/
   Hosted DB         Control     /Supabase/etc.    Supabase/etc.
```

---

## 6. Pre-Flight Project Classification Checklist

Before implementing backend logic for any application or sub-app, execute this classification:

1. **Classify Account System**:
   - [ ] Local SQLite (`accounts.sqlite`)
   - [ ] Hosted BaaS / PostgreSQL / Supabase Auth
2. **Classify Workspace Data**:
   - [ ] Local SQLite per workspace
   - [ ] Local-Hosted BaaS (LAN/Docker)
   - [ ] Remote Cloud BaaS (Supabase / Postgres)
3. **Classify File / Media Storage**:
   - [ ] Local Filesystem (`./storage`)
   - [ ] S3-Compatible Object Store (AWS / Cloudflare R2 / MinIO)
   - [ ] Supabase Storage
4. **Classify Hosting Environment**:
   - [ ] Local Desktop / Electron / Tauri
   - [ ] Node.js Dedicated Container
   - [ ] Vercel Serverless / Edge Function (Stateless DB connection pooling + SSL required)

---

## 7. Zero-Leak UI & Anti-Copy Invariants (Frontend Governance)

1. **Zero Leakage of Backend / System Jargon in UI**:
   $$\text{RenderedUI} \cap \{ \text{"Control Plane"}, \text{"Data Plane"}, \text{"RBAC"}, \text{"Storage Adapter"}, \text{"SyncEngine"}, \text{"WorkspaceFS"}, \text{"Cluster"}, \text{"Failover"}, \text{"Endpoint ID"} \} = \emptyset$$
   - Backend terms ("Control Plane", "Data Plane", "Storage Adapter", "SyncEngine", "WorkspaceFS", etc.) MUST NEVER be rendered as user-facing headers, labels, or UI views.
   - Use high-level, human-friendly terms ("Account", "Workspaces", "Storage", "Google Drive", "Local", "Replicas").
2. **Zero On-Screen Instructional / Promotional Text**:
   - FORBID direct text descriptions, tutorial paragraphs, marketing copy, or "how-to" guidance rendered into the UI viewport.
   - The UI must be quiet, minimal, and unobtrusive.
3. **Strict Icon-Only Buttons (Zero Text Labels on Buttons)**:
   - Buttons MUST NOT render text labels directly on their surface.
   - Buttons contain strictly monochromatic vector/SVG icons.
   - All button labels, action descriptions, and keyboard shortcuts appear **exclusively on hover tooltips**.
