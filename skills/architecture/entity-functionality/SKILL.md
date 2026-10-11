---
name: entity-functionality-architecture
description: Directives for KrnlTS symmetric backend/frontend folder architecture, code-as-config <app_name>.ts entrypoint, entity orchestrations, quad-units, co-located manifests, and tests.
---

# KRNLTS SYMMETRIC ARCHITECTURE & ENTITY GUIDELINES

## 1. GROSS ARCHITECTURAL HIERARCHY (SYMMETRIC DUAL-PLANE STANDARD)
All KrnlTS-based projects authored or maintained by the AI agent MUST strictly conform to this symmetric dual-plane layout:

```
PROJECT_ROOT/
├── <app_name>.ts                     → [APP ENTRYPOINT & VARIANT CONFIG] (Replaces krnl.json)
├── package.json                      → Derived programmatically from all manifest.json files
├── tsconfig.json                     → TypeScript paths pointing to krnl/*
├── .skipo/
│   └── agent-state.json              → Step-0 turn counter & audit history
├── docs/
│   └── HISTORY.md                    → Project memory & intent tracking
│
└── krnl/                             → [APPLICATION KERNEL] (Pure application code)
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
    │   ├── entities/                 → Named folder per entity
    │   │   └── <EntityName>/         → e.g. UserSystem/
    │   │       ├── <EntityName>.ts   → Main entity class (extends Entity from @dinilmusick/krnl-core)
    │   │       ├── orchestrations/   → Modular flows & pipeline definitions
    │   │       └── tests/            → Entity unit & integration tests
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
    │   └── protocol_adapters/        → Ingress Network Adapters (HTTP, WSS, MCP)
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
        ├── entities/                 → Named folder per entity (Mirrors backend)
        │   └── <EntityName>/         → e.g. UserSystem/
        │       ├── <EntityName>0.tsx → Main UI variant 0 (default view)
        │       ├── <EntityName>1.tsx → Main UI variant 1 (alternative mode)
        │       ├── <Piece>.tsx       → Modular UI component pieces
        │       └── tests/            → Entity component tests
        │
        └── functionalities/          → Named folder per functionality (Mirrors backend)
            └── <FeatureName>/        → e.g. ProcessPayment/
                ├── <FeatureName>0.tsx → Main UI variant 0 (default feature form)
                ├── <FeatureName>1.tsx → Main UI variant 1 (compact / modal variant)
                ├── <SubPiece>.tsx    → Modular UI sub-components
                ├── manifest.json     → External UI deps
                └── tests/            → Functionality tests
```

---

## 2. CODE-AS-CONFIG APP ENTRYPOINT (`<app_name>.ts`)
- Replaces static `krnl.json` with a strongly-typed TypeScript configuration.
- Declaratively specifies:
  1. `protocols`: Active ingress gateways (`Protocols.HTTP`, `Protocols.WebSocket`, `Protocols.MCP`).
  2. `entities`: The explicit subset of entities to compile and mount for this build.
  3. `frontend`: Root entity and default variant (`variant: 0`).
- Allows maintaining 100+ entities in `krnl/backend/entities/`, but only compiling the exact entities declared in `<app_name>.ts`.

---

## 3. UNIVERSAL MANIFEST.JSON & PROGRAMMATIC PACKAGE.JSON
- **Universal Manifests**: Every functionality AND every concept library folder (both frontend and backend) MUST have a `manifest.json`.
- **Programmatic Aggregation**: Root `package.json` dependencies are derived by scanning all `manifest.json` files via `KrnlPackageReconciler`.
- **Auto-Sync**: Any change to a `manifest.json` triggers automatic reconciliation of `package.json`.

---

## 4. LOCALIZED TESTS IN EVERY FOLDER
- Every entity, functionality, and concept library folder on both frontend and backend has a co-located `tests/` directory.
- Eliminates detached, monolithic test suites.

---

## 5. 200-LINE LIMIT & MULTI-FILE SPLITS
- **Rule**: No file may exceed 200 lines.
- **Concept Libraries**: Broken into `definitions.ts`, `functions.ts` (backend) or `definitions.ts`, `components.tsx`, `styles.css` (frontend).
- **Entities**: Complex flows are extracted into `orchestrations/<FlowName>.ts`.
- **UI Variants**: Alternate representations are numbered `<Name>0.tsx`, `<Name>1.tsx`, `<Name>2.tsx`.
