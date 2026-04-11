# KrnlJS Guide: The Ultrst Logic Engine

By **Dinil Palackal**

KrnlJS is the core library for the Krnl ecosystem, providing a uniform syntax and API across JavaScript projects. It enforces a strict physical directory hierarchy and the **Ultrst Philosophy**: treat code like physical hardware where every Entity is a "Box" with specific input and output ports.

---

## 🏗️ 1. The Philosophy: Atomic Scaffolding

Every entity must follow this strict scaffolding to ensure logic isolation and prevent "spaghetti code."

### Pure Descriptor Policy
Entity and Functionality descriptor files are **assembly-only**. They must NOT define runtime logic or state.
*   Runtime logic belongs only in `main_function/`, `helper_functions/`, or `events/`.
*   Runtime state data belongs only in `state_data/`.

### Mandatory Directory Structure
```text
/EntityName/
├── entities/          <-- Sub-component descriptors
├── functionalities/   <-- Logic atoms
│   └── MyLogic/
│       ├── main_function/logic.js <-- Main Logic Atom (Input Port)
│       ├── state_data/state.js     <-- State data atoms
│       ├── helper_functions/      <-- Modular logic atoms
│       ├── events/                <-- beginning, during, end atoms
│       └── MyLogic.js             <-- The Functionality Descriptor
└── EntityName.js      <-- The Entity Descriptor (Assembler)
```

---

## 📦 2. Core Base Classes

| Class | Role |
| :--- | :--- |
| `krnlEntityBase` | Fundamental building block. Supports recursive interface promotion. |
| `krnlSystemEntityBase` | Root-level server (always a Singleton). Adds WebSocket/P2P Discovery features. |
| `krnlNetworkOrchestratorEntityBase` | Specialized system entity for peer inspection + orchestrated inter-system route management. |

---

## 🧠 3. Functionalities (Logic Atoms)

Functionalities are the processing units inside an Entity. They can be **Local** (owns the logic) or **Remote** (proxies to another entity).

### Local Functionality
- **`initialState`**: Literal state defined in `state_data/state.js`.
- **`api`**: The main logic function (`main_function/logic.js`).
- **`visibility`**: `public` (bubbles up to owner) or `private` (stops at this entity).

### Remote Functionality (Proxies)
Uses a **Transport Adapter** to forward calls.
- `MemoryTransportAdapter`: (Default) for same-process communication.
- `WebSocketTransportAdapter`: For distributed systems over the network.

---

## ⚡ 4. Advanced Features (v1.2.0+)

### 📡 Transport-Agnostic RPC
Entities are agnostic to where functionalities execute. You can swap adapters in the descriptor without changing runtime logic.
```javascript
import { WebSocketTransportAdapter } from "krnljs";

this.addRemote({
    id: "RemoteLogic",
    transport: new WebSocketTransportAdapter(this.commComponent, "127.0.0.1:10091"),
    targetFunction: "DeepLogic"
});
```

### 🔄 Implicit Reactivity (Proxy State)
All functionality state is wrapped in a `Proxy`.
- Mutating `state.value = x` automatically fires a `state:changed` event.
- No need for manual event boilerplate for state-syncing.

### ⏳ Lifecycle Hooks
Functionalities can manage their own resources safely.
- **`onMount`**: Called when bound to an entity. Use for initializing DB pools, sockets, etc.
- **`onTeardown`**: Called on entity disposal. Use for cleanup.

### 🛡️ Schema Validation
Optional `schema` block for automated payload validation.
- Supports Zod-like objects or custom functions.
- Throws `KrnlSchemaError` *before* the logic is executed if input is invalid.

---

## 📡 5. Messaging & Wiring

### Emitters & Collectors
- **Emitter**: Outbound socket. Broadcasts signals (Convention: `FunctionalityID:EmitterID`).
- **Collector**: Inbound socket. Listens for signals.

### Sacred Wiring
Owners are responsible for patching ports together.
```javascript
const source = producer.interface.getEmitter("Ping:ping-emitted");
const sink = consumer.interface.getCollector("Logger");
sink.subscribeTo(source);
```

### Collector Modes
- **Streaming (default)**: Receives every message.
- **One-shot (`mode: "once"`)**: Auto-unsubscribes after one message.
- **Promise-style**: `const msg = await collector.collectNext(emitter, timeout)`.

---

## 🏗️ 6. Hierarchy & Bubbling

Public functionalities automatically "bubble up" to their owners as remote proxies.
- To stop bubbling, call `proxy.setVisibility('private')` in the owner's constructor.
- This prevents "Interface Pollution" at the system level.

---

## 📶 7. System Availability & Discoverability

`krnlSystemEntityBase` includes built-in flags for network visibility and access reservation.

### Flags
- `discoverable` — if `false`, the system stops broadcasting discovery beacons.
- `busy` — indicates the system has been reserved and should reject external access.
- `reservedBy` — service name that currently owns the reservation.
- `reservedAt` — timestamp of when the reservation was set.

### APIs
```javascript
system.setDiscoverable(false);
system.reserveFor("SupervisorSystem");
console.log(system.getSystemFlags());
// { discoverable: false, busy: true, reservedBy: "SupervisorSystem", reservedAt: ... }

system.releaseReservation("SupervisorSystem");
system.setDiscoverable(true);
```

### Discovery behavior
- Beacons now include `discoverable`, `busy`, and `reservedBy`.
- `listPeers()` only returns currently visible peers and prunes stale peers by TTL (`peerTtlMs`).
- `discoverPeers({ includeBusy: false })` filters out reserved peers.

### Access control behavior
- Incoming network wiring/calls are guarded when a system is reserved.
- Outgoing `wire(...)` calls also reject when the target peer is marked busy.

---

## 🔄 8. Entity Instance Policy

- **Singleton**: `true` (default) means only one instance per owner/base-name.
- **Multi-Instance**: Set `Singleton = false` to allow multiple instances (`Name#1`, `Name#2`).
- Dispose of unused instances via `owner.disposeOwnedComponent("Entity#ID")`.

---

## 🧭 9. Network Orchestrator Pattern

Use an orchestrator when you need a **third-party control plane** that can inspect and wire systems at runtime.

### Core orchestrator methods
- `getPeerManifest(peerId)`
- `listPeerRoutes(peerId)`
- `connectSystems(sourcePeerId, targetPeerId, options)`
- `disconnectPeerRoute(peerId, routeId, { force })`

### Managed vs immutable routes
When creating routes through the orchestrator, set:
- `externallyMutable: true` → other orchestrators may disconnect (policy permitting).
- `externallyMutable: false` → only the managing orchestrator can disconnect (unless forced internally by owner disposal).

### Minimal flow
```javascript
const route = await orchestrator.connectSystems("SourceSystem", "TargetSystem", {
  sourceEmitter: "Pulse:pulse",
  targetCollector: "system-commands",
  externallyMutable: false,
});

await orchestrator.disconnectPeerRoute("SourceSystem", route.id);
```

See runnable reference: `examples/example7/OrchestratorSystem/OrchestratorSystem.js`.
