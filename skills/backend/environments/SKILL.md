---
name: backend-environment-hosting
description: Deployment and hosting directives for running backends across Vercel Serverless / Edge, Local Desktop (Node, Tauri, Electron), and self-hosted LAN / Docker.
---

# MULTI-ENVIRONMENT HOSTING DIRECTIVES

Guidelines for ensuring backend code is portable, stateless where necessary, and properly adapted to Vercel Serverless, Local Desktop, or LAN/Docker deployments.

---

## 1. Hosting Target Matrix

$$\begin{array}{|l|l|l|l|}
\hline
\textbf{Target Platform} & \textbf{Data Provider Strategy} & \textbf{Storage Strategy} & \textbf{Key Environment Nuances} \\
\hline
\textbf{Vercel Serverless} & \text{PostgreSQL / Supabase (SSL)} & \text{S3 / Supabase / R2} & \text{Stateless, Connection Pooling, Env Vars} \\
\textbf{Local Desktop (Node/Tauri)} & \text{SQLite (WAL mode)} & \text{Local Filesystem} & \text{Zero-network, relative paths, file locks} \\
\textbf{Docker / LAN Self-Hosted} & \text{PocketBase / Local Postgres} & \text{Local FS / MinIO} & \text{Port binding, CORS headers, LAN IP discovery} \\
\hline
\end{array}$$

---

## 2. Vercel Serverless & Cloud Hosting Invariants

When deploying backends to Vercel, Next.js API routes, or Cloudflare Workers:
1. **Stateless Functions**: Serverless functions can spin up and tear down at any time. Never rely on in-memory global state across requests.
2. **Database Connection Pooling**: Direct PostgreSQL connections can quickly exhaust database pool limits under traffic spikes. Always use a connection pooler (e.g. Supabase Transaction Pooler / PgBouncer / Prisma Accelerate / Neon Serverless Driver).
3. **SSL Enforcement**: Remote Postgres connections must enforce `ssl: { rejectUnauthorized: false }` or appropriate CA certificate validation.
4. **Environment Variables & Infrastructure Credential Invariant**:
   - Applications strictly possess ONLY `SYSTEM_DATABASE_URL_1`, `SYSTEM_DATABASE_URL_2`, and `SYSTEM_DATABASE_URL_3`.
   - Secondary and tertiary database URLs are optional redundant fallbacks.
   - All system-level infrastructure credentials—including the **System Bucket** link/credentials and **admin email/password**—are stored directly in the system database inside the `ultrst_credentials` table. Zero external bucket or admin env vars are used.
5. **No Ephemeral Local Disk for Persistence**: `/tmp` is ephemeral and lost between cold starts. All persistent workspace files must be directed to cloud object storage.

---

## 3. Local Desktop (Electron / Tauri / Node) Invariants

When running backends locally on the user's workstation:
1. **Zero-Network Fallback**: The app must boot, read user accounts from `accounts.sqlite`, and open workspaces using `database.sqlite` + `./storage` without checking the internet.
2. **Path Resolution**: Use normalized local paths (e.g., `path.resolve(appDataDir, "workspaces", workspaceId)`).
3. **SQLite WAL Mode**:
   ```typescript
   db.pragma("journal_mode = WAL");
   db.pragma("synchronous = NORMAL");
   db.pragma("foreign_keys = ON");
   ```
4. **Desktop Native APIs**: In Tauri or Electron, leverage local IPC or native FS bridges when serving media files to UI views without HTTP overhead.

---

## 4. Self-Hosted LAN & Docker Invariants

When deploying backends on local network hardware (NAS, Raspberry Pi, home server, Docker container):
1. **CORS & Ingress**: Configure allowed origins dynamically to allow UI clients connecting via `http://localhost:XXXX` or `http://192.168.x.x:XXXX`.
2. **Binding Address**: Ensure services bind to `0.0.0.0` instead of `127.0.0.1` when exposure across LAN is required.
3. **Service Discovery**: Support simple health checks at `/api/health` and latency testing via `/api/database/test`.
