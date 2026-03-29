# Krnl vNext: The Ultrst API Reference

## `krnlEntityBase`

The **Master Assembler** of your project. Every entity is a folder containing modular atoms.

Constructor:

```ts
new krnlEntityBase(name: string)
```

Methods:

- `addLocal(atom)`: Registers a functionality. Automatically handles interface promotion for `public` logic.
- `addLibrary(id, content)`: Registers a shared data struct or utility imported from the `/libraries/` folder.
- `addRemote(proxy)`: Registers a proxy to an external singleton entity.
- `call(fid, input?, opts?)`: Executes logic. Automatically injects `caller` metadata.
- `dispose()`: Recursive teardown of the entity tree.

---

## `krnlLocalFunctionality`

The **Logic Atom**, typically assembled from modular files.

```ts
new krnlLocalFunctionality({
  id: string,               // Name of the functionality folder
  visibility: 'public',     // 'public' logic bubbles up to owner interface
  stateModel: 'single',     // 'multi' tracks state per caller name
  initialState: {},         // Data structure for this functionality
  api: Function,            // The "Main Function" atom
  helpers: Object,          // The "Helper Functions" atoms
  events: {                 // The "Events" folder logic
    beginning: Function,    // (onInit)
    during: Function,       // (onCall)
    end: Function,          // (onComplete)
    failure: Function       // (onError)
  }
})
```

---

## 🏗️ The Ultrst Directory Philosophy

By **Dinil Palackal**, this philosophy ensures atomic separation of code.

### Entity Hierarchy:
- **`entities/`**: Component entities found in the sub-directories.
- **`functionalities/`**: Logic folders (Main Function, Helpers, Events).
- **`libraries/`**: Modular data structs/utils.

### Logic Bubbling:
1. `CompA` is a component of `SystemB`.
2. `CompA` has a `public` functionality `compute`.
3. `SystemB` automatically has `compute` in its **Interface**.
4. You call `SystemB.call("compute")` and it flows through to `CompA`.
