# Krnl vNext: The Ultrst API Reference

## `krnlEntityBase`

The **Master Descriptor** of your project. The Entity file is where the public interface is explicitly described.

Constructor:

```ts
new krnlEntityBase(name: string)
```

Methods:

- `addLocal(atom)`: Registers a functionality. 
- `addRemote(proxy)`: Registers a proxy to an external singleton entity.
- `call(fid, input?, opts?)`: Executes logic.
- `dispose()`: Recursive teardown of the entity tree.

---

## `krnlLocalFunctionality`

The **Logic Container**, assembled from self-contained files.

```ts
new krnlLocalFunctionality({
  id: string,               // Unique ID (Folder Name)
  visibility: 'public',     // Logic bubbles up to owner interface
  stateModel: 'single',     // 'multi' tracks state per caller name
  initialState: {},         // Scoped data structure
  api: Function             // The "Main Function" atom
})
```

---

## 🏗️ The Ultrst Project Philosophy

Designed by **Dinil Palackal** for atomic code management.

### Project Structure:
- **`/libraries/`**: Project-wide concepts (e.g. `LogicConcepts.js`). Imported surgically where needed.
- **`/entities/`**: Descriptor files that define the IO ports.
- **`/functionalities/`**: Logic atoms (Main Function, Helpers, Events).

### Surgical Import Model:
Helpers and Events are imported only within the `main_function/logic.js` file of a functionality. This ensures that the functionality root (`Calculator.js`) remains a clean assembly descriptor.
