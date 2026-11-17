---
name: backend-provider-interfaces
description: Abstract provider interfaces for Decoupled Data Providers and Storage Providers.
---

# DECOUPLED DATA & STORAGE PROVIDER INTERFACES

## 1. FORMAL COMPOSITION

$$\text{WorkspaceBackend} = \text{DataProvider} \oplus \text{StorageProvider}$$

$$\begin{array}{ll}
\mathbf{Pr_1} \text{ (No Direct Vendor SDKs)} & \forall m \in \text{BusinessLogic}: m \cap \{\text{aws-sdk}, \text{sqlite3}, \text{pg}\} = \emptyset \\
\mathbf{Pr_2} \text{ (Factory Resolution)} & \text{Driver} = \text{WorkspaceBackendFactory.create}(\text{config})
\end{array}$$

## 2. DRIVER TAXONOMY & TESTING

| Provider Category | Supported Drivers | Protocol |
| :--- | :--- | :--- |
| **Data Providers** | SQLite (WAL), Postgres, Supabase, Turso (LibSQL), Mongo Atlas | Local POSIX, Pooler, HTTP REST |
| **Storage Providers** | Filesystem, AWS S3 / R2 / MinIO, Vercel Blob, Supabase Storage | Local POSIX, Presigned URLs, Edge CDN |

```typescript
const backend = WorkspaceBackendFactory.create({
  database: { type: "turso", endpoint: "https://my-db.turso.io", authToken: "..." },
  storage: { type: "vercel_blob", token: "..." }
});
const { ok, latencyMs } = await backend.data.testConnection();
```
