---
name: krnlts-guide
description: >-
  Guides agents in using the KrnlTS library correctly, detailing structural conventions, utility tools, agentic endpoints, orchestrator memory, sub-app execution model (local/worker), sibling network concepts, process execution gates, and programmatic Glass-Brutalism UI generation with cross-endpoint shared data bindings.
---

# KrnlTS/KrnlJS Ecosystem Developer Guide

This guide defines the architectural requirements, core utility interfaces, and integration guidelines for any project compatible with KrnlTS/KrnlJS.

---

## 1. Directory Structure & Separation
All KrnlTS applications follow a strict Atomic Entity Model layout:
```
ROOT/
├── doc.md              → System documentation
├── krnl.json           → App manifest (includes subapps section for execution modes)
├── src/                → Core source files
├── libraries/          → Local submodules (strictly NO third-party packages here!)
├── entities/           → Declarative child entities definitions
│   └── MyEntity/
│       ├── functionalities/  → Atomic logic blocks
│       │   └── OrderProcess/
│       │       ├── OrderProcessAtom.js    → Config descriptor
│       │       ├── main_function/
│       │       │   └── logic.js          → Implementation code
│       │       ├── state_data/
│       │       │   └── state.js          → Initial state configuration
│       │       └── helpers/              → Internal helper scripts
│       └── MyEntity.js                   → Assembler definition file
├── subapps/            → Embedded sub-apps (internal components, NO networking)
├── frontend/           → Single unified UI folder (React components, Vite/esbuild bundle)
└── assembler.js        → App entrypoint extending krnlSystemEntityBase
```

> [!CAUTION]
> **Do not mix backend and frontend modules:**
> *   `subapps/` contains other KrnlTS apps embedded as internal components. They have **no networking of their own** when hosted as sub-apps.
> *   `frontend/` contains the single web interface served automatically at `/frontend/`.

---

## 2. Mandatory Build Validator & Boot-Order Constraints

> [!CRITICAL]
> **MANDATORY BUILD VALIDATION**: All KrnlTS applications MUST be compiled/validated using `npx krnlts-validate` (or `krnlts-watch`). Building or running KrnlTS applications without passing `krnlts-validate` is strictly forbidden.

### Strict `addLocal()` Boot Order & Phase 1 Boot Barrier Rule
```typescript
// ✅ CORRECT BOOT PATTERN: Phase 1 (addLocal registration) inside boot(), then await super.boot()
async boot() {
    this.addLocal({
        id: "MyEndpoint",
        requires: {
            functionalitiesExecuted: ["bootstrap"], // Dependent functionality execution gate
            flags: ["krnl:ai_layer_ready"]           // Milestone flag gate
        },
        uiSpec: { ui_component_enabled: true, ... },
        api: ...
    });
    await super.boot(); // Triggers signalPhase1Complete() -> unblocks KrnlMagneticLoader phase 2!
}

// ❌ INCORRECT BOOT ORDER — FAILS COMPILER VALIDATION:
async boot() {
    await super.boot(); // Releases Phase 1 barrier before endpoints are added!
    this.addLocal({ id: "MyEndpoint", uiSpec: { ui_component_enabled: true, ... }, api: ... }); // Too late -> missed by magnetic loader/generator!
}
```

*   **Why**: `KrnlSystemEntityBase` utilizes a two-phase boot architecture via `KrnlBootBarrier`. Phase 1 allows local endpoint registration (`addLocal()`). Calling `await super.boot()` signals Phase 1 completion, unblocking `KrnlMagneticLoader.loadAll()` for Phase 2 magnetic scanning and programmatic frontend generation.
*   **Enforcement**: `npx krnlts-validate` statically parses source files and fails the build with `[ERR_BOOT_ORDER_VIOLATION]` if `addLocal()` with `uiSpec` appears after `super.boot()` or `loadAll()`.

---

## 3. Coding Conventions & Trap Mitigation
*   **JS Extensions**: All local TS file imports MUST specify the `.js` suffix (e.g. `import { x } from "./x.js";`) to resolve cleanly under NodeNext.
*   **API Endpoint Fetch URLs**: Generated React components MUST fetch via `/call/${fid}` (leading slash). Bare relative URLs cause page resets/blanks.
*   **⚠️ CRITICAL context-destructuring trap**:
    All `main` functionality functions receive the live KrnlTS entity instance under the key `entity`, **not** `system`. Always alias it:
    ```typescript
    // ✅ CORRECT
    export const main = async (input, { state, entity: system }) => {
        const port = system.commPort;
    };
    // ❌ WRONG - system will be undefined at runtime!
    export const main = async (input, { state, system }) => {
        const port = system?.commPort; // always undefined!
    };
    ```

---

## 4. Krnl-Tools Utility Suite (`krnlts`)
Leverage the built-in wrappers to keep downstream code clean and wrap common OS actions:
*   `KrnlFS`: Atomic file operations and mutex-based file locks (`acquireFileLock`).
*   `KrnlEnv`: Environment file loading and type-safe Zod schema validation.
*   `KrnlShell`: Safe shell commands execution and process spawns.
*   `AsyncKit`: Concurrency-limiting (`pLimit`) and task timeouts.
*   `ObjectKit` / `StringKit`: Deep cloning, recursive deep merges, casing/slug conversion, template interpolation.
*   `CacheKit` / `KrnlHTTP`: Stale-While-Revalidate caching, fetch clients, and SSE streams.

---

## 5. Agentic Endpoints & Orchestration Memory
Downstream applications declare endpoint behaviors using `KrnlEndpointDefinition`. The framework handles Zod-to-JSON mappings automatically.
*   **Zero-Default Tools**: By default, endpoint agents receive NO tools to conserve token context. Declare required tools in `agentTools` (e.g. `['calculator']`) or use wildcard `['*']` for all.
*   **Planner Agent**: Instantiated with high intelligence specs (`KrnlPlannerSpec`). Processes user requests to build sequential `KrnlTaskList` blocks using `taskListTool`.
*   **Autonomous Task Runner**: Executes task sequences in a purely event-driven, completion-based flow. Re-enters the orchestrator only on endpoint failure escalation or explicitly queried data-requests (`QUERY_ORCHESTRATOR`).
*   **Persistent Learning Loops**: The orchestrator (`KrnlApplicationOrchestrator`) records fix data to `krnl_runtime_state.db`.
    *   **Structured Learnings**: Typed `KrnlLearning` instances with keyword tags. Saved only after failure+resolution, and search-scanned via tag overlap (with fallback to full scan).
    *   **Caveman Language**: All agent instructions, tool descriptions, and learning fields must write in token-efficient, non-verbose caveman/pseudo-code/math symbols format (e.g. using `→`, `∩`, `≥`, `|`).

---

## 6. Sub-App Execution Model (Internal Components)

Sub-apps are **normal KrnlTS applications** that can run in two modes:
1.  **Standalone**: Started independently with a full networking stack (HTTP + WebSocket).
2.  **Embedded (sub-app)**: Hosted inside a parent entity with **no networking at all**.

> [!IMPORTANT]
> Sub-apps NEVER communicate via HTTP, WebSocket, or TCP when embedded inside a parent.
> All communication is zero-network: direct in-process calls (local mode) or MessagePort IPC (worker mode).

### Execution Modes (set in parent's `krnl.json` — single source of truth)

```json
// parent-app/krnl.json
{
  "subapps": {
    "MySub":     { "executionMode": "local"  },
    "HeavySub":  { "executionMode": "worker" }
  }
}
```

| Mode | Transport | Latency | Use for |
|------|-----------|---------|---------|
| `local` (default) | Direct in-process method call | ~0ms | UI, logic, orchestration, tightly integrated modules |
| `worker` | `worker_threads` MessagePort IPC | ~1ms | CPU-heavy tasks, memory isolation, crash containment |

### Key APIs
*   **`entity.loadSubApps(configs)`** — embeds sub-apps. Called automatically by `KrnlMagneticLoader` when `subapps/` is present.
*   **`entity.callInternal(prefix, fid, input)`** — zero-network dispatch to a sub-app.
*   **`entity._subAppRegistry`** — `Map<string, KrnlSubAppEntry>` of loaded sub-apps.
*   **`entity.getSubAppTopology()`** — snapshot of all embedded sub-apps with execution modes.

---

## 7. Sibling Network (formerly Ingress Network)

> [!WARNING]
> **NOT for sub-apps.** The sibling network is preserved for a future use-case where independent standalone KrnlTS apps (each with their own networking stack) form a peer/gateway cluster.

*   Class: `KrnlSiblingNetwork` (backward-compat alias: `KrnlIngressNetwork`)
*   API: `entity.startSiblingNetwork(configs)` (deprecated alias: `startIngressNetwork`)
*   All members are standalone apps with HTTP/WS servers — not embedded components.
*   `_isIngressNetworkMember = true` marks an entity as a sibling (distinct from `_isSubApp`).

---

## 8. Unified In-Process Frontend & Programmatic UI Generation

Every KrnlTS application programmatically generates and serves its web interface at `/frontend/`.

### Key Features & Design System
*   **Single `frontend/` Folder**: Served via the entity's HTTP adapter under `/frontend/*`. Auto-built on demand if missing.
*   **Fallback Glass-Brutalism Design System**:
    *   **Theme**: Dark mode by default (`#16181d` solid pastel matte black base).
    *   **Matte Panels**: Receding container panels (`rgba(26, 29, 36, 0.75)` backdrop blur).
    *   **Gloss Interactive Elements**: Floating buttons/inputs with gradient fill & `inset 0 1px 0 rgba(255,255,255,0.20)` specular highlight.
    *   **Neo-Brutalist Structure**: Solid crisp borders (`2px solid rgba(255,255,255,0.85)`) + hard offset drop shadows (`5px 5px 0px rgba(0,0,0,0.90)`).
*   **Centered Layout & Icon-Only Hover-Reveal Paradigm**:
    *   **Centered Alignment**: Header, navigation tabs, cards, and input fields are centered (`margin: 0 auto`, `text-align: center`).
    *   **Icon-Only Default Buttons**: Buttons display **only monochromatic icons by default** (`⚡`).
    *   **Hover-to-Reveal Labels**: Hovering or focusing a button expands its width (`max-width: 200px`) to reveal the text label alongside the icon.
    *   **Hover-to-Reveal Field Labels**: Form field labels remain hidden (`opacity: 0`) until the field container is hovered or focused.
*   **Sub-App Multi-Tab Aggregation**: Automatically creates a dedicated tab for each embedded sub-app, embedding its UI inside an iframe at `/frontend/subapps/<prefix>/`.
*   **Style Trickle-Down**: Parent `/frontend/styles.css` is served as the central design token authority. Sub-app iframes automatically load the parent stylesheet.
*   **Real-Time Phantom Mirroring**: Connects to `/sse/<fid>`. Programmatic API executions (`/api/<fid>`) animate live on screen with a green glowing border and `🤖 Phantom Execution Active` badge.

---

## 9. Cross-Endpoint Shared UI Component Data Binding Paradigm

To allow output data from one endpoint to dynamically populate input capture controls in another endpoint (e.g., fetching a list of items to populate a dropdown selector for another API):

### Spec Syntax Example

```javascript
// 1. Data Provider Endpoint ("getUsers")
export const getUsersAtom = {
  fid: "getUsers",
  uiSpec: {
    ui_component_enabled: true,
    outputs: [
      {
        field: "users",
        component: "KrnlDropdown",
        label: "Available Users",
        sharedComponentId: "userSelectorSlot", // Output populates this shared slot!
        autoFetch: true                       // Auto-fetches on component mount
      }
    ]
  }
};
```

---

## 10. Mandatory Selection-Source Architectural Philosophy

> [!CRITICAL]
> **CORE ARCHITECTURAL RULE FOR KRNL UI**: Whenever an input field represents a finite set of choices that can be obtained from another endpoint in the same application, developers **MUST NOT** force the user to manually type the value in a `KrnlTextInput`.
> Instead, a `KrnlDropdown` (or tile selector) **MUST** be used, backed by a selection source.

### The Selection-Source Pattern
To implement finite-choice inputs:
1. **Via Shared Slot (`sharedComponentId`)**:
   - The provider endpoint declares an output with `sharedComponentId: "mySlot"` and `autoFetch: true`.
   - The consumer endpoint declares an input with component `'KrnlDropdown'` and `sharedComponentId: "mySlot"`.
2. **Via Direct Source Link (`sourceEndpointId`)**:
   - The consumer input specifies `sourceEndpointId: "ListProviders"` and component `'KrnlDropdown'`. The framework automatically fetches options from `ListProviders` on mount.
3. **Via Dependent Dropdowns (`filterBy`)**:
   - For chained dropdowns (e.g. `modelName` depends on selected `provider`), specify `filterBy: "provider"`. When `provider` changes, `modelName` re-fetches options filtered by the selected provider.

### Compiler & Builder Enforcement
- **`[ERR_UISPEC_SOURCE_ENDPOINT_REQUIRES_DROPDOWN]`**: Setting `sourceEndpointId` on non-dropdown components causes build failure.
- **`[ERR_UISPEC_DROPDOWN_MISSING_SOURCE]`**: Using `KrnlDropdown` without `sharedComponentId`, `sourceEndpointId`, or static `options` causes build failure.
- **Selection Candidate Warning**: Using `KrnlTextInput` for known selection fields (`provider`, `model`, `modelName`, `profile`, `key_id`) emits build-time compiler warnings urging migration to `KrnlDropdown`.

```javascript
// 2. Data Consumer Endpoint ("getUserProfile")
export const getUserProfileAtom = {
  fid: "getUserProfile",
  uiSpec: {
    ui_component_enabled: true,
    inputs: [
      {
        field: "username",
        component: "KrnlDropdown",
        label: "Select User",
        sharedComponentId: "userSelectorSlot", // Binds to shared slot options!
        bindMode: "selected"                  // "selected" = user choice; "all" = full array
      }
    ]
  }
};
```

### Binding Modes (`bindMode`)
*   `"selected"` (Default): Passes the single option value chosen by the user in the UI control to the consumer endpoint payload.
*   `"all"`: Passes the entire array of captured options from the provider endpoint into the consumer endpoint payload.

---

## 11. Frontend Introspection & Debugging API (`/frontend/inspect/*`)

KrnlTS frontends expose a complete suite of pure HTTP JSON endpoints under `/frontend/inspect/*`. This allows AI agents and developers to inspect, test, and debug what the frontend displays without opening a browser or reading source code.

| Inspection Endpoint | Layer | Purpose / Protocol Origin |
|---|---|---|
| `GET /frontend/inspect/health` | **Health (Primary)** | Single-call health summary across all 5 layers (`healthy: boolean`, audit score, console errors). |
| `GET /frontend/inspect/manifest` | Catalog | App catalog, theme, active tab layout, bundle build status. |
| `GET /frontend/inspect/source` | Raw DOM | Raw `index.html` source (equivalent to CDP `DOM.getOuterHTML` / WebDriver `/source`). |
| `GET /frontend/inspect/dom` | Raw DOM | Structured JSON DOM tree of shell, header, nav tabs, and main panel. |
| `GET /frontend/inspect/a11y` | Semantic (A11y) | WAI-ARIA accessibility tree (CDP `Accessibility.getFullAXTree` / Playwright `ariaSnapshot()`). |
| `GET /frontend/inspect/components` | Component Map | Generated React component map, props, file locations (React DevTools equivalent). |
| `GET /frontend/inspect/endpoints` | API Schema | OpenAPI-style list of registered endpoints, JSON schemas, `uiSpec` definitions. |
| `GET /frontend/inspect/elements` | Elements | List of all interactive elements (`button`, `input`, `select`, `toggle`, `textarea`). |
| `GET /frontend/inspect/forms` | Forms | Form field definitions, validators, and submit targets. |
| `GET /frontend/inspect/shared-slots` | Shared Slots | Cross-endpoint shared data binding map, providers, consumers, and slot integrity status. |
| `GET /frontend/inspect/console` | Errors | Captured in-process `console.log`, `console.warn`, and `console.error` logs. |
| `GET /frontend/inspect/network` | Network | Request/response log of `/frontend/api/*` calls (CDP `Network.*` equivalent). |
| `GET /frontend/inspect/har` | HAR Export | Complete **HTTP Archive v1.2** JSON export (importable to Chrome DevTools or Postman). |
| `GET /frontend/inspect/audit` | Quality | Lighthouse-style static quality audit & WCAG compliance scan score (0-100). |
| `GET /frontend/inspect/telemetry` | Telemetry | OpenTelemetry-style API call latency and execution history. |

---

## 12. Process Sequencing & Functional Execution Gates (`requires`)

KrnlTS enforces process execution sequencing both at build time and runtime to eliminate race conditions (such as running magnetic loaders or endpoints before required imports/services are ready).

### Functionality `requires` Specification
Any local functionality registered via `addLocal()` or Atom descriptor can declare dependency preconditions under the `requires` property:

```typescript
this.addLocal({
    id: "processOrder",
    requires: {
        functionalitiesExecuted: ["validateCart", "checkInventory"], // FIDs that MUST have executed first
        flags: ["krnl:magnetic_load_complete"],                     // Internal/system flags that MUST be set
        check: (system) => system.hasFlag("user_authenticated")      // Dynamic Boolean check callback
    },
    api: async (input, { entity: system }) => {
        // Safe to execute: all preconditions verified!
    }
});
```

### Milestone Flags
Entities maintain a thread-safe system flag registry accessed via `setFlag(flagName)` and `hasFlag(flagName)`. Automatically set system milestone flags include:
- `'krnl:magnetic_load_complete'`: Set when `KrnlMagneticLoader.loadAll()` completes.
- `'krnl:ai_layer_ready'`: Set when `initializeAiLayer()` completes.

### Runtime Barrier Enforcement (`ERR_REQUIRES_UNSATISFIED`)
If an endpoint or `callInternal()` call is invoked before its `requires` constraints are met, the call is blocked immediately with an error:
- `ERR_REQUIRES_UNSATISFIED`: Output contains detailed missing items (`missingFunctionalities`, `missingFlags`, `failedCustomCheck`).

### Static Analysis Validation (`[ERR_REQUIRES_UNKNOWN_FID]`)
`npx krnlts-validate` statically analyzes all `requires.functionalitiesExecuted` array targets. If an endpoint requires an unknown or unregistered FID, build validation fails with `[ERR_REQUIRES_UNKNOWN_FID]`.
