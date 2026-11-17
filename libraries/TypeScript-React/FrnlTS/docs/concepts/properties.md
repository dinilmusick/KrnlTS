# Properties

FRNL treats editable properties as first-class data.

A property may hold a static value or a Curve.

Properties can be **overridable** and, where the semantic type permits, **modulatable**.

- **Overridable** means a value defined at a lower-level entity can be replaced by a value supplied by its containing context.
- **Modulatable** means the property's value can be driven over time or otherwise varied by a modulation source defined by the semantic contract.

The exact set of properties is extensible. The framework should not prematurely constrain State to a fixed property whitelist.

## Component and constituent properties

Properties may belong to Bounds, Visual Assets, or other editable parts of a Component.

For example, Visual Asset properties can be overridden and can use Curves for normalized temporal evolution.

## Slot properties

Components using Slots also expose Slot Properties.

Slot Properties describe the relationship between the Slot and its occupant rather than the intrinsic definition of the occupant.

Typical Slot Properties include basic layout and transformation controls such as:

- position / translation
- size / scale
- rotation
- visibility
- ordering
- alignment

Slot Properties are therefore a semantic layout boundary. They let a parent component adjust an occupant without modifying the occupant's reusable definition.

Slot Properties may be overridable and modulatable. A modulatable Slot Property can use a Curve with the same canonical one-second domain and Attack/Sustain/Release timing semantics used elsewhere in FRNL.

For example, a Slot's position, scale, or rotation can be animated independently of the contained Component.

## Component properties

Components may expose Properties for semantic configuration.

## State interaction

States may contain values for Properties and Visual Parameters that the component exposes.

A State may affect Component Properties, visual parameters, or coordinate child states.

A Slot Property can participate in the same state/curve system, allowing a Component State to alter or animate layout relationships.

The property remains data; an Event represents an occurrence that can read or modify it; a Flow can coordinate those changes.

## Runtime validation

FrnlTS uses **Zod** as the default runtime validation mechanism at semantic input boundaries. TypeScript types describe compile-time contracts; Zod validates runtime data before it enters the framework.

Injected property values and property mutation payloads must pass the applicable Zod schema. Invalid runtime input is rejected rather than being silently stored.
