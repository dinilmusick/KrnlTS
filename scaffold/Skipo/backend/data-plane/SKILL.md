---
name: backend-data-plane
description: Directives for Workspace Data Plane, 3 storage modes, pluggable engines, and fallback cascades.
---

# WORKSPACE DATA PLANE — ENGINES & FAILOVER CASCADES

## 1. ENGINES & MODES

$$\text{DataPlane} \in \{\text{Mode}_1 \text{ (Local FS/SQLite)}, \text{Mode}_2 \text{ (Local LAN/Docker)}, \text{Mode}_3 \text{ (Remote Cloud)}\}$$

$$\text{Engines}_{\text{DB}} = \{\text{SQLite (WAL)}, \text{PostgreSQL}, \text{Supabase}, \text{Turso}, \text{MongoDB Atlas}, \text{PocketBase}\}$$

$$\text{Engines}_{\text{Blob}} = \{\text{POSIX FS}, \text{AWS S3}, \text{Supabase Storage}, \text{Vercel Blob}, \text{PocketBase Storage}\}$$

## 2. FALLBACK RESOLUTION CASCADE

$$\text{Config}_{\text{resolved}} = \begin{cases}
f.\text{credentials}, & f.\text{credentials} \neq \emptyset \\
E.\text{backend}(f.\text{service}), & E.\text{backend}(f.\text{service}) \neq \emptyset \\
\text{LocalSQLite(WAL)}, & \text{otherwise (Zero-Failure Invariant)}
\end{cases}$$

## 3. UNIFIED TABLE CRUD DRIVER

```typescript
// All functionalities execute via context.table with real drivers
export const DocumentVault = new krnlLocalFunctionality({
  id: "document_vault",
  backend: "turso", // Pluggable driver
  api: async (input, { table }) => ({
    doc: await table.upsert({ id: input.id, title: input.title }, "id")
  })
});
```
