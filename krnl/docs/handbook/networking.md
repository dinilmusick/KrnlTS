# Uniform Networking Guide

Networking in Krnl is designed to be **observable**, **decoupled**, and **uniform**. To prevent "architecture spoilage," every system in the stack must follow the same communication pattern.

---

## 1. The CommComponent Architecture

Every system (Brnda, Qwnsr, Wepr, etc.) possesses a `commComponent`. This component acts as a uniform bridge between a system's internal `interface` (Emitters/Collectors) and the outside world.

### The Pipeline
1.  **System A** defines an Emitter (e.g., `A-Events`).
2.  **System B** defines a Collector (e.g., `B-Commands`).
3.  **The Orchestrator** commands System A to wire `A-Events` to System B's `B-Commands`.
4.  **System A's CommComponent** establishes the connection (either a direct reference or a WebSocket).

---

## 2. Wiring Modes

### Mode A: Direct (In-Process)
Used when systems are running in the same Node.js process (e.g., during development or in unified monoliths).
- **Pros**: Zero latency, zero-copy, extremely fast.
- **Usage**: Managed automatically by the Orchestrator via `commComponent.wireDirectly()`.

### Mode B: WebSocket (Network/P2P)
Used when systems are running in separate processes or on different machines.
- **Pros**: Fully decoupled, scalable.
- **Usage**: Managed by the Orchestrator via `commComponent.wireViaWs()`.

---

## 3. How to Implement as a Developer

### Step 1: Extend the Correct Base
Your system orchestrator must extend `krnlSystemEntityBase`.

```javascript
import { krnlSystemEntityBase } from "../../krnlBase/js/entities/krnlSystemEntityBase/K_ENT_System_Entity_Base.js";

class MySystemOrchestrator extends krnlSystemEntityBase {
    constructor(name) {
        super(name);
        // this.commComponent is now available
    }
}
```

### Step 2: Define Your Interface
Create emitters and collectors using `this.interface`.

```javascript
setupInterface() {
    this.interface.createEmitter("myDataOut");
    this.interface.createCollector("myDataIn");
}
```

### Step 3: Handle Incoming Data
Use the helper `_attachCollectorHandler` to hook into data arriving at your collector. This abstracts the transport layer (you don't care if it came via WS or a direct reference).

```javascript
this._attachCollectorHandler("myDataIn", (msg) => {
    console.log("Data received:", msg.data);
    this.processData(msg.data);
});
```

---

## 4. The Orchestrator's Role

The `Krnl_Main_Orchestrator` is the **Wiring Broker**. It is the only entity that should call `wireSystems`. 

### Logic Flow:
1.  System A registers with Orchestrator.
2.  System B registers with Orchestrator.
3.  Orchestrator UI allows the user to click "Wire A.Out to B.In".
4.  Orchestrator sends a command to System A: "Wire your emitter 'A.Out' to System B's collector 'B.In' at address X."

---

## 5. Summary of Rules
- **NEVER** use `raw` WebSockets or TCP sockets for system-to-system data logic.
- **ALWAYS** use `commComponent` for wiring.
- **ALWAYS** inherit from `krnlSystemEntityBase` for your main system entry point.
- **ALWAYS** register your system with the Orchestrator so it can be wired visually.
