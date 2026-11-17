# Deployment Guide

This application uses the **Skipo Universal Build System**. One build command, any platform.

## Quick Start

```bash
npm run build
```

The build system automatically detects the framework (Vite SPA + Express / Serverless) and builds the configured deployment target.

---

## Deployment Targets

| Target | What it builds | Primary Use Case |
|--------|---------------|------------------|
| `fullstack` | Complete application (Vite Client SPA + Vercel Serverless Function + Node Server) | Default. Human users accessing via web browser. |
| `api` | Headless Worker (`httpsAdapter.ts`) | Standalone programmatic API gateway. Zero UI assets. |

---

## Configuration

### 1. Repository Default (`package.json`)

Configure the default deployment target in `package.json`:

```json
{
  "name": "srkl-engine",
  "skipo": {
    "deploy": "fullstack"
  }
}
```

This target is built automatically when no `DEPLOY_TARGET` environment variable is defined.

### 2. Platform Override (`DEPLOY_TARGET` Environment Variable)

To override the target on specific platforms, set `DEPLOY_TARGET` in the host dashboard:

| Platform | Dashboard Location | Value | Result |
|----------|-------------------|-------|--------|
| **Vercel** | Project Settings &rarr; Environment Variables | `DEPLOY_TARGET=fullstack` | Fullstack Vite + Serverless deployment |
| **Cloudflare Workers** | `wrangler.toml` `[vars]` or CLI | `DEPLOY_TARGET=api` | Headless API Worker (`httpsAdapter.ts`) |
| **Local Testing** | Terminal shell | `DEPLOY_TARGET=api npm run build` | API-only worker build |

### 3. Resolution Priority

$$\text{DEPLOY\_TARGET (Environment Variable)} \longrightarrow \text{package.json "skipo.deploy"} \longrightarrow \text{"fullstack" (Default)}$$

---

## Platform Deployment Instructions

### Vercel (Fullstack)

1. Connect the Git repository in the Vercel dashboard.
2. Framework Preset: **Vite** (auto-detected via `vercel.json`).
3. Build Command: `npm run build` (default).
4. Output Directory: `dist` (default).

### Cloudflare Workers (API-Only)

For lightweight, headless backend deployment:
1. Ensure `DEPLOY_TARGET=api` is set in the environment or run:
   ```bash
   DEPLOY_TARGET=api npm run build
   npx wrangler deploy
   ```
2. Deploys `dist/api/worker/index.js` generated from `src/backend/adapters/httpsAdapter.ts`.

---

## Programmatic API Access

All deployments expose full programmatic API access to the credential vault and services:

```bash
# Health Check Probe
curl https://<domain>/api/health

# Ecosystem Services Registry
curl https://<domain>/api/ecosystem/services

# Cluster Scan
curl https://<domain>/api/cluster/scan
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEPLOY_TARGET` | No | Build target variant (`fullstack` \| `api`) |
| `DATABASE_URL` | Optional | Neon serverless PostgreSQL connection |
| `SRKL_MASTER_KEY` | Yes | Master encryption key for credential vault |
| `JWT_SECRET` | Yes | Session token signing secret |
