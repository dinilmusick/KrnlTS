# KrnlJS Core Library (v1.2.0)

KrnlJS is a senior-level orchestration library for building reactive, distributed JavaScript systems using an **Atomic Entity Model**. It treats software components like physical hardware with isolated logic, state, and messaging ports.

## 🏗️ Core Principles

- **Atomic Scaffolding**: Strict directory-based logic isolation.
- **Descriptor Purity**: Assembly-only descriptors; no loose runtime logic.
- **Implicit Reactivity**: Proxy-based state observability with automatic change events.
- **Transport Agnosticism**: Distributed RPC via `TransportAdapters` (WS, Memory, etc.).
- **Recursive Bubbling**: Component logic automatically promotes to owner interfaces.

## 🚀 Quick Start

### Installation

```bash
npm install git+https://github.com/dinilmusick/KrnlJS.git
```

### Basic Entity Usage

```javascript
import { krnlEntityBase, krnlRemoteFunctionality } from "krnljs";
import { mathAtom } from "./functionalities/Math/Math.js";

// 1. Local Logic
const calc = new krnlEntityBase("Calculator");
calc.addLocal(mathAtom);

// 2. Remote Proxy (In-Memory)
const gateway = new krnlEntityBase("Gateway");
gateway.addRemote({
  id: "CalcProxy",
  targetEntity: calc,
  targetFunction: "Math"
});

// 3. Trigger Logic
const result = await gateway.call("CalcProxy", { a: 10, b: 5, op: "add" });
console.log(result); // 15
```

## 📖 Documentation

For detailed guides on architectural patterns, networking, and advanced features, see:

- [**Main Guide**](src/krnl/docs/Guide.md): The canonical manual for building with KrnlJS.
- [**Changelog**](src/krnl/docs/changelog.md): Version history and migration guides.
- [**Examples & Storybook**](examples/doc.md): Interactive grimoire of runnable exhibits.

## 🛠️ Multi-System Discovery (P2P)

To create a networked system:

```javascript
import { krnlSystemEntityBase } from "krnljs";

export class MySystem extends krnlSystemEntityBase {
    constructor(port = 10091) {
        super("MySystem", null, port);
        
        this.startDiscovery().then(() => {
            console.log("System discovered on the network.");
        });
    }
}
```

## 🔐 System Availability Controls

`krnlSystemEntityBase` now supports runtime availability flags:

- `setDiscoverable(boolean)`: controls whether a system broadcasts itself on discovery.
- `reserveFor(serviceName)`: marks a system as busy/reserved for a specific supervisor.
- `releaseReservation(serviceName?)`: unlocks the reservation.
- `getSystemFlags()`: returns `{ discoverable, busy, reservedBy, reservedAt }`.

```javascript
system.reserveFor("SupervisorSystem");
system.setDiscoverable(false); // hide from discovery beacons

const flags = system.getSystemFlags();
// { discoverable: false, busy: true, reservedBy: "SupervisorSystem", ... }

system.setDiscoverable(true);
system.releaseReservation("SupervisorSystem");
```

For a full runnable walkthrough, see: `examples/example6/AvailabilitySystem/AvailabilitySystem.js`.

## 🧭 Network Orchestrator Entity

Use `krnlNetworkOrchestratorEntityBase` when you need a third-party manager service to:
- inspect active peers and their manifests/routes,
- connect one system emitter to another system collector,
- disconnect managed routes while honoring immutable route policy.

```javascript
import { krnlNetworkOrchestratorEntityBase } from "krnljs";

class MyOrchestrator extends krnlNetworkOrchestratorEntityBase {}
const orchestrator = new MyOrchestrator("MyOrchestrator", null, 10123);

// orchestrator.connectSystems("SourceSystem", "TargetSystem", {
//   sourceEmitter: "Pulse:pulse",
//   targetCollector: "system-commands",
//   externallyMutable: false
// });
```

Runnable example: `examples/example7/OrchestratorSystem/OrchestratorSystem.js`.

## 📜 License
MIT
