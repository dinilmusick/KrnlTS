# Krnl Examples: The Ultrst Grimoire

This directory contains a set of interactive examples demonstrating the features and philosophy of the Krnl library.

## Available Examples

### 1. [Full System Orchestration](./example1/doc.md)
Demonstrates a multi-system architecture with a `CalculatorSystem` (logic) and `WebInterfaceSystem` (UI).
- **Concepts**: Systems, Components, Libraries, WebSocket Networking.
- **New v1.2.0**: `WebSocketTransportAdapter`, `onMount`/`onTeardown` Lifecycles, and `schema` Validation.

### 2. [Deep Entity Nesting (3 Levels)](./example2/doc.md)
Shows how entities can be nested and how logic automatically "bubbles up" to the root system.
- **Concepts**: Hierarchical Composition, Interface Promotion, Pure Descriptors.

### 3. [Event Emission and Subscription](./example3/doc.md)
Illustrates the event-driven nature of Krnl, with producers and consumers.
- **Concepts**: Emitters, Collectors, Event Wiring, Bubbling.
- **New v1.2.0**: `state:changed` Implicit Reactivity.

### 4. [System Demo (Visualized)](./SystemDemo/index.html)
An interactive HTML demo showing the visual aspect of Krnl systems.

### 5. [Mechanism Changes Showcase](./example4/doc.md)
Focused walkthrough of new bubbling, visibility-stop, streaming collector, and one-shot collector behavior.
- **Concepts**: `mode: "once"`, `collectNext`, deep bubbling, and private boundary stop.

### 6. [Entity Singleton vs Multi-Instance](./example5/doc.md)
Demonstrates singleton entities, multi-instance entities, and disposal of unused instances.
- **Concepts**: `Singleton` policy, instance naming, and lifecycle cleanup.

### 7. [System Availability Flags](./example6/doc.md)
Demonstrates reserving a system (`busy` state) and toggling system discoverability at runtime.
- **Concepts**: `reserveFor`, `releaseReservation`, `setDiscoverable`, stale peer cleanup (`peerTtlMs`).

### 8. [Network Orchestrator Entity](./example7/doc.md)
Demonstrates orchestrator-driven inter-system wiring and managed/immutable connection policies.
- **Concepts**: `krnlNetworkOrchestratorEntityBase`, `connectSystems`, `disconnectPeerRoute`, `externallyMutable`.

### 9. [AI-Ready Unified Service Suite](./example8/AIServerSystem/doc.md)
Showcases the v1.3.0 single-port unified server hosting REST, MCP, and ACP protocols for AI agent interoperability.
- **Concepts**: Unified Server, MCP Tool Mapping, ACP Agent Interop, Zero-Config Services.

### 10. [RPC Error Serialization Fix](./example10/RPCErrorFix/doc.md)
Demonstrates the fix for detail-preservation when throwing plain objects or errors across RPC boundaries.
- **Concepts**: RPC Error Propagation, JSON-RPC Error Formatting.

### 11. [Service Suite Verification](./example11/ServiceSuiteVerification/doc.md)
Automated verification scripts to ensure the Unified Service Suite stays stable and single-port connectivity remains robust.
- **Concepts**: Single-Port Validation, Multi-Protocol Verification.

### 12. [Managed Services Orchestration](./example15/doc.md)
Demonstrates how to register and orchestrate external micro-server processes with dynamic port assignment and startup sequencing.
- **Concepts**: Process Orchestration, Startup Synchronization, Dynamic Environment Injection.

---


## How to explore
Each example folder contains its own `doc.md` with specific details and instructions on how to run it.
