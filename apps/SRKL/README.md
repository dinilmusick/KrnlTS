# Srkl Engine

Srkl Engine is an autonomous service orchestration and cloud storage management hub supporting provider bridging (Backblaze B2, Gemini, GitHub, Vercel), modular multi-plane architecture, and DeaTS-standardized preemptive discovery APIs.

---

## 🚀 Deployment Guide & Build Commands

Srkl Engine is configured for multi-target deployment, supporting fullstack environments (Vercel Serverless / Node.js Express) and edge runtimes (Cloudflare Workers).

### 1. Vercel Deployment (Fullstack Vite SPA + Serverless Functions)

Vercel hosts the Vite client single-page application and serverless API handlers in `/api`.

- **Framework Preset**: `Vite` (or `Other`)
- **Root Directory**: `./`
- **Build Command**:
  ```bash
  npm run build:fullstack
  ```
  *(Runs `vite build`, builds `dist/server.cjs`, and bundles the Vercel serverless adapter `api/index.js`).*
- **Output Directory**: `dist`
- **Install Command**:
  ```bash
  npm install
  ```

#### Environment Variables Architecture:
All service connection credentials (Backblaze B2 keys, GitHub tokens, custom endpoints) and workspace configurations are **user-owned** and stored dynamically in the user account object inside the system database (`appProfiles.srkl.storage_connections` / service definitions). They are fetched per authenticated session and never configured as global cloud environment variables.

The only required server environment variables are:
- `DATABASE_URL`: System database connection string (PostgreSQL / Neon).
- `JWT_SECRET`: Secret for signing session and auth tokens.
- `PORT`: (Optional, defaults to 3001).

---

### 2. Cloudflare Workers Deployment (Edge API Worker)

Compiles the backend API into a single, standalone edge worker compatible with Cloudflare runtime.

- **Deploy via Wrangler CLI**:
  ```bash
  npx wrangler deploy
  ```
- **Manual Build Command**:
  ```bash
  npm run build:api
  ```
- **Worker Entrypoint**: `dist/api/worker/index.js`
- **Configuration File**: [`wrangler.toml`](./wrangler.toml)

#### Wrangler Configuration Reference:
```toml
name = "srkl-engine"
main = "api/index.js"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build:api"

[vars]
API_ENV = "cloudflare"
BUILD_TARGET = "api"
```

---

### 3. Local Development (Express + Vite)

```bash
# 1. Install dependencies
npm install

# 2. Start fullstack server (Express API + Vite middleware)
npm run dev
# App will run at http://localhost:3001
```

---

### 4. Build & Validation Scripts Reference

| Command | Target | Purpose |
| :--- | :--- | :--- |
| `npm run build:fullstack` | Vercel / Node.js | Compiles Vite frontend, Node.js server, and Vercel serverless adapter |
| `npm run build:api` | Cloudflare Workers | Bundles standalone edge worker (`dist/api/worker/index.js`) |
| `npm run build:all` | All Platforms | Builds both fullstack and standalone edge API targets |
| `npm run validate:fullstack` | Quality Gate | Typechecks fullstack codebase |
| `npm run validate:api` | Quality Gate | Typechecks standalone edge API target (`tsconfig.api.json`) |
| `npm test` | Test Suite | Runs API security governance and progressive trust session tests |

