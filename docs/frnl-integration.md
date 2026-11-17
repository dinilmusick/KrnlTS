# Floks & FrnlTS Semantic Integration Architecture

## 1. Architectural roles

Floks is the concrete visual/component library. FrnlTS is the canonical semantic frontend runtime and contract layer. Skipo owns application page composition and page-scoped orchestration.

Floks must not introduce a second semantic entity model, orchestration facade, slot system, or duplicated business-logic layer.

## 2. Frnl component contract

Every canonical interactive Floks component registers a Frnl component definition with:

- states
- state-local callable events
- event function IDs and handlers
- properties
- visual parameters
- component scope

React event handlers are adapters into the Frnl event boundary. The same callable component events can therefore be invoked by application code and page orchestration.

## 3. Page orchestration

The canonical Frnl page component accepts Frnl orchestration definitions and mounts them against the active Frnl store for the lifetime of the page.

A page orchestration wires existing component capabilities:

component A event -> page orchestration -> component B event
component A event -> page orchestration -> legitimate library/service capability

Orchestration is sequencing and wiring, not reusable business logic. Reusable behavior belongs in libraries/functions. Page-level events remain appropriate for genuine page events.

## 4. Store architecture

Floks exposes:

1. floksFrnlStore — canonical default store.
2. getFloksFrnlStore() — default-store getter.
3. FrnlStoreProvider — application/subtree store injection.
4. useFloksFrnlStore() — active-store hook.

The canonical page and Frnl components resolve the active store through this boundary.

## 5. Legacy architecture

The old slot/occupant/bounds/visual-asset compatibility model is not part of the current FRNL page architecture. The obsolete compatibility implementation has been removed rather than retained as an alternate API.

## 6. Export boundary

Public Floks Frnl components are exported from packages/ui/src/frnl/index.ts and the package UI facade. Skipo pages consume them through their local components/components.ts facade rather than importing Floks directly.
