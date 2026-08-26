---
name: backend-provider-interfaces
description: Abstract provider interfaces for Decoupled Data Providers and Storage Providers, normalized connection schemas, Turso LibSQL, Mongo Atlas, Vercel Blob, and runtime adapter patterns.
---

# DECOUPLED DATA & STORAGE PROVIDER INTERFACES

The application must **never** scatter vendor-specific SDK calls across business logic. All database and file operations flow through decoupled provider abstractions.

---

## 1. Provider Decoupling Principle

$$\text{WorkspaceBackend} = \text{DataProvider (Structured Records)} \oplus \text{StorageProvider (Binary Blobs/Media)}$$

```
WORKSPACE BACKEND
│
├── DATA PROVIDER     → SQLite (WAL) | PostgreSQL | Supabase DB | Turso (LibSQL) | MongoDB Atlas | PocketBase | Firebase
│
└── STORAGE PROVIDER  → Local Filesystem | Supabase Storage | AWS S3 / R2 / MinIO | Vercel Blob | PocketBase Storage
```

---

## 2. Supported Engine Taxonomy

| Engine Type | Driver / Class | Transport / Protocol | Key Features |
| :--- | :--- | :--- | :--- |
| **SQLite** | `SQLiteDataProvider` | Local C/POSIX File | WAL mode, atomic file locks, zero external servers |
| **PostgreSQL** | `PostgresDataProvider` | TCP / Connection Pool | Strict SSL, connection pooling, enterprise ACID |
| **Supabase** | `SupabaseDataProvider` | HTTP PostgREST API | Cloud relational, edge auth, REST filtering |
| **Turso (LibSQL)** | `TursoLibSQLDataProvider` | HTTP /v2/pipeline | Edge-distributed SQLite, ultra-low latency |
| **MongoDB Atlas** | `MongoAtlasDataProvider` | HTTP Data API | Serverless NoSQL document store, dynamic schemas |
| **PocketBase** | `PocketBaseDataProvider` | HTTP Collections API | Self-hosted embedded SQLite + auth + storage |
| **Firebase** | `FirebaseDataProvider` | HTTP Firestore REST | Document collections, real-time sync |
| **Filesystem** | `FilesystemStorageProvider` | Local POSIX FS | Atomic file writes under `./storage/` |
| **S3 / R2** | `S3StorageProvider` | AWS S3 REST API | Global blob storage, presigned URLs |
| **Vercel Blob** | `VercelBlobStorageProvider` | Vercel Blob REST API | Serverless edge CDN file hosting |
| **Supabase Storage** | `SupabaseStorageProvider` | Supabase Storage REST | S3-compatible cloud bucket storage |

---

## 3. Factory Resolution & Connection Testing

```typescript
import { WorkspaceBackendFactory } from "@dinilmusick/krnlts";

// 1. Instantiate backend
const backend = WorkspaceBackendFactory.create({
  id: "workspace-turso",
  provider: "turso",
  mode: "remote",
  database: { type: "turso", endpoint: "https://my-db.turso.io", authToken: "..." },
  storage: { type: "vercel_blob", token: "..." }
});

// 2. Test live connection latency
const test = await backend.data.testConnection();
console.log(`Latency: ${test.latencyMs}ms, Connected: ${test.ok}`);
```
