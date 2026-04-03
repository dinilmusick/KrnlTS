# Krnl: The Ultrst Logic Guide

By **Dinil Palackal**

This guide explains the design of Krnl software blocks. In the **Ultrst Philosophy**, we treat code like physical hardware. Every Entity is a "Box" with specific input and output ports.

---

## 1. IO Hub Mechanics: Ports vs. Triggers

A **Functionality** is a processing unit inside an Entity. To understand how to interact with it, you must distinguish between its **Ports** (for wiring) and its **Manual Trigger** (for direct code).

### A) The "Main Function" is the Input Port (Collector)
Every functionality has a primary logic atom (`main_function/logic.js`).
*   **In the Interface**: This is automatically registered as a **Collector**.
*   **Analogy**: This is the "Input Socket." It waits for a signal to arrive from another part of the machine.
*   **Usage**: Use this when you want one software block to trigger another automatically.

### B) The `call()` Method is the Manual Trigger (Finger)
The `call()` function is not a port; it is a way to execute logic directly via code.
*   **Mechanism**: `await entity.call("MyLogic", data)`.
*   **Analogy**: This is like reaching into the box and manually pushing the "Start" button. It bypasses the external wiring and goes straight to the circuitry.
*   **Usage**: Use this when you are writing top-level orchestration and need an immediate result returned to your script.

### C) The "Events" are the Output Ports (Emitters)
Any emitter defined inside a functionality is an output port.
*   **In the Interface**: These are registered as **Emitters** (Convention: `FunctionalityID:EmitterID`).
*   **Analogy**: These are the "Outbound Sockets" or "Spouts." They spray data out whenever the internal logic triggers them.
*   **Usage**: Use these to notify the rest of the network that something happened inside the block.

---

## 2. Interaction Flow Summary

| Concept | Hardware Analogy | Krnl Role | Usage |
| :--- | :--- | :--- | :--- |
| **Main Function** | The Circuitry | Logic Atom | The actual code being run. |
| **`call()`** | Pushing a Button | Manual Trigger | Use when you want a result returned to your code. |
| **Collector** | "Input Port" | Interface Entry | Use when you want OTHER blocks to trigger the logic. |
| **Emitter** | "Output Port" | Interface Exit | Use when you want to broadcast events to the world. |

---

## 3. Atomic Scaffolding (The Folder Rule)

Every entity must follow this strict scaffolding to ensure logic isolation:

```text
/EntityName/
├── entities/          <-- Sub-component descriptors
├── functionalities/   <-- Logic atoms
│   └── MyLogic/
│       ├── main_function/logic.js <-- Surgical Imports happen here
│       ├── state_data/state.js     <-- State data atoms live here
│       ├── helper_functions/      <-- Modular logic atoms
│       ├── events/                <-- beginning, during, end atoms
│       └── MyLogic.js             <-- The Assembly Descriptor
└── EntityName.js      <-- The Pure Descriptor (Extends EntityBase or SystemEntityBase)
```

---

## 4. Surgical Import Model

To prevent dependency bloat, we use **Surgical Imports**.
*   **Entity Descriptors** and **Functionality Roots** are assembly-only. They do not define runtime logic.
*   Runtime logic is allowed only in **Main Functions**, **Helpers**, **Events**, and **Library files**.
*   Runtime data models are allowed only in **`state_data/` atoms** and **Library files**.
*   Only logic/data atom files should import project libraries from `/libraries/`.

---

## 5. Peer-to-Peer Networking

Root entities extend `krnlSystemEntityBase` to enable network features:
1.  **`startDiscovery()`**: Shout your presence on the LAN via UDP Beacons.
2.  **`listPeers()`**: See all other available software blocks on the network.
3.  **`wire()`**: Connect a port on your box to a port on a remote box over WebSockets.

```javascript
// Example: Cross-machine wiring
await myServer.wire("RemoteCalculator", {
    remoteOutput: "Calculator:onCalculated",
    localInput: "UIPanel"
});
```

---

## 6. Recursive Bubbling Rules (Nested Entities)

Krnl promotes **public functionalities** from child entities to their owner as remote proxies, and this repeats recursively until the top entity.

### Default behavior
1. `Entity2` adds local functionality `X` with `visibility: "public"`.
2. `Entity1` auto-creates a remote proxy `X` targeting `Entity2`.
3. `Entity0` auto-creates a remote proxy `X` targeting `Entity1`.
4. Calling `Entity0.call("X", input)` forwards down the proxy chain to `Entity2`'s local logic.

### Stopping bubbling intentionally
Set any promoted functionality instance to `visibility: "private"` at the level where bubbling should stop.  
That level can still use it locally, but owners above it will not receive new promotions for that functionality.

---

## 7. Entity Instancing Policy (`Singleton`)

Entities now define a `Singleton` boolean policy:

- `Singleton: true` (default): one instance per owner/base-name.
- `Singleton: false`: multiple instances are allowed (`Name#1`, `Name#2`, ...).

`krnlSystemEntityBase` is always singleton.

Create component entities as usual:

```js
const a = owner.hierarchyManager.createComponentEntity("Worker", WorkerEntity);
const b = owner.hierarchyManager.createComponentEntity("Worker", WorkerEntity);
```

If `WorkerEntity.Singleton = false`, `a !== b`.  
If `WorkerEntity.Singleton = true`, `a === b`.

To prevent unused instances from ballooning:

```js
owner.disposeOwnedComponent("Worker#1");
```

Functionalities are always **single-instance, single-state** per entity instance.  
For parallel independent states, instantiate multiple entities instead of using multi-state functionality.

---

## 8. Streaming vs One-Shot Collection

Krnl now supports two collector subscription modes:

- **Streaming (default)**: receives every future message.
- **One-shot**: receives only the next message, then auto-unsubscribes.

### API

```js
// Streaming (default)
collector.subscribeTo(emitter, (msg) => { ... });

// Explicit one-shot mode
collector.subscribeTo(emitter, (msg) => { ... }, { mode: "once" });

// Promise-style one-shot helper
const msg = await collector.collectNext(emitter, 5000); // optional timeout
```

### When to use which
- Use **streaming** for telemetry, logs, progress, or continuous updates.
- Use **one-shot** for request/response style event waits (e.g., wait for next `ready` event).

There is no extra "streaming emitter type" needed. Emitters are always stream-capable; the collector mode controls whether you consume continuously or once.
