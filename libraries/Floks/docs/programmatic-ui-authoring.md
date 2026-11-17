# Programmatic UI Authoring

Floks now exposes the same authoring model used by the visual authoring workspace as a render-free TypeScript API.

Import from:

```ts
import {
  createAuthoringSession,
  addAuthoringNode,
  updateAuthoringNode,
  removeAuthoringNode,
  bindAuthoringProperty,
  setAuthoringOperations,
} from '@ultrst-armada/floks/canvas-ui';
```

The API is pure: each operation returns a new `UIAuthoringSession`. It does not mount React components and does not execute backend services.

## Model

```text
UIAuthoringSession
  ├─ nodes
  ├─ bindings
  ├─ operations
  └─ metadata
```

A component node can reference a published Floks asset, declare props/state/events, and bind a property to an application operation. The application layer remains responsible for mapping declared events/actions to real commands.

## Guarantees

- Duplicate node IDs are rejected.
- Parent references are validated.
- Removing a node removes its complete subtree.
- Removing a node also removes dependent bindings.
- Binding the same component property replaces the previous binding.
- Operations never mutate the supplied session.
- No backend, filesystem, scheduler, or application runtime is introduced into Floks.

This is the programmatic surface for agents, generators, tests, and other tooling; the visual authoring workspace consumes the same operations.
