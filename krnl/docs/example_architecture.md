# Example Architecture: Calculator & Notes App

This guide demonstrates how to architect a multi-system application using the **KrnlJS** decentralized syntax. We will build a **Math System** (Calculator) and a **Storage System** (Notes) that find and connect to each other automatically over a network.

---

## 🏛️ System Overview

In the Krnl ecosystem, every application is a **System Entity**. They act as independent blocks that can be wired together regardless of whether they run on the same computer or different ones.

| Component | Krnl Class | Responsibility |
| :--- | :--- | :--- |
| **MathSystem** | `krnlSystemEntityBase` | The producer. Performs math and broadcasts results. |
| **NoteSystem** | `krnlSystemEntityBase` | The consumer. Discovers the Math system and wires itself. |

---

## 🔢 1. The Math System (Producer)

The Math System initializes itself and begins "advertising" its presence on the local network.

```javascript
import { krnlSystemEntityBase } from 'krnl-js';

// 1. Initialize the system on port 1001
const mathApp = new krnlSystemEntityBase("MathApp", null, 1001);

// 2. Create an output emitter for calculations
mathApp.interface.createEmitter("result-out");

// 3. Start Discovery (UDP Beaconing)
// This makes the system visible to other peers on the LAN
await mathApp.startDiscovery();

// 4. Periodically push data (Logic loop)
setInterval(() => {
    const result = Math.random() * 100;
    mathApp.interface.getEmitter("result-out").pushDataStreamToEmitter({
        val: result,
        timestamp: Date.now()
    });
}, 5000);
```

---

## 📝 2. The Note System (Consumer)

The Note System searches for the Math System, inspects its available "ports," and wires them to its internal logic.

```javascript
import { krnlSystemEntityBase } from 'krnl-js';

// 1. Initialize the system on port 1002
const noteApp = new krnlSystemEntityBase("NoteApp", null, 1002);

// 2. Create a collector to receive notes
noteApp.interface.createCollector("incoming-notes");
noteApp.interface.getCollector("incoming-notes")._directHandler = (msg) => {
    console.log("📝 Note Saved:", msg.data.val);
};

// 3. Start Discovery to find the Math System
await noteApp.startDiscovery();

// 4. The Discovery & Wiring Logic
setTimeout(async () => {
    // List all discovered peers on the network
    const peers = noteApp.listPeers();
    const mathPeer = peers.find(p => p.name === "MathApp");

    if (mathPeer) {
        console.log(`Found MathApp at ${mathPeer.address}`);

        // Introspect: See what inputs/outputs the remote system has
        // This is like checking the ports on a hardware block
        const manifest = await noteApp.commComponent.callWsRpc(mathPeer.address, 'get-manifest');
        console.log("Remote Outputs available:", manifest.outputs.emitters);

        // 5. Perform the sacred wiring:
        // We wire the remote "result-out" to our local "incoming-notes"
        await noteApp.wire("MathApp", {
            remoteOutput: "result-out", // The name from MathApp
            localInput: "incoming-notes" // The name on our local interface
        });
        
        console.log("Network Bridge Established.");
    }
}, 2000);
```

---

## 🛰️ 3. Cross-Machine vs. Same-Machine

Because Krnl uses **UDP Discovery** and **WebSockets**, the code above works in two scenarios without modification:

### Scenario A: Same Machine
- Both systems run on `localhost`.
- Discovery finds `127.0.0.1:[PORT]`.
- The `wire()` method creates a WebSocket link between the two internal ports.

### Scenario B: Cross-Machine (LAN)
- System A is on `192.168.1.10`.
- System B is on `192.168.1.15`.
- Discovery broadcasts to `255.255.255.255`.
- System B receives the beacon, sees the real IP of System A, and calls `wire()`.
- A WebSocket is established across the network.

---

## 🏆 Why use this architecture?

1.  **Zero Configuration**: Systems find each other. You don't need to hardcode IP addresses.
2.  **Self-Documenting**: By calling `getManifest()`, a system can tell you exactly what it can do and what data it expects.
3.  **Hardware-Like Wiring**: Software blocks are connected just like physical patch cables. You connect an **Output** to an **Input**.
4.  **Language Agnostic**: A Go-based Orchestrator can call `get-manifest` on this JS-based system and wire it just as easily.
