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
│       ├── helper_functions/      <-- Modular logic atoms
│       ├── events/                <-- beginning, during, end atoms
│       └── MyLogic.js             <-- The Assembly Descriptor
└── EntityName.js      <-- The Pure Descriptor (Extends EntityBase or SystemEntityBase)
```

---

## 4. Surgical Import Model

To prevent dependency bloat, we use **Surgical Imports**.
*   **Entity Descriptors** and **Functionality Roots** do NOT import libraries.
*   Only the **Main Function**, **Helpers**, and **Events** import specific library atoms from the root `/libraries/` folder.

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
