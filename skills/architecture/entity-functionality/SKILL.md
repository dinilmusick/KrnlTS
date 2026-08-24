---
name: entity-functionality-architecture
description: Directives for Entity-Functionality folder architecture, main functionality files, helper folders, events, state isolation, and System Entity entry point.
---

# ENTITY & FUNCTIONALITY ARCHITECTURE GUIDELINES

## 1. GROSS ARCHITECTURAL HIERARCHY (KRNLTS-COMPATIBLE STANDARD)
All projects authored or maintained by the AI agent MUST strictly conform to this recursive layout, **even when the core `@dinilmusick/krnlts` library is not an explicit project dependency**:

```
PROJECT_ROOT/
├── assembler.ts (or index.ts)       → System Entity entrypoint & gateway orchestrator
├── krnl.json                         → System manifest & subapp configuration
│
├── libraries/                        → Universal Shared Concept Libraries
│   ├── MathConcepts.ts               → Pure math, calculations, vector algorithms
│   ├── DataConcepts.ts               → Canonical types, indexing, grouping, diffing, lenses
│   ├── ValidationConcepts.ts         → Schema validation & assertion contracts
│   ├── StringConcepts.ts             → Interpolation, slugification, casing, sanitization
│   ├── GraphConcepts.ts              → Graph topology, traversal, topological sort
│   ├── StateConcepts.ts              → State machine transitions & reducers
│   └── UIConcepts.ts                 → Theme tokens, palettes, visual helpers
│
├── entities/                         → Recursive Domain Entity Tree
│   └── <EntityName>/                 → e.g., Billing, User, Inventory, Device
│       ├── <EntityName>.ts           → Entity orchestrator class (/** @role skeleton */)
│       │
│       ├── functionalities/          → Atomic capability units
│       │   └── <FeatureName>/        → e.g., ProcessPayment, CreateUser, SyncOrder
│       │       ├── <FeatureName>Atom.ts → Metadata descriptor & capability spec
│       │       ├── main_function/
│       │       │   ├── logic.ts      → Core orchestrator (receives input, { state, entity })
│       │       │   └── lifecycle.ts  → onMount / onTeardown lifecycle hooks
│       │       ├── state_data/
│       │       │   └── state.ts      → State schema & atomic accessors (/** @role component */)
│       │       ├── helper_functions/ → Pure functions (Layer 0A, /** @role component */)
│       │       ├── events/           → Domain event emitters (/** @role component */)
│       │       └── manifest.json     → Declared dependencies, tools, resources
│       │
│       └── entities/                 → Recursive child entities (arbitrary depth)
│           └── <ChildEntityName>/
│               ├── <ChildEntityName>.ts
│               └── functionalities/
│
├── protocol_adapters/                → Ingress Network Adapters (HTTP, WSS, MCP)
│   ├── HttpsAdapter.ts               → REST routes (/call/{fid}, /api/...)
│   └── WssAdapter.ts                 → WebSocket RPC & live event mirroring
│
└── frontends/                        → UI Packages (Vite/React apps or Glass-Brutalist UIs)
```

---

## 2. FUNCTIONALITY SPECIFICATION (QUAD-UNIT PACKAGING)
- **Folder Naming**: 1-to-1 matching feature name (`functionalities/<FeatureName>/`).
- **Internal Quad-Unit Structure**:
  - `main_function/logic.ts`: Primary orchestrator receiving `(input, { state, entity })`.
  - `main_function/lifecycle.ts`: Optional `onMount` and `onTeardown` handlers.
  - `state_data/state.ts`: Initial observable state schema and atomic getters/setters.
  - `helper_functions/`: Subdirectory isolating modular, pure Layer 0A helper functions.
  - `events/`: Subdirectory isolating domain event definitions and emitters.
  - `manifest.json`: Declared npm packages and system tools required by this functionality.
- **Stateless Preference**:
  $$\text{Preference}(\text{Functionality}) = \text{Stateless} \succ \text{Stateful}$$
  Use `state_data/state.ts` only when persistent runtime state is mandatory.

### 2.1 EVENT-DRIVEN COMMUNICATION OVER ON-TICK / POLLING INVARIANT
```
∀ communication, synchronization, or change detection:
  pattern ≡ EVENT_DRIVEN  (via events/*.ts, entity.emitEvent, entity.on, or reactive streams)
  polling ≡ STRICTLY_FORBIDDEN (default)
```
- **Prohibit onTick / Polling Loops**: AI agents MUST NOT implement `onTick()`, `tick()`, `setInterval()`, or recursive `setTimeout()` loops for state synchronization, checking file changes, or waiting on task completions.
- **Strict Event-Driven Pattern**: State mutations emit `state:changed`, domain events trigger down-stream actions via `entity.emitEvent("domain:action", payload)` and subscribers receive updates via `entity.on("domain:action", handler)`.
- **Sole Exception for Polling**: Polling is permitted ONLY when integrating with external third-party systems that have no WebSockets, webhooks, SSE, or event streams. When required, use exponential backoff with jitter and document why event-driven mechanisms are unavailable.

---

## 3. ENTITY SPECIFICATION (ORCHESTRATOR SKELETON)
- **Role**: Groups and orchestrates child functionalities and recursive child entities.
- **Orchestration**: Manages state, coordinates data flow across child functionalities, and constructs execution pipelines (`Flows`).
- **Class Pattern**: Subclasses `Entity<TState, TEvents>` (or follows the `Entity` interface pattern).
- **Metadata**: Annotated with `/** @role skeleton */` and enforced to be an impure orchestrator.

---

## 4. SYSTEM ENTITY (APP ENTRYPOINT & INGRESS BOUNDARY)
- **Root Entry Point**: `assembler.ts` (or `index.ts`) at the project root instantiates the top-level System Entity.
- **External Surface**:
  - Exposes REST endpoints (`/call/{fid}`), WebSocket RPC, or MCP tool servers.
  - Acts as the single boundary for external services and client interfaces.

---

## 5. STRUCTURAL CHANGE ENFORCEMENT
```python
def on_structural_code_change(intent):
    """
    MANDATORY PRE-CHECK BEFORE CREATING OR REFACTORING CODEBASE STRUCTURE:
    1. Identify target Entity and Functionality.
    2. Structure folder as: entities/<Entity>/functionalities/<Feature>/{main_function/, state_data/, helper_functions/, events/, manifest.json}
    3. Ensure stateless design where possible.
    4. Register functionality into Entity orchestrator.
    5. Expose public operations through the System Entity entry point.
    """
    assert has_feature_folder(intent.functionality_name)
    assert has_main_and_subdirs(main_function=True, helper_functions=True, state_data=True, events=True)
    assert is_registered_in_entity(intent.parent_entity)
    assert is_exposed_via_system_entity(intent.external_contract)
```
