# Data Providers (`src/krnl/backend/providers/data/`)

## 1. Directory Purpose & Architectural Role
Implements `IWorkspaceDataProvider` drivers for relational, document, and embedded databases.

## 2. File Manifest
| File | Responsibility |
| :--- | :--- |
| `SQLiteDataProvider.ts` | Local filesystem SQLite data provider with WAL mode, file locking, and JSON-backed indexing. |
| `PostgresDataProvider.ts` | PostgreSQL provider with connection pooling and SSL enforcement. |
| `SupabaseDataProvider.ts` | Supabase PostgREST client with query filtering and CRUD operations. |
| `PocketBaseDataProvider.ts` | PocketBase REST collections client with filter and sorting support. |
| `FirebaseDataProvider.ts` | Firebase Firestore REST client with bidirectional type conversion. |

## 3. Data Flow
- Called by `FunctionalityTable` to execute low-level CRUD queries against target databases.
