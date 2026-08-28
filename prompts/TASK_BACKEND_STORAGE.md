# TASK: BACKEND_AND_STORAGE_PROTOCOL (PURE_FILESYSTEM_WORKSPACE_STORAGE)
$ARCH := \text{ControlPlane (Auth Only)} \otimes \text{WorkspaceStorage (Filesystem Only)} \otimes \text{AppLogic}
ASSERT(\text{WorkspaceData} \equiv \text{FilesystemHierarchy}) \quad \land \quad ASSERT(\text{WorkspaceData} \cap \text{SQL/NoSQL Database} = \emptyset)

## 0. MANDATORY ARCHITECTURAL PRINCIPLES (MUST READ FIRST)
1. **NO DATABASES FOR USER WORKSPACES**:
   - User workspace data (documents, projects, settings, notes, tracks, media) MUST NEVER use database engines (No SQLite, No PostgreSQL, No MongoDB, No Turso, No DynamoDB).
   - User workspace data is **STRICTLY FILE-BASED**, organized in directories and files (`.json`, `.md`, binary files) mimicking a local filesystem.
   - The ONLY internal database permitted in the system is a lightweight SQLite file dedicated exclusively to the Control Plane for user accounts (`accounts.sqlite`).
2. **USER STORAGE PROVIDERS (VIRTUAL FILESYSTEM ADAPTERS)**:
   $$\text{StorageProviders} \in \{ \text{Local FS}, \text{iCloud Drive}, \text{Google Drive}, \text{OneDrive}, \text{Supabase Storage / S3}, \text{Firebase Storage} \}$$
   - All providers implement the unified `WorkspaceStorageAdapter` contract mimicking a native OS filesystem.
3. **APPLICATION ACCESS VIA `WorkspaceFS`**:
   - Application logic reads and writes files **exclusively** through `WorkspaceFS` (e.g., `fs.write("vault/doc1.json", data)`, `fs.read("vault/doc1.json")`).
   - `SyncEngine` asynchronously replicates file mutations from Primary Storage to configured Backup Storage replicas (e.g., Google Drive, iCloud, OneDrive).

---

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING
- **Naming**: Use long, descriptive names for all classes and files (e.g., `UserWorkspaceFileStorageCoordinator.ts`, `ICloudWorkspaceStorageAdapter.ts`).
- **Docblocks**: Document the utility of all functions and storage interfaces with ASCII flow charts showing file persistence and replication paths.
- **Section Demarcation**: Partition imports, types, filesystem operations, and exports with bold borders `// ══════════════════════════════════════════════════════════════════════════════════════════`.

---

## 2. CONTROL PLANE SETUP (USER ACCOUNTS & AUTH ONLY)
Control Plane manages global user accounts, authentication tokens, and app-scoped workspace registries:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. CONTROL PLANE & USER ACCOUNT AUTHENTICATION (INTERNAL ACCOUNTS ONLY)
// ══════════════════════════════════════════════════════════════════════════════════════════
import { LocalSQLiteAccountProvider } from "@dinilmusick/krnlts";

// 1. Initialize Account Provider (stores ONLY user credentials & workspace configs)
const accountProvider = new LocalSQLiteAccountProvider("./accounts.sqlite");

// 2. Authenticate User Session
const authSession = await accountProvider.authenticate({ username: "dinil", password: "pwd" });

// 3. Resolve App-Scoped User Context & Workspace Order
const appCtx = await accountProvider.getAppUserContext(authSession.userId, "MY_APP");
```

---

## 3. WORKSPACE VIRTUAL FILESYSTEM & MULTI-CLOUD ADAPTERS
All workspace data is stored as files and directories across Local, iCloud, Google Drive, OneDrive, Supabase Storage, or Firebase Storage:

```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. WORKSPACE SPECIFICATION, FILESYSTEM (WorkspaceFS) & SYNC ENGINE
// ══════════════════════════════════════════════════════════════════════════════════════════
import {
  WorkspaceRuntime,
  StorageAdapterFactory,
  Workspace,
  WorkspaceFS,
  SyncEngine
} from "@dinilmusick/krnlts";

// 1. Define Workspace with Primary (Local / iCloud) + Backups (Google Drive / OneDrive / Supabase)
const workspaceSpec: Workspace = {
  id: "ws_user_vault_01",
  name: "Personal Workspace",
  primaryStorage: {
    id: "ep_local_or_icloud",
    provider: "icloud", // "local" | "icloud" | "google_drive" | "onedrive" | "supabase_storage" | "firebase_storage"
    configuration: { provider: "icloud" },
    enabled: true,
    status: "CONNECTED",
    syncState: "SYNCED"
  },
  backupStorages: [
    {
      id: "ep_gdrive_backup",
      provider: "google_drive",
      configuration: { provider: "google_drive", accountId: "user_google", rootFolderId: "root" },
      enabled: true,
      status: "CONNECTED"
    },
    {
      id: "ep_onedrive_backup",
      provider: "onedrive",
      configuration: { provider: "onedrive", accountId: "user_ms", rootFolderId: "root" },
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

// 4. Promote Backup to Primary (e.g. switch working copy to Google Drive)
await runtime.changePrimary("ep_gdrive_backup");

// 5. Restore from Backup if needed (Explicit & Non-Destructive)
const restoreResult = await runtime.syncEngine.restore(workspaceSpec.backupStorages[0]);
```

---

## 4. ZERO-LEAK UI & ANTI-COPY INVARIANTS (MANDATORY IN ALL UI CODE)
1. **Zero Leakage of Backend / System Jargon in UI**:
   $$\text{RenderedUI} \cap \{ \text{"Control Plane"}, \text{"Data Plane"}, \text{"RBAC"}, \text{"Storage Adapter"}, \text{"SyncEngine"}, \text{"WorkspaceFS"}, \text{"Cluster"}, \text{"Failover"}, \text{"Endpoint ID"} \} = \emptyset$$
   - Technical terms belong exclusively in backend classes and in-code comments.
   - User-facing UI MUST render ONLY high-level, human-friendly terms (e.g., "Account", "Workspaces", "Storage", "Google Drive", "iCloud", "OneDrive", "Local", "Replicas").
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
3. **ADD Storage Provider Selection**: Allow users to select their storage endpoint (Local, iCloud, Google Drive, OneDrive, Supabase Storage, Firebase Storage) inside Settings or Workspace creation modal.
4. **Preserve Existing UI**: Keep user workflows intact; do not introduce complex architectural widgets into the main app view.
