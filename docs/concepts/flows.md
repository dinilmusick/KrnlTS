# Flows

A Flow is frontend orchestration that coordinates Frnl Events, Slot Events, state transitions, properties, data, and external functions.

Flows are not UI components and do not introduce another component class.

## Inputs

A Flow may be triggered by:

- a component Event
- a Slot Event
- an explicit programmatic invocation
- another Flow step

## Actions

A Flow may coordinate:

- reading or updating component Properties
- changing component State
- changing a Slot occupant
- changing Slot Properties
- changing repeatable Slot collection membership
- invoking another semantic Event
- invoking an external function
- validating or transforming data
- branching and continuing to later steps

Application business logic remains in application functions/libraries; the Flow defines the semantic coordination boundary.

## Example

```text
Login.submit.click
        ↓
validate credentials
        ↓
Login.state = submitting
        ↓
invoke login()
        ↓
   ┌────┴────┐
success    failure
   ↓          ↓
success     error
```

The exact execution mechanism is runtime-specific.

## Validation

Flow inputs and injected payloads are validated with Zod before they cross the semantic runtime boundary.
