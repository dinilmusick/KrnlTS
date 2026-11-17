# States

A State is a named definition of semantic configuration and editable property values.

Components define States.

## Component States

For a Component, a State describes editable property values, state-owned visual parameters, events, and phases.

A parent component coordinating child components in its Slots may transition states to coordinate child components or affect Slot Properties without owning independent visual assets.

For example:

    LoginForm
    ├── State: submitting
    │   ├── coordinate child states
    │   ├── change submit Slot visibility/transform
    │   └── represent form-level submission status
    └── visual representation owned by component definitions

## Slot State Events

Because a Slot has its own Event boundary, a state transition of the component occupying a Slot can produce a Slot-level State Changed event.

This does not transfer State ownership to the Slot.

    Component
        │
        └── State changes
                ↓
            Slot.stateChanged

The component remains the owner of its State; the Slot observes and exposes the Slot-level event.

## Temporal semantics

State does not own Curve duration. Curves have a canonical one-second domain, while Attack and Release phases provide finite durations and Sustain loops the one-second domain.

A State contains Attack property definitions, Sustain property definitions, and Release property definitions.

Those definitions may contain static values or Curves for editable properties, including applicable Slot Properties.

A UI entity may define any number of States.

The framework should not prescribe a fixed whitelist of State properties. Any editable property represented by the entity can participate in a State.
