# TASK: BACKEND_AND_STORAGE_PROTOCOL (PURE_FILESYSTEM_WORKSPACE_STORAGE)
$ARCH := \text{ControlPlane (Auth Only)} \otimes \text{WorkspaceStorage (Filesystem Only)} \otimes \text{AppLogic}$
$ASSERT(\text{WorkspaceData} \equiv \text{FilesystemHierarchy}) \quad \land \quad ASSERT(\text{WorkspaceData} \cap \text{SQL/NoSQL Database} = \emptyset)$

> **EXCLUSIVE SCOPE**: This prompt owns **workspace filesystem storage, multi-cloud adapters (Local FS, B2, R2, S3), `WorkspaceFS`, `SyncEngine`, and Control Plane database separation**. Auth token sessions belong to `TASK_SECURITY_AND_SESSION_INFRASTRUCTURE.md`.
>
> **Validator**: `python3 assistant.py validate . --aspect aspect_07`
>
> **INVIOLABLE MANDATE: ZERO-TRACE LEGACY STORAGE PURGE ($\mathbf{L_{21}}$)**:
> Completely purge any competing legacy storage systems found in the codebase (e.g. SQLite databases storing user docs, local mock JSON databases, bespoke S3 wrappers, or legacy file persistence modules). Leave zero trace behind. Workspace storage must strictly and exclusively run on Skipo's canonical `WorkspaceFS` and multi-cloud adapters.

1. **NO DATABASES FOR USER WORKSPACES**:
   - User workspace data (documents, projects, settings, notes, tracks, media) MUST NEVER use database engines (No SQLite, No PostgreSQL, No MongoDB, No Turso, No DynamoDB).
   - User workspace data is **STRICTLY FILE-BASED**, organized in directories and files (`.json`, `.md`, binary files) mimicking a local filesystem.
2. **ZERO-DIVERGENCE CONTROL PLANE & ZERO LOCAL CREDENTIAL STORING**:
   - The Control Plane (user accounts, authentication, workspace registries) is strictly powered by environment-configured database clusters (Neon Serverless Postgres via `@neondatabase/serverless`, Supabase, or Cloud PostgreSQL).
   - **STRICT PROHIBITION**: NEVER create local-only SQLite databases (`accounts.sqlite`), ephemeral `/tmp` files, or redundant local files storing credentials.
   - Environment variables (`.env.local` locally, Vercel/Cloud variables in production) are the **sole authoritative source of truth** (`NEON_DATABASE_URL`, `SUPABASE_URL`, `POSTGRES_DATABASE_URL`).
   - If no database is configured, both local dev and production must report the exact same standby state: `System Backend Database (Awaiting .env)`.
3. **USER STORAGE PROVIDERS (VIRTUAL FILESYSTEM ADAPTERS)**:
   $$\text{StorageProviders} \in \{ \text{Local FS}, \text{Backblaze B2}, \text{Cloudflare R2}, \text{Supabase Storage}, \text{AWS S3} \}$$
   - All providers implement the unified `WorkspaceStorageAdapter` contract mimicking a native OS filesystem.
4. **APPLICATION ACCESS VIA `WorkspaceFS`**:
   - Application logic reads and writes files **exclusively** through `WorkspaceFS` (e.g., `fs.write("vault/doc1.json", data)`, `fs.read("vault/doc1.json")`).
   - `SyncEngine` asynchronously replicates file mutations from Primary Storage to configured Backup Storage replicas (e.g., Backblaze B2, Cloudflare R2, Supabase, AWS S3).
5. **STANDALONE APPS VIA `@skipo/backend`**:
   - In standalone applications, import directly from `@skipo/backend`:
     `import { BaseAccountProvider, LocalAccountProvider } from '@skipo/backend/auth';`
     `import { WorkspaceFS, SyncEngine } from '@skipo/backend/workspace';`
     `import { StorageAdapterFactory, LocalFSAdapter, S3Adapter } from '@skipo/backend/storage';`

---

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING
- **Naming**: Use long, descriptive names for all classes and files (e.g., `UserWorkspaceFileStorageCoordinator.ts`, `LocalFileSystemWorkspaceStorageAdapter.ts`).
- **Docblocks**: Document the utility of all functions and storage interfaces with ASCII flow charts showing file persistence and replication paths.
- **Section Demarcation**: Partition imports, types, filesystem operations, and exports with bold borders `// ══════════════════════════════════════════════════════════════════════════════════════════`.

---

## 2. CONTROL PLANE SETUP (USER ACCOUNTS & AUTH ONLY)
Control Plane manages global user accounts, authentication tokens, and app-scoped workspace registries via persistent environment-configured clusters:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. CONTROL PLANE & USER ACCOUNT AUTHENTICATION (ENVIRONMENT-DRIVEN CLUSTER)
// ══════════════════════════════════════════════════════════════════════════════════════════
import { getControlPlaneManager } from "@/lib/control-plane";
import { authenticateUserAsync, registerUserAsync } from "@/lib/auth-storage";

// 1. Resolve Control Plane Manager (strictly driven by NEON_DATABASE_URL / env vars)
const controlPlane = getControlPlaneManager();

// 2. Authenticate User Session (verified directly against Neon/Cloud Postgres)
const { user, token } = await authenticateUserAsync("user@example.com", "secure_password");

// 3. Resolve Active User Workspaces
console.log("Active Workspaces:", user.workspaces);
```

---

## 3. WORKSPACE VIRTUAL FILESYSTEM & MULTI-CLOUD ADAPTERS
All workspace data is stored as files and directories across Local FS, Backblaze B2, Cloudflare R2, Supabase Storage, or AWS S3:

```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. WORKSPACE SPECIFICATION, FILESYSTEM (WorkspaceFS) & SYNC ENGINE
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  WorkspaceVirtualFileSystemRuntime,
  WorkspaceFS,
} from "@/lib/WorkspaceVirtualFileSystemRuntime";
import { WorkspaceSyncReplicationEngine } from "@/lib/WorkspaceSyncReplicationEngine";
import { LocalFileSystemWorkspaceStorageAdapter } from "@/lib/LocalFileSystemWorkspaceStorageAdapter";
import { SupabaseWorkspaceStorageAdapter } from "@/lib/SupabaseWorkspaceStorageAdapter";
import { WorkspaceDataPlaneConfig } from "@/lib/control-plane-types";

// 1. Define Workspace with Primary (Local FS) + Backups (Backblaze B2 / Supabase Storage)
const workspaceSpec: any = {
  id: "ws_user_vault_01",
  name: "Personal Workspace",
  primaryStorage: {
    id: "ep_local_disk",
    provider: "local_fs", // "local_fs" | "backblaze_b2" | "cloudflare_r2" | "supabase_storage" | "aws_s3"
    configuration: { provider: "local_fs" },
    enabled: true,
    status: "CONNECTED",
    syncState: "SYNCED"
  },
  backupStorages: [
    {
      id: "ep_b2_backup",
      provider: "backblaze_b2",
      configuration: { provider: "backblaze_b2", bucketName: "user-vault", endpoint: "s3.us-east-005.backblazeb2.com" },
      enabled: true,
      status: "CONNECTED"
    },
    {
      id: "ep_supabase_backup",
      provider: "supabase_storage",
      configuration: { provider: "supabase_storage", bucketName: "user-vault" },
      enabled: true,
      status: "CONNECTED"
    }
  ],
  sync: {
    enabled: true,
    mode: "on_write",
    conflictStrategy: "primary_wins",
    deletePropagation: true,
    retry: { maxAttempts: 3, backoffMs: 1000 },
    verification: { verifyChecksums: true }
  },
  preferences: {},
  metadata: {},
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// 2. Instantiate Workspace Runtime container
const runtime = await WorkspaceRuntime.create(workspaceSpec);

// 3. Application interacts EXCLUSIVELY via WorkspaceFS (Filesystem calls only)
// Write Document File (JSON / Text / Binary)
await runtime.filesystem.write("documents/project_brief.json", JSON.stringify({
  id: "doc_101",
  title: "Project Brief",
  content: "Architecture specifications..."
}));

// Read Document File
const fileContent = await runtime.filesystem.readText("documents/project_brief.json");
const documentData = JSON.parse(fileContent);

// List Files & Folders in Workspace
const filesList = await runtime.filesystem.list("documents");

// Delete File (propagates to backups if deletePropagation is true)
await runtime.filesystem.delete("documents/old_draft.json");

// 4. Promote Backup to Primary (e.g. switch working copy to Backblaze B2)
await runtime.changePrimary("ep_b2_backup");

// 5. Restore from Backup if needed (Explicit & Non-Destructive)
const restoreResult = await runtime.syncEngine.restore(workspaceSpec.backupStorages[0]);
```

---

## 4. ZERO-LEAK UI & ANTI-COPY INVARIANTS (MANDATORY IN ALL UI CODE)
1. **Zero Leakage of Backend / System Jargon in UI**:
   $$\text{RenderedUI} \cap \{ \text{"Control Plane"}, \text{"Data Plane"}, \text{"RBAC"}, \text{"Storage Adapter"}, \text{"SyncEngine"}, \text{"WorkspaceFS"}, \text{"Cluster"}, \text{"Failover"}, \text{"Endpoint ID"} \} = \emptyset$$
   - Technical terms belong exclusively in backend classes and in-code comments.
   - User-facing UI MUST render ONLY high-level, human-friendly terms (e.g., "Account", "Workspaces", "Storage", "Local Folder", "Backblaze B2", "Cloudflare R2", "Supabase", "Replicas").
   - NEVER create UI views or modals titled with backend jargon.
2. **Zero On-Screen Instructional / Promotional Text**:
   - FORBID direct text descriptions, tutorial paragraphs, marketing copy, or "how-to" guidance rendered into the UI viewport.
   - The UI must be quiet, minimal, and unobtrusive.
3. **Strict Icon-Only Buttons (Zero Text Labels on Buttons)**:
   - Buttons MUST NOT render text labels directly on their surface.
   - Buttons contain strictly monochromatic vector/SVG icons.
   - All button labels, action descriptions, and keyboard shortcuts appear **exclusively on hover tooltips**.
4. **Subtle Neo-Brutalist Tactile Glow**:
   - Apply subtle ambient glow (`box-shadow: 0 0 10px var(--krnl-accent-glow)` or `0 0 12px rgba(212, 163, 89, 0.22)`) on hover and active borders, preserving crisp Neo-Brutalist borders.

---

## 5. APP REFACTORING PROTOCOL (REMOVE DATABASES, USE STORAGE ONLY)
$$\Delta(\text{BusinessLogic}) = 0 \quad \land \quad \Delta(\text{UserExperience}) = 0$$
When refactoring an existing application:
1. **REMOVE Database Tables & Queries**: Remove all SQLite, PostgreSQL, MongoDB, or ORM tables used for storing user data.
2. **REPLACE with `WorkspaceFS`**: Persist all user items (documents, notes, assets, state) as `.json` or binary files using `runtime.filesystem.write()` / `read()`.
3. **ADD Storage Provider Selection**: Allow users to select their storage endpoint (Local Folder, Backblaze B2, Cloudflare R2, Supabase Storage, AWS S3) inside Settings or Workspace creation modal.
4. **Preserve Existing UI**: Keep user workflows intact; do not introduce complex architectural widgets into the main app view.
