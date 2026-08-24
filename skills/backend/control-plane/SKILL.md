---
name: backend-control-plane
description: Control Plane directives: User Accounts, Authentication, Workspace Registry, Admin Control, and strict authorization boundary enforcement.
---

# CONTROL PLANE — APPLICATION IDENTITY & CONFIGURATION

The Control Plane is the application-owned, globally scoped governance system. It strictly manages *who* uses the application, *what* they are permitted to do, and *which* backend connections their workspaces attach to.

---

## 1. Core Responsibilities & Boundary Invariant

$$\text{Control Plane} \cap \text{Workspace Data Plane} = \emptyset$$

```
CONTROL PLANE (Application-Owned)
│
├── User Accounts & Identity
├── Authentication & Session Tokens
├── User Profiles & Roles (USER vs ADMIN)
├── Workspace Registry & Ownership Mappings
├── Backend Connection Configurations
└── System-Wide Admin Settings
```

> [!IMPORTANT]
> The Control Plane **never** contains project documents, database records of a workspace, or user media files. It contains metadata and connection pointers only.

---

## 2. Account Backend Storage Modes

The Control Plane supports two interchangeable storage strategies:

### Mode A: Local SQLite Account Backend (`accounts.sqlite`)
- **Use Case**: Offline-first, Desktop (Tauri/Electron), CLI, Single-tenant or local multi-user machines.
- **Storage**: `~/.config/app/accounts.sqlite` or `<app_root>/accounts.sqlite`.
- **Fields**:
  ```sql
  CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT CHECK(role IN ('USER', 'ADMIN')) NOT NULL DEFAULT 'USER',
    profile_json TEXT,
    created_at INTEGER NOT NULL
  );
  ```

### Mode B: Hosted Account Backend (PostgreSQL / Supabase / Auth Service)
- **Use Case**: Web applications, Vercel Serverless deployments, team collaboration.
- **Storage**: Remote PostgreSQL database, Supabase Auth, or OAuth / OIDC identity provider.
- **Invariant**: The application's account database is completely separate from any individual user's workspace database.

---

## 3. User $\to$ Workspace Resolution Mapping

$$\text{User} \xrightarrow{\text{owns}} \{ \text{Workspace}_1 \to \text{BackendConfig}_1, \; \text{Workspace}_2 \to \text{BackendConfig}_2, \dots \}$$

```typescript
export interface WorkspaceRegistryEntry {
  workspaceId: string;
  userId: string;
  workspaceName: string;
  backendConfigId: string;
  isDefault: boolean;
  createdAt: number;
}
```

### Resolution Flow
1. User authenticates via Control Plane (`IAccountProvider.authenticate()`).
2. Control Plane retrieves user session and associated workspace registry records.
3. For the active workspace, the application retrieves its `BackendConnectionConfig`.
4. The application instantiates the matching `IWorkspaceBackend` without modifying the global Control Plane.

---

## 4. Admin Control Plane vs User Scope

Configuration scopes must never be intermixed:

| Scope | Ownership | Configurable Settings | Prohibited Access |
| :--- | :--- | :--- | :--- |
| **System Admin** | Application-wide / Root | Active account backend, global default providers, allowed endpoints, system telemetry, audit logs | Cannot modify private workspace file payloads without explicit ownership |
| **Normal User** | User / Workspace | Workspace backend selection, custom BaaS credentials for workspace, workspace UI preferences | Cannot alter system account database, system providers, or other users' configs |

---

## 5. Strict Admin Authorization Invariant

> [!CAUTION]
> Admin access must be enforced strictly at the backend API route / handler boundary, never merely by hiding or disabling UI controls.

```typescript
// Strict Boundary Guard Pattern
export async function requireAdmin(req: Request, ctx: AppContext): Promise<AdminSession> {
  const session = await ctx.accountProvider.verifySession(req.headers.get("Authorization"));
  
  if (!session) {
    throw new HttpError(401, "Unauthorized: Authentication token missing or expired.");
  }
  
  if (session.role !== "ADMIN") {
    ctx.logger.warn(`Security Violation: User ${session.userId} attempted admin access to ${req.url}`);
    throw new HttpError(403, "Forbidden: Administrative privileges required.");
  }
  
  return session as AdminSession;
}
```
