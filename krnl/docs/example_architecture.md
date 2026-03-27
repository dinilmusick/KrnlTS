# Example Architecture: Calculator & Notes App

This guide demonstrates how to architect a multi-system application using the **KrnlJS** standard syntax. We will build a **Math System** (Calculator) and a **Storage System** (Notes) that communicate seamlessly.

---

## 🏛️ System Overview

In the Krnl ecosystem, "Apps" are treated as **Systems**. This allows them to run in different processes or even on different machines while maintaining a uniform API.

| Component | Krnl Class | Responsibility |
| :--- | :--- | :--- |
| **MathSystem** | `krnlSystemEntityBase` | The "App" container. Handles networking and telemetry. |
| **Calculator** | `krnlEntityBase` | The internal logic. Performs math and emits results. |
| **NoteSystem** | `krnlSystemEntityBase` | The storage container. Receives data from the network. |
| **NoteManager** | `krnlEntityBase` | Manages the list of notes and saves them to state. |

---

## 🔢 1. The Math System (Calculator)

The Calculator is an internal component (Entity) owned by the Math System.

### Structure
- **Class**: `krnlEntityBase`
- **Emitter**: `result-out` (Sends the calculated value)
- **State**: `history` (Stores previous calculations)

### Communication Pattern
```javascript
// 1. Register a new Emitter named "result-out" on this entity's interface
const resultEmitter = this.interface.createEmitter("result-out");

// 2. Prepare the data payload and push it through the emitter stream
resultEmitter.pushDataStreamToEmitter({
    val: 4,                      // The calculated result
    equation: "2 + 2",           // Metadata describing the operation
    timestamp: Date.now()        // Logical time of the event
});
```

---

## 📝 2. The Storage System (Notes)

The Storage System listens for incoming data to save as new notes.

### Structure
- **Class**: `krnlEntityBase`
- **Collector**: `note-in` (Listens for incoming "whispers")
- **State**: `notes-list` (The actual data)

### Communication Pattern
```javascript
// 1. Register a new Collector named "note-in" on this entity's interface
const noteCollector = this.interface.createCollector("note-in");

// 2. Subscribe the collector to a source and define the reaction logic
noteCollector.subscribeTo(someEmitter, (msg) => {
    // 3. Save the incoming message data directly into the entity's state
    this.stateManager.setStateValue("notes-list", msg.data.id, msg.data.text);
});
```

---

## 🛰️ 3. Inter-System Orchestration (The Bridge)

To make the Calculator send its result to the Notes app, we use the **System Orchestrator** level.

### The Wiring Rite
The `krnlSystemEntityBase` provides a `commComponent` specifically for this. By convention, we wire the **Emitter** of one system to the **Collector** of another.

```javascript
// 1. Summon the Math System as a Producer (Network node on port 1001)
const mathApp = new krnlSystemEntityBase("MathApp", null, 1001);

// 2. Summon the Note System as a Consumer (Network node on port 1002)
const noteApp = new krnlSystemEntityBase("NoteApp", null, 1002);

// 3. Locate the "result-out" Emitter from the Math System's interface
const mathOutput = mathApp.interface.getEmitter("result-out");

// 4. Locate the "note-in" Collector from the Note System's interface
const noteInput = noteApp.interface.getCollector("note-in");

// 5. Perform the sacred wiring: Connect the Emitter to the Collector
noteInput.subscribeTo(mathOutput, (msg) => {
    // 6. Log the successful cross-system transmission
    console.log("Note System received calculation:", msg.data.val);
});
```

---

## 🏆 Why use this architecture?

1.  **Decoupling**: The Calculator doesn't need to know the Notes app exists. it just "emits" data.
2.  **Scalability**: If you add a "History App" later, you just wire the Calculator's emitter to the new App's collector. No code changes are needed in the Calculator.
3.  **Observability**: Because both are `krnlSystemEntityBase`, you can call `mathApp.returnedFunctionalities.call("getTelemetry")` at any time to see the status of your calculations and network routes.
4.  **Uniformity**: Whether you are writing a Calculator in JS or a complex Audio Engine in C++, the `Emitter -> Collector` syntax remains identical.
