# Aiko

Aiko is the Ultrst Armada AI gateway and workspace application. Its workflow automation is a native Aiko capability: the FOD graph engine, scheduler, node registry and visual editor are internal implementation components, not a separately deployed application or network service.

## Local development

**Prerequisites:** Node.js 20 and npm.

1. Install dependencies:

   ```sh
   npm install --include=optional
   ```

2. Create `.env.local` with the canonical application configuration:

   ```dotenv
   SYSTEM_DATABASE_URL=your-system-database-connection-string
   APP_URL=http://localhost:3000
   ```

   Set `SYSTEM_DATABASE_URL` to the Aiko system database connection string and `APP_URL` to the public origin used by this Aiko instance.

3. Start the application:

   ```sh
   npm run dev
   ```

The workflow editor and graph execution are served by Aiko. There is no FOD service to start, FOD origin to configure, or FOD iframe to mount.

## Validation

```sh
npm run lint
npm run test:system-env
npm test
npm run build:fullstack
npm run build:api
python3 checklists/aiko_skipo_validator.py .
```

## Architecture and deployment

- [Internal FOD architecture](docs/fod-architecture.md) — subsystem boundaries, request flow, identity, persistence and provider status.
- [Runtime execution](docs/runtime-execution.md) — in-process node execution and runtime lifecycle.
- [Setup and deployment](docs/setup-deployment.md) — environment, build, deployment and migration guidance.
- [Architecture specifications](specs/README.md)

Aiko is the only application boundary. Luth remains the sole identity and session authority; Aiko workspaces define the workflow data and authorization boundary.
