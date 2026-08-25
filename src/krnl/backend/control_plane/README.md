# Control Plane Suite (`src/krnl/backend/control_plane/`)

## 1. Directory Purpose & Architectural Role
Encapsulates account provisioning, user identity authentication, session token verification, role-based authorization barriers, and workspace descriptor registries.

## 2. File Manifest
| File | Responsibility |
| :--- | :--- |
| `LocalSQLiteAccountProvider.ts` | Zero-cloud local JSON/SQLite control plane storing accounts, password hashes, and workspace descriptors with safe `sess::<id>::<time>::<rand>` tokens. |
| `HostedAccountProvider.ts` | Remote HTTP client for cloud authentication services (e.g. Supabase/PostgreSQL Auth). |
| `AdminGuard.ts` | Strict authorization barrier checking session validities and enforcing `role === "ADMIN"` with `[AccessDenied]` exceptions. |
| `ControlPlaneManager.ts` | High-level coordinator for login, token verification, and user-to-workspace resolution. |

## 3. Data Flow
- Incoming client auth requests pass through `ControlPlaneManager`.
- Admin endpoints invoke `AdminGuard.verify(token, accountProvider)` prior to executing privileged operations.
