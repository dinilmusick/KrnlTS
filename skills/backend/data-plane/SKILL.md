---
name: backend-data-plane
description: Workspace Data Plane directives: 3 Storage Modes (Local Filesystem, Local-Hosted Backend, Remote-Hosted Backend), Multi-Engine Support (Turso, MongoDB, Postgres, Supabase, SQLite, Vercel Blob), and Fallback Credential Cascades.
---

# WORKSPACE DATA PLANE — PROJECT DATA, ENGINES & FAILOVER CASCADES

The Workspace Data Plane contains the actual project files, documents, records, database models, and media assets. Each workspace independently specifies and operates its own Data Plane across pluggable engines.

---

## 1. Supported Data & Storage Engines

$$\text{DataEngines} = \{ \text{SQLite (WAL)}, \text{PostgreSQL}, \text{Supabase}, \text{Turso (LibSQL)}, \text{MongoDB Atlas}, \text{PocketBase}, \text{Firebase}, \text{Custom REST} \}$$

$$\text{StorageEngines} = \{ \text{POSIX Filesystem}, \text{AWS S3}, \text{Supabase Storage}, \text{Vercel Blob}, \text{PocketBase Storage}, \text{Firebase Storage} \}$$

---

## 2. The 3 Fundamental Storage Modes

$$\text{Workspace Data Plane} \in \{ \text{Mode 1 (Local FS)}, \; \text{Mode 2 (Local-Hosted)}, \; \text{Mode 3 (Remote-Hosted)} \}$$

```
WORKSPACE DATA PLANE
│
├── Mode 1: LOCAL FILESYSTEM       (Zero-cloud, local SQLite + Local Storage Directory)
│
├── Mode 2: LOCAL-HOSTED BACKEND   (LAN / Docker, http://localhost:XXXX, Turso local, PocketBase)
│
└── Mode 3: REMOTE-HOSTED BACKEND  (Cloud BaaS: Supabase, Turso Cloud, MongoDB Atlas, Vercel Blob)
```

---

## 3. Fallback Resolution Cascade (`resolveCredentialsCascade`)

When executing database operations, the system resolves connection credentials via a prioritized fallback cascade:

$$\text{ResolvedConfig} = \begin{cases}
\text{Feature-Level Explicit Credentials} & \text{if } f.\text{credentials} \neq \emptyset \\
\text{Host Entity Workspace Config} & \text{else if } E.\text{configuredBackend}(f.\text{service}) \neq \emptyset \\
\text{Local SQLite / POSIX Storage} & \text{otherwise (Zero-Failure Fallback)}
\end{cases}$$

```typescript
import { WorkspaceBackendFactory } from "@dinilmusick/krnlts";

// Automatic cascade resolution with safe local SQLite fallback
const credentials = WorkspaceBackendFactory.resolveCredentialsCascade(
  featureConfig,
  entitySettings,
  { type: "sqlite", filePath: "./workspace.sqlite", enableWAL: true }
);
```

---

## 4. Functionality Tables (One-Table-Per-Domain)

Core data domains (e.g. Document Vault, Knowledge Graph, Media Vault, Semantic Tags, Cache) query the active data-plane configuration dynamically through `context.table`:

```typescript
export const DocumentVaultFunctionality = new krnlLocalFunctionality({
  id: "document_vault",
  backend: "turso", // Pluggable: "turso" | "supabase" | "sqlite" | "mongodb"
  api: async (input, { table }) => {
    // Built-in CRUD methods: find, findOne, create, insert, update, delete, upsert, count, query, clear
    const doc = await table.upsert({ id: input.docId, title: input.title, content: input.content }, "id");
    return { status: "success", doc };
  }
});
```
