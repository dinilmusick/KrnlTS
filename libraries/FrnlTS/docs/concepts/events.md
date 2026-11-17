# Events

Frnl events are owned by component state definitions and resolved through the component's current state.

## Event resolution

```text
React event / keyboard / application code / another component
                         ↓
                    component event
                         ↓
                  current Frnl state
                         ↓
                  state.events[event]
                         ↓
                     functionId
                         ↓
                      handler
```

The source of an input does not directly invoke the implementation. It enters the same semantic event resolution path.

## State-local events

A state may define an event with a given name and function ID. The same event name may resolve to a different function when the component changes state.

This keeps event behavior declarative while handlers remain ordinary application functions.

## Slot events

Slots have their own lifecycle event boundary:

- **stateChanged** observes state transitions of the current occupant.
- **occupantChanged** observes replacement/removal of the current occupant.
- **propertyChanged** observes Slot property changes.
- **collectionChanged** observes repeatable Slot collection changes.

Slot events can be consumed by flows or application code without becoming events of the occupant component.

## Callable events

Every registered component event exposes a callable interface through the runtime. React handlers, keyboard bindings, application code, and other components can use the same trigger.

## Payload validation

Framework-defined event payloads cross a Zod validation boundary before being recorded or dispatched.
