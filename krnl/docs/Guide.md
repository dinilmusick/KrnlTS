# Krnl vNext: The Complete Guide

By **Dinil Palackal**

---

# Getting Started

## 1) Entity composition

An entity is now explicitly split into:

- `localFunctionalities: Map<FID, LocalFunctionality>`
- `remoteFunctionalities: Map<FID, RemoteFunctionality>`
- `collectors: Set<Collector>`

```js
import { krnlEntityBase, krnlLocalFunctionality } from "../../core/index.js";

const add = new krnlLocalFunctionality({
  id: "add",
  state: { calls: 0 },
  api: (input, ctx) => {
    ctx.state.calls += 1;
    return Number(input.a) + Number(input.b);
  },
});

const calculator = new krnlEntityBase({
  id: "Calculator",
  localFunctionalities: [add],
  remoteFunctionalities: [],
});
```

## 2) Local functionality

`LocalFunctionality` is the full definition:

- mutable `state`
- `api(input, context)`
- `helpers`
- `emitters`
- `collectors`
- lifecycle hooks (`onInit`, `onCall`, `onComplete`, `onError`)

## 3) Remote functionality

`RemoteFunctionality` is a proxy only:

- has `target: { entity, functionality }`
- has no local state/helpers/emitters
- forwards call to target local functionality

```js
import { krnlRemoteFunctionality } from "../../core/index.js";

const addRemote = new krnlRemoteFunctionality({
  id: "addRemote",
  target: {
    entity: () => calculator,
    functionality: "add",
  },
});
```

## 4) Calls

```js
await calculator.call("add", { a: 10, b: 20 });
await gateway.call("addRemote", { a: 1, b: 2 });
```

Resolution order:

1. if `fid` is local → call local API
2. else if `fid` is remote → call proxy API
3. else throw not found

## 5) Event forwarding

Remote functionality can subscribe to target local emitters using `bindEvents()` and route data to collectors.

## 6) Run the live storybook

```bash
python -m http.server 4173
# http://localhost:4173/krnl/examples/storybook/index.html
```

Use storybook as the main website to navigate and run all exhibits.

---

# API Reference

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

---

# Networking

Networking in Krnl is designed to be **observable**, **decoupled**, and **uniform**. In the latest architecture, there is no central hub. Every system is a pluggable block that can find and wire itself to any other block on the network.

---

## 1. Peer-to-Peer Discovery

Every `krnlSystemEntityBase` has a built-in discovery mechanism using **UDP Beacons**.

### How it works:
1.  **Advertising**: When you call `startDiscovery()`, the system begins shouting its name and port to everyone on the local network (LAN).
2.  **Listening**: Simultaneously, it listens for shouts from other Krnl systems.
3.  **Peer Table**: It maintains a local list of all active systems it has heard from.

```javascript
// Start discovery on the default port (10101)
await mySystem.startDiscovery();

// See who else is out there
const peers = mySystem.listPeers(); 
// Returns [{ name: "OtherApp", address: "192.168.1.50:10099", lastSeen: ... }]
```

---

## 2. Introspection (The Manifest)

Before wiring systems, you can "look inside" a remote system to see its available ports. This is called the **Manifest**.

### Input Ports (Can receive data):
- **Collectors**: Continuous data streams.
- **One-Shots**: Request-Response endpoints (Returned Functionalities).

### Output Ports (Can send data):
- **Emitters**: Continuous data broadcasts.
- **Broadcasts**: Event-driven streams.

```javascript
// Ask a remote system for its manifest via RPC
const manifest = await mySystem.commComponent.callWsRpc(peer.address, 'get-manifest');
console.log(manifest.outputs.emitters); // e.g. ["audio-out", "midi-out"]
```

---

## 3. The Wiring Rite

Wiring is the act of connecting an **Output** from one system to an **Input** of another. The `wire()` method abstracts all the WebSocket and RPC logic.

### Mode A: Local Output -> Remote Input
Connect your system's data to a remote consumer.
```javascript
await mySystem.wire("RemoteApp", {
    localOutput: "my-data-out",
    remoteInput: "their-data-in"
});
```

### Mode B: Remote Output -> Local Input
Subscribe your system to a remote producer's data.
```javascript
await mySystem.wire("RemoteApp", {
    remoteOutput: "their-signal",
    localInput: "my-listener"
});
```

---

## 4. Implementation Rules

1.  **Inheritance**: Always extend `krnlSystemEntityBase` for your main system entry.
2.  **Discovery**: Call `startDiscovery()` immediately upon system startup.
3.  **No Raw Sockets**: Never use raw `ws` or `net` modules. Always use `this.commComponent` or `this.wire()`.
4.  **Uniform Ports**: By convention, use the `manifest` to discover port names rather than hardcoding them.

---

## 5. Network Transparency

Because the discovery mechanism uses IP addresses, the code is identical whether the systems are on the **same machine** or **different machines** on the same network. 

- **Local**: Discovery finds `127.0.0.1`.
- **Remote**: Discovery finds `192.168.x.x`.
- **Logic**: Stays exactly the same.

---

# Project Structure: Canonical Guide

By **Dinil Palackal**

This document defines the strict physical and logical organization of a Krnl project. 

---

## 1. The Root Entity (The Server)

Every project starts with a **Root Descriptor** file. This file MUST:
1.  Extend `krnlSystemEntityBase`.
2.  Be a **Pure Descriptor** (no logic code).
3.  Instantiate itself at the end of the file.

### Why extend `krnlSystemEntityBase`?
It provides built-in, inherited capabilities:
- **WebSocket Server**: Starts automatically on the provided port.
- **`startDiscovery()`**: Implements UDP beaconing to find other systems on the network.
- **`wire()`**: Connects local logic to remote systems via the network.
- **Telemetry**: Inherited `getTelemetry` and `heartbeat` logic.

---

## 2. Directory Scaffolding

Every Entity folder (Root or Component) follows this mandatory structure:

```text
/EntityName/
├── entities/          <-- Sub-component descriptors
├── functionalities/   <-- Logic atoms
│   └── MyLogic/
│       ├── main_function/logic.js
│       ├── helper_functions/
│       ├── events/
│       └── MyLogic.js <-- Logic Assembler
└── EntityName.js      <-- The Pure Descriptor
```

### Pure Descriptors: The Rule of Zero Logic
Files like `UltrstProject.js` or `Display.js` must NEVER contain lone functions or logic blocks. Their only purpose is to:
- Import logic atoms.
- Summon component entities.
- Describe the Interface (IO).

---

## 3. The Root-Only Library
The `/libraries/` folder exists **only** at the project root.
- **Rule**: Component entities do not have local libraries.
- **Usage**: Main logic files import surgically from the root library (e.g., `import { X } from "../../../libraries/Concepts.js"`).

---

## 4. The Bootstrapping Rite

The root descriptor is the entry point. It handles the "Big Assembly" and kicks off discovery.

```javascript
// RootServer.js
import { krnlSystemEntityBase } from "krnl/core";

export class RootServer extends krnlSystemEntityBase {
    constructor(port) {
        super("MyServer", null, port);
        // 1. Assemble logic
        // 2. Summon components
        // 3. Kick off inherited system logic
        this.startDiscovery();
    }
}

// 4. The ONLY loose code allowed:
new RootServer(10091);
```
