# Krnl Base Handbook

The **Krnl Base Handbook** is a high-level architectural guide for developers building new entities, logic, and systems within the Krnl ecosystem.

---

## 1. Core Concepts: The Entity Model

The fundamental unit of the Krnl system is the **`krnlEntity`**. Every logical block—from a simple Oscillator to a complex Sequencer—is an Entity.

### Anatomy of an Entity
Every entity is composed of specialized **Managers** that handle its core responsibilities:

1.  **`interface`**: The communication layer. It handles incoming (Collectors) and outgoing (Emitters) message streams.
2.  **`stateManager`**: The memory layer. It stores and retrieves key-value pairs in named states.
3.  **`broadcastFunctionalities`**: The stream-based logic layer. Defines functions that take input streams and output results to persistent streams.
4.  **`returnedFunctionalities`**: The direct call layer. Defines functions for immediate request-response interactions.
5.  **`hierarchyManager`**: The composition layer. Manages parent-child relationships, allowing an entity to own and control sub-entities.

---

## 2. Building an Entity (JavaScript)

To create a new entity, extend the `krnlEntity` class.

### Basic Template
```javascript
import { krnlEntity } from './krnlBase/js/entities/krnlEntity/K_ENT_Krnl_Entity.js';

class MyCoolEntity extends krnlEntity {
  constructor(name, owner = null) {
    super(name, owner);
    
    // Register custom logic during initialization
    this.setupLogic();
  }

  setupLogic() {
    // Logic goes here
  }
}
```

---

## 3. Defining Logic (Functionalities)

Krnl logic is defined through **Functionalities**.

### A. Broadcast Functionalities (Stream-Based)
Used for data that flows over time (e.g., audio samples, control signals).

```javascript
// Define a functionality that adds 10 to any input
this.broadcastFunctionalities.define('addTen', (data) => {
  return Number(data) + 10;
}, { stateful: true, stateKey: 'currentValue' });

// Calling it returns an Emitter (stream)
const resultStream = this.broadcastFunctionalities.call('addTen', 5);
resultStream.subscribe(msg => console.log('Result:', msg.data)); // "Result: 15"
```

### B. Returned Functionalities (Immediate)
Used for request-response interactions. Unlike simple functions, these follow a **3-step lifecycle** to ensure state isolation and multi-instance support.

**Step 1: Define** (In the Entity/Library)
```javascript
this.returnedFunctionalities.define('getName', () => {
  return this.entityName;
});
```

**Step 2: Create Instance** (In the Caller)
```javascript
// Creates a unique instance for this specific caller
const instance = targetEntity.returnedFunctionalities.createInstance('getName', 'MyCallerName');
```

**Step 3: Call** (In the Caller)
```javascript
// Execute using the instance name
const name = await targetEntity.returnedFunctionalities.call(instance.instanceName);
```

> [!IMPORTANT]
> Never call a functionality by its definition name directly. Always create an instance first. This allows the system to track who is calling what and maintain separate states for each caller if needed.

---

## 4. Connections & Messaging

The communication between entities is handled by the **`interface`**.

### Collectors & Emitters
- **Collector**: Receives data.
- **Emitter**: Sends data.

### Piping Streams
You can pipe the output of one functionality (Emitter) directly into another (Collector):

```javascript
const emitter = sourceEntity.broadcastFunctionalities.call('sourceFunc', data);
const collector = targetEntity.interface.getCollector('targetFuncIn');

// Connect them
emitter.pipeTo(targetEntity, (msg) => {
    // Logic on data arrival
});
```

---

## 5. Storage (DasyJS)

For persistent data storage on the web platform, use `DasyJS`. It abstracts the Browser's Origin Private File System (OPFS).

```javascript
import { DasyJS } from './krnlBase/js/libraries/dasyJS/K_LIB_Dasy_JS.js';

const fs = new DasyJS();
await fs.init();

await fs.writeText('config.json', JSON.stringify({ theme: 'dark' }));
const config = await fs.readText('config.json');
```

---

## 6. Error Handling

Always use **`krnlError`** and standardized error codes for cross-platform compatibility.

```javascript
import { krnlError, krnlErrorCodes } from './krnlBase/js/libraries/krnlErrorConcepts/K_LIB_Krnl_Error_Concepts.js';

if (!exists) {
    throw new krnlError(krnlErrorCodes.ENTITY_NOT_FOUND);
}
```

---

## 7. Interactive Exploration

To see the base framework in action, run the **[Visual Handbook Exhibit](krnlBase/js/entities/krnlEntity/exhibits/exhibit1/index.html)**. It allows you to create entities, define math logic, and visually trace the flow of data through the system.

---

## 8. Lifecycle Management (Disposal)

Scalable systems require proactive resource cleanup. All Krnl entities support a `dispose()` method.

### The `dispose()` Method
When an entity is no longer needed:
1. It recursively disposes of all **owned component entities** via the `hierarchyManager`.
2. it disconnects all **emitters and collectors** in its `interface`.
3. It clears all **states** in its `stateManager`.
4. It shuts down any **functionality instances**.

```javascript
// Example: Manually disposing an entity
myEntity.dispose();
```

> [!TIP]
> Always override `dispose()` in system-specific entities (like Brnda) to clean up external libraries (e.g., `engine.dispose()` for BabylonJS).
