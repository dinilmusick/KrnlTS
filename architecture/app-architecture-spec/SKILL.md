---
name: app-architecture-spec
description: Formal specification and enforcement directives for APP_ARCHITECTURE_SPEC across Skipo apps.
---

# APP_ARCHITECTURE_SPEC: FORMAL SPECIFICATION

$$\text{AppArchitecture}(\mathcal{A}) \iff \text{Planes}(\mathcal{A}) \wedge \text{RuntimeModel}(\mathcal{A}) \wedge \text{Facade}(\mathcal{A}) \wedge \text{BoundaryRules}(\mathcal{A})$$

## 0. CANONICAL DIRECTORY TREE

```
src/
├── frontend/                     # Pure client presentation, components, shell, views
├── backend/                      # Backend plane
│   ├── <AppName>Backend.ts       # SINGLE FRONTEND-BACKEND ENTRYPOINT FACADE
│   ├── adapters/                 # Protocol adapters
│   │   └── httpsAdapter.ts       # Universal Fetch / Cloudflare Worker adapter (Law L8)
│   ├── orchestrations/           # Thin client-side coordinators sequencing services
│   ├── services/                 # Encapsulated modular services
│   │   ├── core/                 # ZERO-DRIFT ISOMORPHIC CORE SERVICES (Law L23)
│   │   │   ├── unifiedDb.ts      # Universal Neon HTTP query driver
│   │   │   ├── authCore.ts       # Universal auth & session management
│   │   │   └── storageCore.ts    # Universal storage connections & testing
│   │   ├── <service-a>/
│   │   │   ├── <service-a>.ts    # SERVICE FACADE (runtime, deployment, service)
│   │   │   ├── client/           # Client implementation (runtime == CLIENT)
│   │   │   ├── server/           # Local server implementation (runtime == SERVER, deployment == LOCAL)
│   │   │   ├── remote/           # Remote gateway client (runtime == SERVER, deployment == REMOTE)
│   │   │   └── repositories/     # Database / persistence boundary (Drizzle ORM)
│   │   └── <service-b>/
│   │       └── ...
│   └── gateway/                  # Remote service gateway
│       ├── gateway.ts            # Central gateway entrypoint
│       ├── registry/             # Service registry
│       ├── resolver/             # Local vs remote endpoint resolver
│       └── transport/            # HTTP / WebSocket transport encoders/decoders
├── libraries/                    # ENVIRONMENT_NEUTRAL pure shared code
│   ├── types/                    # Pure TypeScript interfaces & types
│   ├── data/                     # Pure data models & schemas
│   ├── functions/                # Pure algorithms & computations
│   ├── constants/                # Pure constants & enums
│   └── utilities/                # Pure string/date/format utilities
└── frontend-state/               # Client-side state & events
    ├── stores/                   # Zustand UI state stores
    └── events/                   # State transition & domain events

tests/
├── architecture/                 # Invariant tests (import boundaries, runtime rules)
├── unit/                         # Unit tests
├── integration/                  # Integration tests
└── e2e/                          # End-to-end tests

config/
├── tsconfig/                     # TypeScript path boundaries
├── eslint/                       # Restricted imports lint configuration
└── build/                        # Build configs

.github/
└── workflows/
    ├── validate.yml              # CI typecheck, lint, and architecture validation
    └── build.yml                 # CI build pipeline
```

---

## 1. RUNTIME MODEL

$$\mathcal{R} \in \{\text{CLIENT}, \text{SERVER}\}, \quad \mathcal{D} \in \{\text{LOCAL}, \text{REMOTE}\}$$

$$\text{VALID}: \quad (\text{CLIENT} \times \text{LOCAL}) \cup (\text{SERVER} \times \text{LOCAL}) \cup (\text{SERVER} \times \text{REMOTE})$$

$$\text{INVALID}: \quad \text{CLIENT} \times \text{REMOTE}$$

$$\forall s \in \text{Services}: (\text{runtime}(s) = \text{CLIENT} \implies \text{deployment}(s) = \text{LOCAL})$$
$$\forall s \in \text{Services}: (\text{deployment}(s) = \text{REMOTE} \implies \text{runtime}(s) = \text{SERVER})$$

---

## 2. SINGLE BACKEND ENTRYPOINT FACADE

`src/backend/<AppName>Backend.ts` is the **ONLY** backend module the frontend may import:

```typescript
export const <AppName>Backend = {
  services: {
    <serviceA>: serviceAInstance,
    <serviceB>: serviceBInstance,
  },
  orchestrations: {
    <orchestration1>: orchestration1Fn,
  }
};
```

---

## 3. SERVICE FACADE INVARIANTS

Every service directory `src/backend/services/<service>/` must contain `<service>.ts`:

```typescript
export const runtime: 'client' | 'server' = 'server';
export const deployment: 'local' | 'remote' = 'local';
export const service: ServiceDefinition = { ... };
```

- If `runtime === 'client'`: Implementation must reside strictly in `client/`.
- If `runtime === 'server'` and `deployment === 'local'`: Implementation in `server/`, database persistence in `repositories/`.
- If `runtime === 'server'` and `deployment === 'remote'`: Implementation in `remote/` invoking Gateway.

---

## 4. IMPORT BOUNDARIES (L7)

| Source Plane | Allowed Targets | Strictly Forbidden Targets |
| :--- | :--- | :--- |
| `frontend/*` | `@/backend/<AppName>Backend`, `@/libraries/*`, `@/frontend-state/*` | `backend/services/*/*`, `backend/gateway/*`, `repositories/*`, `server/*`, `remote/*` |
| `orchestrations/*` | Service Facades (`<service>.ts`), `@/libraries/*` | `repositories/*`, `gateway/*`, `server/*`, `remote/*` |
| `libraries/*` | Self, external neutral libs | `frontend/*`, `backend/*`, `frontend-state/*` (zero env side effects) |
| `repositories/*` | Drizzle ORM, database drivers | `frontend/*`, `orchestrations/*`, `client/*` |
| `server/*` | `repositories/*`, `gateway/*`, `@/libraries/*` | `client/*` |
| `client/*` | `@/libraries/*` | `server/*`, `remote/*`, `repositories/*` |

---

## 5. ROOT FILE PRESERVATION

The Vite browser entry contract is deliberately distinct from the universal backend Fetch ingress (`src/app.ts`): `src/frontend/main.tsx` mounts the React application, while `src/app.ts` handles backend/provider requests. These are separate runtime surfaces, not competing frontend entrypoints.

For universal deployment to Google AI Studio, Project IDX, and Vercel:
- In **Vite** apps: `index.html` **MUST** remain directly in the project root and load the canonical browser bootstrap at `/src/frontend/main.tsx`. The bootstrap itself lives inside the frontend plane; do not create or require a parallel `src/main.tsx` entrypoint.
- In **Next.js** apps: `package.json` and `next.config.ts` **MUST** remain directly in the project root.

---

## 6. STATE & EXECUTION ARCHITECTURE (SKIPO_STATE & SKIPO_EXECUTION)

- **Frontend State**: Backed by `SKIPO_STATE` (Zustand). All components bind to explicit lifecycles (`COMPONENT`, `PAGE`, `APP`, `DEPENDENCY`). Zero React `useState` for application data; zero prop drilling.
- **Frontend Execution**: Every backend-bound operation dispatched as a `SKIPO_COMMAND` into `BullMQ`.
- **Backend Boundary**: `DIRECT_COMPONENT -> BACKEND_FACADE` is strictly **FORBIDDEN**. Only `WORKER -> BACKEND_FACADE` is permitted. Facade delegates to `SERVICES` and deterministic `OPERATION_COMPONENTS`.
- **Result Flow**: `operation -> service -> facade -> worker -> job_result -> frontend_state_update -> Zustand`.
- For full specification, see [`state-execution-spec/SKILL.md`](../state-execution-spec/SKILL.md).
