# KrnlTS Core Library (v2.0.0)

KrnlTS is a senior-level orchestration library for building reactive, distributed systems using an **Atomic Entity Model**. It provides a strictly-typed, hardware-inspired framework where software components are treated like physical "Boxes" with isolated logic, state, and messaging ports.

## 🏗️ Core Principles

- **TypeScript Native**: Full type safety for entities, functionalities, and messaging.
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

### Basic Entity Usage (TypeScript)

```typescript
import { krnlEntityBase, KrnlFunctionality } from "krnlts";

// 1. Define logic atom
const mathAtom: KrnlFunctionality = {
    id: "Math",
    api: async ({ a, b, op }) => {
        if (op === "add") return a + b;
        return 0;
    }
};

// 2. Assembly
const calc = new krnlEntityBase("Calculator");
calc.addLocal(mathAtom);

// 3. Remote Proxy (In-Memory)
const gateway = new krnlEntityBase("Gateway");
gateway.addRemote({
  id: "CalcProxy",
  targetEntity: calc,
  targetFunction: "Math"
});

// 4. Trigger Logic
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
import { krnlSystemEntityBase } from "krnlts";

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

## 🤖 AI-Ready Unified Service Suite

KrnlJS systems now automatically host a **Unified HTTP Service** on the same port as their WebSocket server (`commPort`). This suite provides an "Always-On" bridge for AI agents and external HTTP clients.

### Industry-Standard Protocols
-   **MCP (Model Context Protocol)**: Direct integration with AI Agent toolkits via `/mcp`. Supports modern Streamable HTTP.
-   **ACP (Agent Communication Protocol)**: Standardized agent-to-agent REST interoperability via `/acp`.
-   **REST execution**: Invoke any system functionality via `POST /call/:id`.
-   **Real-time SSE**: Stream state changes and events via `GET /sse/:id`.
-   **System Manifest**: Inspect available endpoints and tools at `/manifest`.

### Zero-Config Activation
The service suite is enabled by default. Existing systems built with `krnlSystemEntityBase` require **zero code changes** to gain these features.

```javascript
// Existing code works exactly as before, with new HTTP endpoints enabled on :10099
const system = new krnlSystemEntityBase("MySystem", null, 10099);
await system.startDiscovery();
```

## 🧭 Network Orchestrator Entity

Use `krnlNetworkOrchestratorEntityBase` when you need a third-party manager service to:
- inspect active peers and their manifests/routes,
- connect one system emitter to another system collector,
- disconnect managed routes while honoring immutable route policy.

```javascript
import { krnlNetworkOrchestratorEntityBase } from "krnlts";

class MyOrchestrator extends krnlNetworkOrchestratorEntityBase {}
const orchestrator = new MyOrchestrator("MyOrchestrator", null, 10123);

// orchestrator.connectSystems("SourceSystem", "TargetSystem", {
//   sourceEmitter: "Pulse:pulse",
//   targetCollector: "system-commands",
//   externallyMutable: false
// });
```

Runnable example: `examples/example7/OrchestratorSystem/OrchestratorSystem.js`.

## ⚙️ Dynamic Ports & Graceful Shutdown

### Dynamic Port Allocation

Pass `0` as the port to let the OS assign a free port. Await `whenReady()` before reading `system.port` — the value is not final until the server has bound.

```javascript
import { krnlSystemEntityBase } from "krnlts";

const system = new krnlSystemEntityBase("MySystem", null, 0);
await system.startDiscovery();
await system.whenReady();

console.log(system.port); // OS-assigned port, e.g. 52341
```

> **Always use `system.port`** — it is the canonical, stable accessor. Do not read `system.commPort` or `system.commComponent.listenPort` directly; those are internal and may diverge before `whenReady()` resolves.

### Graceful Shutdown

Call `await system.shutdown()` to stop all owned microservices, managed processes, and the system itself in order.

```javascript
const system = new krnlSystemEntityBase("MySystem", null, 10099);
await system.startDiscovery();

// Clean shutdown from anywhere:
await system.shutdown();               // default 10 s timeout
await system.shutdown({ timeoutMs: 5000 }); // custom timeout
```

### Signal Handling (Recommended Pattern)

Bind OS signals once via the built-in helper so the system shuts down cleanly on `SIGINT`/`SIGTERM`:

```javascript
const system = new krnlSystemEntityBase("MySystem", null, 10099);
await system.startDiscovery();
await system.whenReady();

system.bindProcessSignals(); // handles SIGINT, SIGTERM, SIGHUP, uncaughtException
```

---

## 📜 License
MIT
