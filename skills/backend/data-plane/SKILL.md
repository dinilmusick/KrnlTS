---
name: backend-data-plane
description: Workspace Data Plane directives: 3 Storage Modes (Local Filesystem, Local-Hosted Backend, Remote-Hosted Backend) and multi-tenant partitioning strategies.
---

# WORKSPACE DATA PLANE — PROJECT DATA & STORAGE MODES

The Workspace Data Plane contains the actual project files, documents, records, database models, and media assets. Each workspace independently specifies and operates its own Data Plane.

---

## 1. The 3 Fundamental Storage Modes

$$\text{Workspace Data Plane} \in \{ \text{Mode 1 (Local FS)}, \; \text{Mode 2 (Local-Hosted)}, \; \text{Mode 3 (Remote-Hosted)} \}$$

```
WORKSPACE DATA PLANE
│
├── Mode 1: LOCAL FILESYSTEM       (Zero-cloud, local SQLite + Local Directory)
│
├── Mode 2: LOCAL-HOSTED BACKEND   (Local network / Docker, http://localhost:XXXX)
│
└── Mode 3: REMOTE-HOSTED BACKEND  (Cloud SaaS / BaaS, https://backend.example.com)
```

---

## 2. Mode 1 — Local Filesystem (Local-First)

```
workspace/
├── database.sqlite       → Structured project data, relations, metadata
└── storage/
    ├── documents/        → PDF, markdown, JSON records
    ├── images/           → PNG, JPEG, SVG, WebP
    ├── audio/            → WAV, MP3, FLAC
    ├── videos/           → MP4, WebM
    └── other/            → Raw binaries, archives
```

### Invariants & Guarantees
- **Zero Cloud**: Works 100% without internet connection, API keys, or cloud accounts.
- **Self-Contained**: Moving or archiving the workspace folder preserves complete data integrity.
- **SQLite Optimization**: Always enable Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and Foreign Key enforcement (`PRAGMA foreign_keys = ON;`).

---

## 3. Mode 2 — Local-Hosted Backend

```
APPLICATION
     │
     └── http://localhost:XXXX  (or LAN http://192.168.1.X:XXXX)
                    │
                    ▼
          Local BaaS / Backend
          ├── Database  (Local PostgreSQL / SQLite)
          └── Storage   (Local File Store / MinIO)
```

### Invariants & Guarantees
- Backends may run in Docker, a local service, or another machine on the local area network.
- The application interfaces with the local backend using standard HTTP/REST or WebSocket adapters.
- Port, hostname, and local auth tokens are stored in the workspace's `BackendConnectionConfig`.

---

## 4. Mode 3 — Remote-Hosted Backend

```
APPLICATION
     │
     └── https://backend.example.com (HTTPS / WSS / TLS)
                    │
                    ▼
          Remote Cloud BaaS
          ├── Database  (Supabase Cloud, Remote Postgres, Firebase)
          └── Storage   (AWS S3, Supabase Storage, Cloudflare R2)
```

### Invariants & Guarantees
- **Protocol Parity**: Mode 2 (Local-Hosted) and Mode 3 (Remote-Hosted) use the **same provider driver logic**.
- The only distinction is the endpoint URI (`http://localhost...` vs `https://cloud...`), TLS/SSL certificates, and cloud API tokens.

---

## 5. Multi-Tenancy Storage Strategies

The Data Plane abstraction supports both physical and logical isolation:

### Strategy 1: Physical Data Separation (Isolated Databases)
- Each workspace maintains a separate physical database file (`workspace-a/database.sqlite`, `workspace-b/database.sqlite`) or a separate dedicated schema/database instance.
- **Benefit**: Zero risk of cross-workspace data contamination, trivial backup/export.

### Strategy 2: Logical Data Separation (Shared Multi-Tenant Database)
- Multiple workspaces store records in a single shared database.
- **Invariant**: Every table schema must index `workspace_id` and apply Row-Level Security (RLS) or repository-level filtering:
  ```sql
  SELECT * FROM documents WHERE workspace_id = $1 AND id = $2;
  ```
- **Benefit**: Lower resource overhead, centralized indexing.
