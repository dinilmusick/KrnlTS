# Storage Providers (`src/krnl/backend/providers/storage/`)

## 1. Directory Purpose & Architectural Role
Implements `IStorageProvider` drivers for binary assets, documents, and media uploads.

## 2. File Manifest
| File | Responsibility |
| :--- | :--- |
| `FilesystemStorageProvider.ts` | Zero-cloud local filesystem storage under `./storage` using `KrnlFS`. |
| `SupabaseStorageProvider.ts` | Supabase Storage bucket client with public & authenticated URL resolution. |
| `S3StorageProvider.ts` | S3-compatible client supporting AWS S3, MinIO, and Cloudflare R2. |
| `PocketBaseStorageProvider.ts` | PocketBase file upload and record attachment driver. |
| `FirebaseStorageProvider.ts` | Firebase Cloud Storage REST driver. |

## 3. Data Flow
- Receives Buffers, strings, or streams, uploads them to target buckets/directories, and returns canonical public access URLs.
