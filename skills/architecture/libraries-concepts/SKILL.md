---
name: libraries-concepts-guidelines
description: Directives for concept libraries as named folders with multi-file splits (<200 lines), definitions, functions, components, styles, co-located manifest.json, and tests.
---

# CONCEPT LIBRARIES ARCHITECTURE GUIDELINES

## 1. ARCHITECTURAL PLACEMENT & NAMED FOLDER CONVENTION
Loose concept files are replaced by **named folders** in both backend and frontend planes:

```
krnl/
├── backend/libraries/
│   └── <ConceptName>/                 → e.g. MathConcepts/, DataConcepts/
│       ├── definitions.ts             → Interfaces, types, contracts (< 200 lines)
│       ├── functions.ts               → Pure Layer 0A utility functions (< 200 lines)
│       ├── manifest.json              → Declared external dependencies
│       └── tests/                     → Localized unit tests
│           └── <ConceptName>.test.ts
│
└── frontend/libraries/
    └── <ConceptName>/                 → e.g. ButtonConcepts/, FieldConcepts/
        ├── definitions.ts             → Component props, variants, states
        ├── components.tsx             → React component implementations (< 200 lines)
        ├── styles.css                 → Scoped 2.5D Neo-Brutalist styling
        ├── manifest.json              → Declared UI external dependencies
        └── tests/                     → Component tests
            └── <ConceptName>.test.tsx
```

---

## 2. FILE TYPES PER CONCEPT FOLDER
A concept folder may contain from 1 to all of the following file types:
1. `definitions.ts`: Type definitions, schemas, prop interfaces, constants.
2. `functions.ts`: Pure deterministic functions (Layer 0A).
3. `components.tsx`: UI component implementations (frontend).
4. `styles.css`: Scoped component styling (frontend).
5. `manifest.json`: Co-located npm packages required by this concept.
6. `tests/`: Dedicated unit test suite for the concept.

---

## 3. FRONTEND UI PRIMITIVES INVARIANT
- `frontend/libraries/` defines the fundamental atomic primitives (buttons, text fields, dropdowns, scrollbars, tooltips, tiles).
- These primitives are the **exclusive building blocks** for composing all service, orchestration, and functionality UIs across the entire application.

---

## 4. UNIVERSAL MANIFEST & DEPENDENCY AGGREGATION
- Every concept library declares its external dependencies in its own `manifest.json`.
- The root `package.json` aggregates all concept manifests via `KrnlPackageReconciler`.
