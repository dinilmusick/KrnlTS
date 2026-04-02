# Exhibit 2: Controlled Bubbling & Nesting

This example demonstrates how logic atoms bubble up through an infinite hierarchy of entities and how to use the `visibility` system to stop that flow.

## The Concept: "Logic Bubbling"
In the Ultrst Philosophy, code is atomized. To keep the API usable at the top level, public functionalities from components "bubble up" to their owners automatically.

1.  **Level 3** adds a public logic: `DeepLogic`.
2.  **Level 2** (The Owner) automatically creates a proxy for `DeepLogic`.
3.  **Level 1** (The System) would normally see `DeepLogic` through Level 2.

## The Control: "Stopping the Chain"
If a middle entity (`Level 2`) needs to use a component's logic but doesn't want to expose it to the entity above it, it simply changes the proxy's visibility:

```javascript
const proxy = this.getRemote("DeepLogic");
proxy.setVisibility('private');
```

## Scaffolding Trace
The directory structure reflects the logical nesting:
- `/Level1System/`
  - `Level1System.js` (Root Descriptor)
  - `entities/Level2Entity/`
    - `Level2Entity.js` (Intermediate Filter)
    - `entities/Level3Entity/`
      - `Level3Entity.js` (Logic Source)
      - `functionalities/DeepLogic/`

## Rationale
This prevents "Interface Pollution" at the system level. You only bubble up what the root server actually needs to expose to the network or the user interface.
