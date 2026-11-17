---
name: libraries-concepts-guidelines
description: Directives for service-owned backend libraries and atomic frontend concept libraries with ServiceFacade exposure and strict state decoupling.
---

# SERVICE-OWNED LIBRARIES ARCHITECTURE GUIDELINES

## 1. ARCHITECTURAL PLACEMENT & SERVICE OWNERSHIP
Every backend library has exactly one **service owner**. There is no canonical global `backend/libraries/` directory.

Backend libraries are owned by a service, registered on the service's `ServiceFacade`, and accessed cross-service strictly through the owning facade rather than internal filesystem paths.

```text
krnl/
├── backend/services/<ServiceName>/
│   ├── functionalities/               → Service-owned functionalities
│   ├── orchestrations/                → Service-owned functionality orchestrations
│   ├── libraries/                     → Service-owned concept libraries
│   │   └── <ConceptName>/             → e.g. MathConcepts/, ValidationConcepts/
│   │       ├── definitions.ts         → Interfaces, types, contracts (< 200 lines)
│   │       ├── functions.ts           → Pure Layer 0A utility functions (< 200 lines)
│   │       ├── index.ts               → Coherent library export surface
│   │       ├── manifest.json          → Declared external dependencies
│   │       └── tests/                 → Localized unit tests
│   │           └── <ConceptName>.test.ts
│   ├── <ServiceName>ServiceFacade.ts  → Public boundary registering functionalities, orchestrations, and libraries
│   └── tests/
│
└── frontend/libraries/
    └── <ConceptName>/                 → e.g. ButtonConcepts/, FieldConcepts/
        ├── definitions.ts             → Component props, variants, states
        ├── components.tsx             → React component implementations (< 200 lines)
        ├── styles.css                 → Scoped styling
        ├── manifest.json              → Declared UI external dependencies
        └── tests/                     → Component tests
            └── <ConceptName>.test.tsx
```

---

## 2. SERVICE FACADE CAPABILITY SURFACE
The `ServiceFacade` exposes three first-class capability categories:
1. `functionalities`: Atomic, single-responsibility execution units.
2. `functionalityOrchestrations`: Declarative step composition flows.
3. `libraries`: Service-owned libraries, types, algorithms, and domain utilities.

### Registration:
```ts
const service = new ServiceFacade({
  id: "billing.service",
  libraries: {
    taxConcepts,
  },
});

// Or runtime registration:
service.registerLibrary("taxConcepts", taxConcepts);
```

### Access:
```ts
// Local or cross-service consumption through facade:
service.libraries.taxConcepts.calculateTax(amount, rate);
```

---

## 3. STRICT SEPARATION OF LIBRARIES FROM RUNTIME STATE
- **Libraries**: Reusable code, algorithms, pure transforms, domain models, and struct/type definitions.
- **State**: Ephemeral runtime state owned by an active service or functionality.
- Struct/type definitions do NOT constitute runtime state. Functionalities do not acquire state simply by defining structs. State is optional.

---

## 4. CROSS-SERVICE BOUNDARY ENFORCEMENT
- Cross-service library access must **always** route through the owning service's facade:
  `ServiceB -> ServiceAFacade.libraries -> ServiceALibrary`
- Direct filesystem imports between services (e.g. `import from '../../ServiceA/libraries/...'`) are strictly forbidden and rejected by validator rule `krnl/no-cross-service-library-imports`.

---

## 5. UNIVERSAL MANIFEST & DEPENDENCY AGGREGATION
- Every service-owned concept library declares its external dependencies in its own `manifest.json`.
- The root `package.json` aggregates all manifests across all services via `KrnlPackageReconciler`.
