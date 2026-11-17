# FRNL-TS Documentation

FrnlTS is the frontend semantic runtime counterpart to KrnlTS.

FrnlTS has one UI entity model: ordinary React components with Frnl state/event machinery attached through the runtime and React hook. It does not define or wrap components in separate primitive/composite classes.

## Documentation

- [Architecture](architecture.md)
- [Terminology](terminology.md)
- [Slots](concepts/slots.md)
- [Flows](concepts/flows.md)
- [Bounds](concepts/bounds.md)
- [Visual Assets](concepts/visual-assets.md)
- [Properties](concepts/properties.md)
- [Curves](concepts/curves.md)
- [States](concepts/states.md)
- [Phases](concepts/phases.md)
- [Events](concepts/events.md)
- [Runtime](runtime.md)

## Foundational model

A React component owns its Frnl state definition and state-resolved events through `useFrnlComponent()`. Components can render other components normally or use `FrnlSlot` where a stable semantic slot boundary is needed.

Slots, flows, state, events, visual parameters, themes, and runtime lifecycle are capabilities of the same component model. None requires a second component class.

Concrete UI libraries such as Floks author ordinary React components against these contracts.

## Runtime validation

FrnlTS uses Zod for runtime validation of semantic inputs, property updates, event payloads, slot mutations, and other runtime boundaries.
