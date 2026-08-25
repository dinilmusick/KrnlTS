# TASK: BACKEND_AND_STORAGE_PROTOCOL (UNIVERSAL_BACKEND)
$ARCH := \text{ControlPlane} \otimes \text{WorkspaceDataPlane} \otimes \text{AppLogic}
ASSERT(\text{UserAccountStorage} \cap \text{WorkspaceDataStorage} = \emptyset)

## 1. IN-CODE UTILITY DOCUMENTATION, SECTION DEMARCATION & NAMING RULES
- **Naming**: Use long, descriptive names for all database tables, storage buckets, and provider classes (e.g., `UserWorkspaceMetadataStorageProvider.ts`).
- **Docblocks**: Document the utility of all data structures, credentials, and storage interfaces with ASCII flow charts showing data persistence paths.
- **Section Demarcation**: Partition imports, schemas, connection configurations, and CRUD operations with bold borders `// ══════════════════════════════════════════════════════════════════════════════════════════`.

## 2. CONTROL_PLANE SETUP (User Accounts & Workspaces)
Let $CP = \langle \text{ControlPlaneManager}, \text{AdminGuard}, \text{AccountProvider} \rangle$:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. CONTROL PLANE INITIALIZATION & AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════════════════
import { ControlPlaneManager, AdminGuard } from "@dinilmusick/krnlts";

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * UTILITY: LocalSQLiteControlPlaneInitialization
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Initializes the local control plane, authenticates administrative accounts,
 *          and validates session tokens.
 *
 * Flow Chart:
 *   [User Credentials] ───► [Authenticate] ───► [Generate Token: "sess::<userId>::..."]
 *                                                      │
 *                                                      ▼
 *                                            [AdminGuard Role Check] ───► [Grant Access]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
const controlPlaneManager = ControlPlaneManager.createLocal("./accounts.sqlite");
const authenticatedSession = await controlPlaneManager.login({ username: "admin", password: "pwd" });

// Strict Admin Gate: throws [AccessDenied] if session is null or role != "ADMIN"
await AdminGuard.verify(authenticatedSession.token, controlPlaneManager.accountProvider);
```

## 3. WORKSPACE DATA PLANE & STORAGE MODES
Resolve storage mode $M \in \{ \text{Mode 1 (Local FS)}, \text{Mode 2 (Local BaaS)}, \text{Mode 3 (Cloud BaaS)} \}$:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 2. WORKSPACE BACKEND FACTORY RESOLUTION
// ══════════════════════════════════════════════════════════════════════════════════════════
import { WorkspaceBackendFactory } from "@dinilmusick/krnlts";

// Mode 1: Zero-Cloud Local SQLite + Filesystem
const localWorkspaceBackend = WorkspaceBackendFactory.createLocal("./workspace.sqlite", "./storage");

// Mode 2 / Mode 3: Decoupled Data & Storage Providers (Postgres / Supabase / PocketBase / Firebase / S3)
const cloudWorkspaceBackend = WorkspaceBackendFactory.create({
  id: "cloud-workspace",
  provider: "supabase", // "sqlite" | "postgres" | "supabase" | "pocketbase" | "firebase"
  mode: "remote_hosted",
  database: { type: "supabase", endpoint: "https://xyz.supabase.co", apiKey: "..." },
  storage: { type: "supabase_storage", bucket: "media", endpoint: "...", apiKey: "..." }
});
```

## 4. FUNCTIONALITY DEDICATED TABLE & CREDENTIAL CASCADING
1. **Parent Entity Configures Backend Once**:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 3. ENTITY-LEVEL CREDENTIAL CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════════════════
systemEntity.configureBackend({
  defaultService: "sqlite",
  sqlite: { type: "sqlite", filePath: "./data.sqlite", enableWAL: true },
  supabase: { type: "supabase", endpoint: "...", apiKey: "..." }
});
```
2. **Child Functionalities Declare Flag (Auto Table Binding)**:
```typescript
// ══════════════════════════════════════════════════════════════════════════════════════════
// 4. ATOMIC FUNCTIONALITY WITH DEDICATED TABLE
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * FUNCTIONALITY: ManageUserPreferencesFunctionality
 * ──────────────────────────────────────────────────────────────────────────────────────────
 * Purpose: Handles user settings persistence with automatic table creation & CRUD methods.
 *
 * Flow Chart:
 *   [Incoming Preferences] ───► [L1: Validate] ───► [L2: table.upsert()] ───► [Return Record]
 * ──────────────────────────────────────────────────────────────────────────────────────────
 */
export const ManageUserPreferencesFunctionality = new krnlLocalFunctionality({
  id: "manage_user_preferences",
  backend: "sqlite", // Inherits credentials from hostEntity.getBackendCredentials("sqlite")
  api: async (input, { table }) => {
    // Built-in CRUD methods: find, findOne, create, insert, update, delete, upsert, count, query, clear
    const preferenceRecord = await table.upsert({ userId: input.userId, theme: input.theme }, "userId");
    const totalPreferencesCount = await table.count();
    return { preferenceRecord, totalPreferencesCount };
  }
});
```
