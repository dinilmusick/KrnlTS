# Backend Providers (`src/krnl/backend/providers/`)

## 1. Directory Purpose & Architectural Role
Contains modular, decoupled database and storage engine adapters that satisfy the `IWorkspaceDataProvider` and `IStorageProvider` contracts.

## 2. Subdirectories
| Subdirectory | Focus Area |
| :--- | :--- |
| [`data/`](./data/README.md) | Structured data persistence drivers (SQLite, PostgreSQL, Supabase, PocketBase, Firebase). |
| [`storage/`](./storage/README.md) | Binary blob and file media storage drivers (Filesystem, Supabase Storage, S3/MinIO, PocketBase Storage, Firebase Storage). |

## 3. Guarantees
- **Zero-Lockin**: Swapping from Mode 1 Local SQLite to Mode 3 Supabase requires zero code changes in functionalities; only backend configuration is updated.
