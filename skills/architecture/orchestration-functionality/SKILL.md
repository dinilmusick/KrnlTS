---
name: orchestration-functionality-architecture
description: Directives for KrnlTS symmetric backend/frontend folder architecture, ServiceFacade boundaries, pure declarative Orchestrations, quad-unit Functionalities, co-located manifests, and tests.
---

# KRNLTS SYMMETRIC ARCHITECTURE, SERVICE FACADE & ORCHESTRATION GUIDELINES

## 1. CANONICAL ARCHITECTURAL MAPPING & GROSS HIERARCHY

KrnlTS services and Skipo maintain structural isomorphism:
- In Skipo: `BackendFacade` aggregates multiple `ServiceFacades`.
- In KrnlTS: `ServiceFacade` establishes a single service's public semantic boundary, composing that service's `functionalities/` and `orchestrations/`.

```
PROJECT_ROOT/
├── <app_name>.ts                     → [SERVICE / APP ENTRYPOINT]
├── package.json                      → Derived programmatically from all manifest.json files
├── tsconfig.json                     → TypeScript paths pointing to krnl/*
├── .krnl/
│   └── agent-state.json              → Step-0 turn counter & audit history
├── docs/
│   └── HISTORY.md                    → Project memory & intent tracking
│
└── krnl/                             → [APPLICATION KERNEL]
    │
    ├── backend/                      → [BACKEND PLANE]
    │   │
    │   ├── libraries/                → Concept libraries (one named folder per concept)
    │   │   └── <ConceptName>/        → e.g. MathConcepts/, DataConcepts/
    │   │       ├── definitions.ts    → Types, interfaces, constants (< 200 lines)
    │   │       ├── functions.ts      → Pure calculation & algorithm functions (< 200 lines)
    │   │       ├── manifest.json     → Co-located external dependencies
    │   │       └── tests/            → Localized unit tests
    │   │
    │   ├── services/                 → Named folder per service
    │   │   └── <ServiceName>/        → e.g. App/
    │   │       ├── <ServiceName>ServiceFacade.ts → Public semantic boundary (ServiceFacade)
    │   │       └── tests/            → Service integration tests
    │   │
    │   ├── orchestrations/           → Declarative flow compositions (zero procedural code)
    │   │   └── <OrchestrationName>/  → e.g. AppOrchestration/
    │   │       ├── <OrchestrationName>.ts → Pure Orchestration flow definition
    │   │       └── tests/            → Orchestration flow tests
    │   │
    │   ├── functionalities/          → Named folder per functionality (Quad-Units)
    │   │   └── <FeatureName>/        → e.g. ProcessPayment/
    │   │       ├── <FeatureName>Atom.ts → Interface, input/output schemas
    │   │       ├── manifest.json     → Declared dependencies & tools
    │   │       ├── main_function/    → logic.ts (Layers 1 & 2), lifecycle.ts
    │   │       ├── state_data/       → state.ts (Observable state & atomic accessors)
    │   │       ├── helper_functions/ → Pure Layer 0A helper functions
    │   │       ├── events/           → Domain event definitions & emitters
    │   │       └── tests/            → Functionality tests
    │   │
    │   └── adapters/                 → Protocol Ingress Adapters (HTTP, WS, UDP, P2P)
    │
    └── frontend/                     → [FRONTEND PLANE]
        │
        ├── libraries/                → UI Concept Libraries (Atomic Primitives)
        │   └── <ConceptName>/        → e.g. ButtonConcepts/, FieldConcepts/
        │       ├── definitions.ts    → Props, variant types, states
        │       ├── components.tsx    → React component implementations (< 200 lines)
        │       ├── styles.css        → Scoped 2.5D Neo-Brutalist styles
        │       ├── manifest.json     → Required UI npm packages
        │       └── tests/            → Component tests
        │
        ├── orchestrations/           → Named folder per orchestration UI (Mirrors backend)
        │   └── <OrchestrationName>/  → e.g. App/
        │       ├── <Name>0.tsx       → Main UI variant 0 (default view)
        │       ├── <Name>1.tsx       → Main UI variant 1 (alternative mode)
        │       └── tests/            → Orchestration component tests
        │
        └── functionalities/          → Named folder per functionality (Mirrors backend)
            └── <FeatureName>/        → e.g. ProcessPayment/
                ├── <FeatureName>0.tsx → Main UI variant 0 (default feature form)
                ├── <FeatureName>1.tsx → Main UI variant 1 (compact / modal variant)
                ├── manifest.json     → External UI deps
                └── tests/            → Functionality tests
```

---

## 2. SERVICE FACADE & DECLARATIVE ORCHESTRATION

### ServiceFacade:
- A `ServiceFacade` is the public semantic boundary of a service.
- Aggregates the service's `functionalities/`, `orchestrations/`, operations, state store, events, and lifecycle.
- Direct invocation via `facade.call(operationName, payload)`.

### Orchestration:
- Pure declarative composition of flows.
- Built via `.thenFunctionality()` and `.thenOrchestration()`.
- **Zero Direct Library Calls**: Orchestrations sequence functionalities and peer orchestrations; only functionalities in `functionalities/` are permitted to invoke shared libraries (`libraries/`).
- **Zero Application Leakage**: No `AppDefinition`, UI specifications, or protocol listeners reside inside Orchestrations.

---

## 3. UNIVERSAL MANIFEST.JSON & PROGRAMMATIC PACKAGE.JSON
- **Universal Manifests**: Every functionality AND every concept library folder (both frontend and backend) MUST have a `manifest.json`.
- **Programmatic Aggregation**: Root `package.json` dependencies are derived by scanning all `manifest.json` files via `KrnlPackageReconciler`.
- **Auto-Sync**: Any change to a `manifest.json` triggers automatic reconciliation of `package.json`.

---

## 4. LOCALIZED TESTS IN EVERY FOLDER
- Every service, orchestration, functionality, and concept library folder on both frontend and backend has a co-located `tests/` directory.
- Eliminates detached, monolithic test suites.

---

## 5. 200-LINE LIMIT & MULTI-FILE SPLITS
- **Rule**: No file may exceed 200 lines.
- **Concept Libraries**: Broken into `definitions.ts`, `functions.ts` (backend) or `definitions.ts`, `components.tsx`, `styles.css` (frontend).
- **Orchestrations**: Declarative flow definitions with typed step descriptors.
- **UI Variants**: Alternate representations are numbered `<Name>0.tsx`, `<Name>1.tsx`, `<Name>2.tsx`.
