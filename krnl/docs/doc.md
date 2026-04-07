# Krnl: The Ultrst Documentation

By **Dinil Palackal**

## Core Concepts

- [The Ultrst Philosophy](#the-philosophy-atomic-scaffolding): Atomic code management.
- [Handbook: Guide](Guide.md): Detailed usage guide.
- [Example Architecture](example_architecture.md): Folder-based assembly.
- [Examples & Storybook](../../examples/doc.md): Interactive grimoire.

## Key Principles

1.  **Atomic Separation**: Code is split into Main Function, Helpers, and Events folders.
2.  **Interface Promotion**: Public logic "bubbles up" to owner entities automatically.
3.  **Single-State Functionalities**: Each functionality has one state per entity instance (no multi-state functionality model).
4.  **Entity Instance Policy**: Entities expose `Singleton` to control whether multiple instances are allowed under an owner.
5.  **Descriptor Purity Policy**: Entity files and functionality descriptor files are assembly-only. Runtime logic belongs only in logic/library atoms, and state data belongs only in `state_data` or library atoms.
6.  **Transport Agnostic Logic**: Functionalities can be local or remote, and remote calls are abstracted through transport adapters.
7.  **Implicit Reactivity**: State mutations are automatically tracked and broadcasted via Proxies.

---

# Architectural Enhancements (v1.2.0)

### 1. Transport-Agnostic `RemoteFunctionality`
`krnlRemoteFunctionality` no longer requires a direct memory reference. It uses a `TransportAdapter` interface.
- `MemoryTransportAdapter`: (Default) for in-process entity communication.
- `WebSocketTransportAdapter`: For distributed systems.

```javascript
entity.addRemote({
  id: "mathRemote",
  transport: new WebSocketTransportAdapter(entity.commComponent, "localhost:10091"),
  targetFunction: "multiply"
});
```

### 2. Proxied State Observability
All `LocalFunctionality` state objects are wrapped in a Javascript `Proxy`. 
- **Automatic Emission**: Mutating `state.value = x` automatically fires a `state:changed` event.
- **Subscription**: Entities can listen to state changes via `entity.interface.getEmitter("FuncID:state:changed").subscribe(...)`.

### 3. Standardized Lifecycle Hooks
Functionalities now support `onMount` and `onTeardown` hooks in their descriptors.
- `onMount`: Called when the functionality is bound to an entity. Useful for initializing resources (DB pools, sockets).
- `onTeardown`: Called when the entity is disposed. Useful for cleanup.

### 4. Built-In Schema Validation
Functionalities can define an optional `schema` for input validation.
- Supports **Zod** objects (`schema: { input: zodSchema }`) or **Custom functions** (`schema: { input: (data) => boolean }`).
- Throws `KrnlSchemaError` before the logic atom is even executed if validation fails.

---

# Krnl: The Ultrst Logic Engine

By **Dinil Palackal**

## 🏗️ The Philosophy: Atomic Scaffolding
Krnl projects follow a strict physical directory hierarchy. No loose code is allowed inside entity descriptors.

### 1. Mandatory Scaffolding
Every entity folder (root or component) MUST contain:
- **`entities/`**: For sub-component entities.
- **`functionalities/`**: For logic atoms.
- **`Entity.js`**: The pure assembly descriptor.

The root entity of a project adds:
- **`libraries/`**: For project-wide concept definitions.

### 2. No Spare Functions
Logic never lives inside the `Entity.js` file. It must always be atomized into a functionality folder and registered via `addLocal()`.

### 3. The Root Server
The top-level entity MUST extend `krnlSystemEntityBase`. This class provides the built-in server infrastructure (WebSocket/CommComponent) required for exposing the app's functionalities to the network.

---

## 🏗️ Core Base Classes

| Class | Root/Comp | Role |
| :--- | :--- | :--- |
| `krnlSystemEntityBase` | **Root Only** | Top-level server. Exposes functionalities to the system. |
| `krnlEntityBase` | **Components** | Internal logic blocks. Promotes public logic to the owner. |

---

## 📡 Atomic Import Flow
1. **Logic Atoms** surgically import root libraries.
2. **Entity Descriptors** assemble logic atoms into a cohesive block.
3. **System Entities** boot the server and handle inter-system wiring.
