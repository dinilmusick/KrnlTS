# Ultrst Project Structure: Canonical Guide

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
