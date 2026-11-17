# Serverless API Entrypoint (`api/`)

## Architectural Role
Provides the edge serverless function handler target for Vercel deployment, routing incoming `/api/*` HTTP requests into the unified Express `AppFactory` pipeline.

## Layer
Edge Deployment / Serverless Adapter Gateway.

## Manifest
- `index.js`: Compiled standalone serverless bundle output generated from `src/server/serverless.ts` via esbuild.
