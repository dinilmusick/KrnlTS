---
name: krnlts-guide
description: >-
  Guides agents in using the KrnlTS library correctly, detailing structural conventions, utility tools, Gross Architecture (Entity, Functionality, Protocol Adapters, Flows, Manifests), sub-app execution model (local/worker), sibling network concepts, process execution gates, and programmatic Glass-Brutalism UI generation with cross-endpoint shared data bindings.
---

# KrnlTS/KrnlJS Ecosystem Developer Guide

This guide defines the architectural requirements, core utility interfaces, and integration guidelines for any project built with KrnlTS.

---

## 1. Gross Architecture & Core Principles

> **The Entity tree IS the kernel. UI aggregation, capability exposure, manifests, protocols, and flows are projections or behaviors of that tree — not parallel systems.**

### Four Governing Architectural Rules

*   **Rule 1 — Filesystem is composition**:
    *   `functionalities/` → Atomic functionality children.
    *   `entities/` → Child entities (recursive to arbitrary depth).
    *   `protocol_adapters/` → Potential protocol adapters attached to the entity.
    *   No manual wiring is required for ordinary composition. Directory structure is the composition language.
*   **Rule 2 — Functionality is the atomic unit**:
    *   A Functionality owns: logic (`main_function`), state (`state_data`), helpers (`helper_functions`), events (`events`), UI spec (`uiSpec`), AI capability spec (`intelligenceSpec`), and dependency manifest (`manifest.json` / `manifest`).
    *   UI is defined **strictly** at the Functionality level and never reauthored by parent entities.
*   **Rule 3 — Entity is composition + orchestration**:
    *   An Entity contains functionalities and child entities, aggregates capabilities through the bubbling system, controls visibility, constructs Flows, and can occupy root position.
*   **Rule 4 — Root is a runtime position, not a type**:
    *   `Entity + no parent + attached adapters` → **ROOT POSITION** (adapters active, self-hosts servers).
    *   `Entity + parent` → **CHILD POSITION** (adapters dormant, capabilities bubble up to parent).

---

## 2. Directory Structure & Recursive Composition

```
WORKSPACE / SHELL
│  package.json, node_modules, build infrastructure
│  ← SHELL materializes what KERNEL declares
│
└── ENTITY (Root Position)
    ├── krnl.json               → App manifest & subapp execution modes
    ├── assembler.js            → Entrypoint instantiating / configuring Entity
    ├── functionalities/        → Root Entity's atomic functionalities
    │   └── OrderProcess/
    │       ├── OrderProcessAtom.js    → Optional config descriptor
    │       ├── main_function/
    │       │   ├── logic.js          → Main logic function (receives input, { state, entity })
    │       │   └── lifecycle.js      → onMount / onTeardown hooks
    │       ├── state_data/
    │       │   └── state.js          → Initial observable state
    │       ├── helper_functions/     → Local helper scripts
    │       ├── events/               → Event emission definitions
    │       └── manifest.json         → Declared dependencies, tools, resources
    │
    ├── entities/               → Recursive child entities (arbitrary depth)
    │   └── Billing/
    │       ├── Billing.js            → Child Entity assembler
    │       ├── functionalities/      → Billing's atomic functionalities
    │       └── entities/             → Billing's child entities (recursive)
    │
    ├── protocol_adapters/      → Declarative protocol adapters (HTTPS, WSS, UDP)
    │   ├── HttpsAdapter.js
    │   └── WssAdapter.js
    │
    ├── subapps/                → Embedded sub-apps (legacy in-process apps)
    └── frontend/               → Programmatic Glass-Brutalism UI bundle
```

---

## 3. Four Implementation Invariants

1.  **Invariant 1 — Qualified IDs are projections, not invocation IDs**:
    *   External routes and UI keys use qualified IDs (e.g. `Root.Billing.processInvoice`).
    *   Adapters resolve qualified IDs via `root.resolveCapability("Root.Billing.processInvoice")` to `{ owner: billingEntity, fid: "processInvoice" }`, then invoke `owner.call(fid, input)`. `call()` itself remains untouched.
2.  **Invariant 2 — Entity tree / bubbling is the sole authoritative capability state**:
    *   No parallel capability registry exists. The bubbling system (`_onComponentFunctionalityAdded`, `localFunctionalities`, `remoteFunctionalities`) is canonical.
3.  **Invariant 3 — `loadAll()` constructs. Shell materializes. `finalize()` activates**:
    *   `KrnlMagneticLoader.loadAll(entity, baseDir)` discovers and builds the entity tree.
    *   `entity.getWorkspaceRequirements()` yields aggregated dependencies.
    *   Shell materializes dependencies/build.
    *   `entity.finalize()` activates protocol adapters only if the entity is in root position.
4.  **Invariant 4 — Root / Child is a bidirectional runtime state invariant**:
    *   When an Entity is adopted as a child: `_onAdoptedByParent()` stops self-hosted adapters.
    *   When an Entity is promoted or detached to root: `_onPromotedToRoot()` starts self-hosted adapters.

---

## 4. Flows as Functionalities

A **Flow** is a first-class Functionality composed of sequential, branching, or parallel steps over an Entity's functionalities:

```typescript
import { Entity } from "@dinilmusick/krnlts";

const myEntity = new Entity("PipelineEntity");

// Build and register a flow
myEntity.flow("processPayment")
    .then("validateAccount")
    .then("checkBalance")
    .branch((res) => res.balance >= res.amount, "chargeCard", "notifyInsufficientFunds")
    .register({
        visibility: "public",
        description: "Payment verification and charging pipeline"
    });

// Invoke like any functionality
const result = await myEntity.call("processPayment", { amount: 100 });
```

---

## 5. Dependency Declarations & Shell Materialization

Functionalities declare their requirements in `manifest.json`:
```json
{
  "version": "1.0.0",
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0"
  },
  "buildRequirements": ["typescript", "esbuild"]
}
```

The Root Entity aggregates all manifests across its tree:
```typescript
const requirements = rootEntity.getWorkspaceRequirements();
// { dependencies: { ... }, conflicts: [ ... ] }
```
If `requirements.conflicts` contains version mismatches, Shell materialization halts to prevent invalid workspace states.

---

## 6. Coding Conventions & Trap Mitigation

*   **JS Extensions**: All local TS file imports MUST specify the `.js` suffix (`import { x } from "./x.js";`).
*   **API Endpoint Fetch URLs**: Generated React components fetch via `/call/${fid}` (leading slash).
*   **⚠️ CRITICAL context-destructuring trap**:
    Functionality `main` functions receive the live entity under the key `entity`, **not** `system`:
    ```typescript
    // ✅ CORRECT
    export const main = async (input, { state, entity }) => {
        const port = entity.commPort;
    };
    // ❌ WRONG - system will be undefined at runtime!
    export const main = async (input, { state, system }) => {
        const port = system?.commPort; // always undefined!
    };
    ```

---

## 7. Krnl-Tools Utility Suite

*   `KrnlFS`: Atomic file operations and mutex-based file locks (`acquireFileLock`).
*   `KrnlEnv`: Environment file loading and type-safe Zod schema validation.
*   `KrnlShell`: Safe shell command execution and process spawns.
*   `AsyncKit`: Concurrency-limiting (`pLimit`) and task timeouts.
*   `ObjectKit`: High-performance deep cloning, masking, and object manipulation.
*   `CacheKit`: In-memory and TTL caching.
