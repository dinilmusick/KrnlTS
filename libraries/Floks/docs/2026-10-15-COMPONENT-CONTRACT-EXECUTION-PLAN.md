# FLOKS — Component Contract & Execution Boundary Plan

STATUS := CANONICAL
DATE := 2026-10-15

## PURPOSE

FLOKS remains the reusable React UI/component library. It must be backend-agnostic while exposing enough component contracts for SKIPO to map UI interactions to application commands.

## COMPONENT CONTRACT

Each reusable component exposes, as applicable:

```
ComponentContract {
  id
  version
  props
  state
  events
  actions
  accessibility
  visualContract
}
```

Events/actions are declarative interaction surfaces. They do not execute backend services.

Example:

```
Button
  event: clicked
      ↓
SKIPO interface mapping
      ↓
command: workspace.create
```

## FORBIDDEN DEPENDENCIES

FLOKS components MUST NOT import:
- DEPM/QWNSR services
- SKIPO application implementation
- KLOKS server backend
- BullMQ server/Redis
- database adapters
- provider implementations
- server credentials

FLOKS may consume shared/public contracts only where required for a stable frontend contract.

## RESPONSIBILITY SPLIT

FLOKS:
- component rendering
- props/state/event/action contracts
- visual/theming contracts
- reusable UI behavior

SKIPO:
- interface graph
- event/action → command mapping
- frontend execution bridge
- application composition

KLOKS:
- queue/execution/backend/workspace mechanisms

Application:
- application backend facade
- application service registration

## NPM DISTRIBUTION

FLOKS MUST be publishable as:
```
@ultrst-armada/floks
```

Before publication:
- build
- typecheck
- tests
- export/manifest validation
- declaration validation
- React peer dependency validation
- clean consumer fixture install/import
- `npm pack --dry-run`

Use the existing repository release/versioning mechanism.

## ACCEPTANCE

A consumer can install FLOKS from NPM and import public components/contracts without pulling server-only dependencies or application-specific code.
