# Skipo Application Source Tree (`src/`)

Extreme-minimal application composition plane:
- `src/frontend/App.tsx`: Primary UI composition importing `@floks/*` packages.
- `src/backend/SkipoBackend.ts`: Primary backend composition importing `@kloks/*` services and orchestrators.
- `src/libraries/`: Strictly Skipo-application-specific custom code (never copy `@kloks/*` or `@floks/*` source).
- `src/frontend-state/`: Application-specific reactive UI stores and events.
