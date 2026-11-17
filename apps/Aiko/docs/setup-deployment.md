# Aiko Setup and Deployment

## Prerequisites

- Node.js 20 (the repository validation workflow uses Node 20).
- npm.
- Access to the Aiko system database.
- A reachable canonical Luth deployment for authenticated application use.

## Canonical application environment

Configure these application-level variables for Aiko:

| Variable | Purpose |
|---|---|
| `SYSTEM_DATABASE_URL` | Connection string for Aiko's system database. |
| `APP_URL` | Public origin of this Aiko application, for example `http://localhost:3000` in local development. |

Do not configure a FOD server origin or FOD-specific service token. FOD executes inside Aiko and has no independent deployment configuration. Luth remains the identity/session authority; it is not replaced by a FOD-local authentication system.

Provider credentials belong in the Aiko workspace credential store and must not be placed in workflow graph data or runtime handles. Configure cloud-provider credentials only for a real adapter that is implemented and registered.

## Local setup

From the repository root:

```sh
npm install --include=optional
cat > .env.local <<'EOF'
SYSTEM_DATABASE_URL=your-system-database-connection-string
APP_URL=http://localhost:3000
EOF
```

Set `SYSTEM_DATABASE_URL` and `APP_URL` in `.env.local`, then start Aiko:

```sh
npm run dev
```

Open the Aiko application at the configured `APP_URL`. Workflow authoring and execution are part of the Aiko application; no second frontend, FOD process, proxy or iframe is required.

## Validation and build

Run the same checks used by the repository validation workflow:

```sh
npm run lint
npm run test:system-env
npm test
npm run build:fullstack
npm run build:api
python3 checklists/aiko_skipo_validator.py .
```

Build the deployable application with:

```sh
npm run build
```

Start the built application with:

```sh
npm start
```

The repository's Skipo deployment target is `fullstack`. Deploy the Aiko application and its required database connection as one application boundary.

## Deployment checklist

- [ ] Deploy the Aiko full-stack application; do not deploy FOD separately.
- [ ] Set `SYSTEM_DATABASE_URL` in the deployment environment.
- [ ] Set `APP_URL` to the externally reachable Aiko origin.
- [ ] Ensure the application can reach canonical Luth for session validation and sign-in flows.
- [ ] Ensure database/storage permissions enforce workspace isolation.
- [ ] Configure provider secrets only through Aiko's credential services.
- [ ] Verify that every advertised runtime provider has a real registered adapter.
- [ ] Verify transient runtime cleanup and workspace-scoped persistence.
- [ ] Run the validation commands above in CI or an equivalent environment.

## Existing standalone FOD data

There is no documented, verified automatic migration path from a standalone FOD deployment into Aiko's workspace persistence. Do not configure Aiko to read the old FOD filesystem/database, and do not remove the old deployment or its data as part of application rollout.

Retain a backup of standalone FOD data until a dedicated migration design specifies source schemas, workspace/user mapping, credential handling, import validation and rollback. Treat credentials separately: re-enter them into Aiko's workspace credential store rather than importing secrets into graphs or runtime handles. This guide makes no claim that historical data is automatically migrated.
