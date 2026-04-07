# Essential Architectural Recommendations for KrnlJS

Based on the development and debugging of the Wepr orchestrator, the overarching Local/Remote schema and the "Purity Policy" of KrnlJS provide an exceptionally clean architectural foundation. Enforcing strict separation between descriptors, state, and runtime logic prevents cyclic dependencies and "spaghetti code" naturally.

However, moving past visually-driven applications to generalized, scalable systems reveals a few missing foundational primitives. To make KrnlJS a truly robust orchestrator for complex systems, I strongly recommend implementing the following structural enhancements.

---

## 1. [COMPLETED v1.2.0] Transport-Agnostic `RemoteFunctionality`

### The Problem
Currently, `krnlRemoteFunctionality` requires a strict memory reference to the `targetEntity`. This limits the utility of a "Remote" proxy; it acts as a local alias rather than a true distributed system boundary. If an orchestrator (like Wepr) exists on Node A, and a worker entity exists on Node B, KrnlJS does not currently offer a native semantic to bridge them without the consuming application manually wrapping network calls.

### The Recommendation
Refactor `krnlRemoteFunctionality` to accept a `TransportAdapter` interface rather than a direct entity reference. 

```javascript
// Current implementation pattern
const remote = new krnlRemoteFunctionality({
  id: "mathRemote",
  targetEntity: localMathEntityInstance, // Strictly in-memory
  targetFunction: "multiply"
});

// Proposed implementation pattern
const remote = new krnlRemoteFunctionality({
  id: "mathRemote",
  transport: new WebSocketTransportAdapter("ws://node-b.local", "mathEntity"),
  targetFunction: "multiply"
});
```

### The Impact
By abstracting the network layer into adapters (e.g., `MemoryAdapter`, `WebSocketAdapter`, `HTTPAdapter`, `WorkerThreadAdapter`), a KrnlJS `Entity` becomes completely agnostic to where its functionalities execute. A developer can build an entire system locally, and then distribute the entities across microservices by simply swapping the adapter in the descriptor, changing zero runtime logic.

---

## 2. [COMPLETED v1.2.0] Proxied State Observability (Implicit Reactivity)

### The Problem
In the Wepr server integration, we heavily relied on WebSocket subscriptions and manual event emissions (`emitters.get('name').emit(data)`) to broadcast UI state changes. Whenever `state` is updated inside `main_function/logic.js`, the developer must explicitly notify the system. This creates a high risk of "silent" state changes causing desynchronization if a developer forgets to emit an event.

### The Recommendation
KrnlJS should wrap the `LocalFunctionality` state object in a Javascript `Proxy` when the functionality is initialized. This would allow the framework to automatically intercept mutations.

```javascript
// Given this inside logic.js
export const updateLayout = async (payload, { state }) => {
    state.nodes.push(payload.newNode);
    // Framework AUTOMATICALLY fires an internal 'state:changed' 
    // event based on the Proxy trap catching the .push() mutation.
}
```

### The Impact
Entities could natively support `entity.subscribeToState(functionalityId, callback)`. This eliminates the need for manual event boilerplate for state-syncing, making KrnlJS a first-class choice for reactive backends, multiplayer games, and live-syncing UIs.

---

## 3. [COMPLETED v1.2.0] Standardized `onMount` and `onTeardown` Lifecycles

### The Problem
Currently, functionality atoms expose `initialState` and `api` (`main`). There is no framework-level semantic for a functionality to initialize external resources when the entity is instantiated, nor to clean them up when the entity is destroyed. If an atom represents a Database Connection Pool or a recurrent Chron Job, it has no safe way to manage its own lifecycle.

### The Recommendation
Expand the functionality logic definition to allow optional lifecycle hooks alongside `main`.

```javascript
// ./functionalities/Database/lifecycle.js
export const onMount = async ({ state, emitters }) => {
    state.pool = await createPostgresPool();
    emitters.get("sys").emit("db_connected");
};

export const onTeardown = async ({ state }) => {
    await state.pool.end();
};
```

### The Impact
Complete resource safety. Entities can be safely dynamically spun up and torn down at runtime (e.g., dynamically provisioning "Room" entities in a multiplayer server or "Session" entities in Wepr) with the guarantee that their localized functionalities will gracefully clean up their own memory hooks and network ports.

---

## 4. [COMPLETED v1.2.0] Built-In Payload & State Schematization

### The Problem
Because KrnlJS purely orchestrates references between generic JavaScript functions, there is zero introspection into what payload `entity.call("func", ...payload)` expects. This makes the proxy model fragile at runtime, especially when different teams or repositories are interacting with a shared Entity.

### The Recommendation
Integrate an optional schema definition block within the Functionality Descriptor using a lightweight validator (or simply Zod objects) to define the `input` and `state` shape.

```javascript
// ./functionalities/OrderSystem/OrderSystem.js
import { z } from "zod"; // hypothetical validation engine integration

export const OrderSystemAtom = {
    id: "OrderSystem",
    schema: {
        input: z.object({ itemId: z.string(), quantity: z.number() })
    },
    initialState,
    api: main,
};
```

### The Impact
Before `krnlEntityBase` ever routes the call to the logic file or the network adapter, it can intercept invalid payloads and throw a descriptive `KrnlSchemaError`. This guarantees that the logic inside `main` never has to write boilerplate type-checking defensive code, making the logic handlers deeply pure and solely focused on business logic.
