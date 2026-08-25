```markdown
# TASK: BACKEND_AND_STORAGE_PROTOCOL (UNIVERSAL_BACKEND)
$ARCH := \text{ControlPlane} \otimes \text{WorkspaceDataPlane} \otimes \text{AppLogic}
ASSERT(\text{UserAccountStorage} \cap \text{WorkspaceDataStorage} = \emptyset)

## 1. CONTROL_PLANE SETUP (User Accounts & Workspaces)
Let $CP = \langle \text{ControlPlaneManager}, \text{AdminGuard}, \text{AccountProvider} \rangle$:
```typescript
import { ControlPlaneManager, AdminGuard } from "@dinilmusick/krnlts";

// Local SQLite or Hosted Cloud Account Provider
const controlPlane = ControlPlaneManager.createLocal("./accounts.sqlite");

// Authentication & Tokens: format -> "sess::<userId>::<timestamp>::<random>"
const session = await controlPlane.login({ username: "admin", password: "pwd" });

// Strict Admin Gate: throws [AccessDenied] if session is null or role != "ADMIN"
await AdminGuard.verify(session.token, controlPlane.accountProvider);
```

## 2. WORKSPACE DATA PLANE & MODES
Resolve storage mode $M \in \{ \text{Mode 1 (Local FS)}, \text{Mode 2 (Local BaaS)}, \text{Mode 3 (Cloud BaaS)} \}$:
```typescript
import { WorkspaceBackendFactory } from "@dinilmusick/krnlts";

// Mode 1: Zero-Cloud Local SQLite + Filesystem
const backend = WorkspaceBackendFactory.createLocal("./workspace.sqlite", "./storage");

// Mode 2 / Mode 3: Decoupled Data & Storage Providers (Postgres / Supabase / PocketBase / Firebase / S3)
const cloudBackend = WorkspaceBackendFactory.create({
  id: "cloud-workspace",
  provider: "supabase", // "sqlite" | "postgres" | "supabase" | "pocketbase" | "firebase"
  mode: "remote_hosted",
  database: { type: "supabase", endpoint: "https://xyz.supabase.co", apiKey: "..." },
  storage: { type: "supabase_storage", bucket: "media", endpoint: "...", apiKey: "..." }
});
```

## 3. FUNCTIONALITY DEDICATED TABLE & CREDENTIAL CASCADING
1. **Parent Entity Configures Backend Once**:
```typescript
entity.configureBackend({
  defaultService: "sqlite",
  sqlite: { type: "sqlite", filePath: "./data.sqlite", enableWAL: true },
  supabase: { type: "supabase", endpoint: "...", apiKey: "..." }
});
```
2. **Child Functionalities Declare Flag (Auto Table Binding)**:
```typescript
export const myAction = new krnlLocalFunctionality({
  id: "user_preferences",
  backend: "sqlite", // Inherits credentials from hostEntity.getBackendCredentials("sqlite")
  api: async (input, { table }) => {
    // Built-in CRUD methods: find, findOne, create, insert, update, delete, upsert, count, query, clear
    const pref = await table.upsert({ userId: input.userId, theme: input.theme }, "userId");
    const count = await table.count();
    return { pref, count };
  }
});
```

## 4. STORAGE PROVIDER OPERATIONS
```typescript
const { url, size } = await backend.storage.uploadFile("docs/report.pdf", pdfBuffer, "application/pdf");
const buffer = await backend.storage.downloadFile("docs/report.pdf");
const publicUrl = backend.storage.getPublicUrl("docs/report.pdf");
await backend.storage.deleteFile("docs/report.pdf");
```
```
