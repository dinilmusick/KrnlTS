# Krnl vNext API Reference

## `krnlEntityBase`

The foundation of every Krnl system. Entities are containers for logic (Functionalities) and their scoped state.

Constructor:

```ts
new krnlEntityBase(name: string)
```

Methods:

- `addLocal(localFunctionality)`: Registers a logic block. If `public`, it's promoted to the `interface`.
- `addRemote(remoteFunctionality)`: Registers a proxy to an external entity.
- `call(fid, input?, opts?)`: Executes a functionality. `opts.caller` is used for `multiState`.
- `dispose()`: Recursive teardown of the entity and all child components.

Properties:

- `id: string`: Unique identifier.
- `interface: krnlInterface`: The IO Hub (Emitters/Collectors).
- `hierarchyManager: krnlEntityCompositionalHierarchyManager`: Manages singleton components.

---

## `krnlLocalFunctionality`

A self-contained block of logic and private state.

```ts
new krnlLocalFunctionality({
  id: string,
  visibility: 'public' | 'private',    // 'private' is invisible to owner entities
  stateModel: 'single' | 'multi',     // 'multi' tracks state per caller name
  initialState: object,               // Template for the state
  api: (input, context) => any,       // Logic (receives state, emitters, caller, etc.)
  emitters: Record<string, krnlEmitter>,
  lifecycle: { onInit, onCall, onError }
})
```

**State Scoping:**
- In `single` model: One shared `state` object.
- In `multi` model: A unique `state` is created and stored for every unique `caller`.

---

## `krnlRemoteFunctionality`

A proxy used to "borrow" logic from external (non-component) entities.

```ts
new krnlRemoteFunctionality({
  id: string,
  targetEntity: krnlEntityBase,
  targetFunction: string,
  visibility: 'public' | 'private'
})
```

---

## 🏗️ Interface Promotion (The Compositional Paradigm)

Krnl now uses **Automatic Promotion**. 

1. When you add a component to an owner: `owner.hierarchyManager.createComponentEntity("MyComp")`.
2. When that component adds a `public` functionality: `MyComp.addLocal({ id: "Compute", visibility: "public", ... })`.
3. **The Result:** The `Compute` functionality is automatically mirrored on the `owner.interface`. You can now call `owner.call("Compute", data)` as if it were local to the owner.

This allows for deep nesting of logic while maintaining a flat, usable API at the top level.
