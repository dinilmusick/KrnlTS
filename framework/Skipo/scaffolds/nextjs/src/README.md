# Application Architecture (`src/`)

## Architectural Role
Primary application source code divided into canonical planes:
- `backend/`: Master facade, adapters, core services (database, auth, storage, workspace).
- `frontend/`: UI components, auth portal, and main application canvas.
- `frontend-state/`: Client-side Zustand stores.
- `libraries/`: Isolated, environment-neutral libraries and design tokens.
- `config/`: Typed environment accessors and build configurations.
