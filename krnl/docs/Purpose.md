# Krnl: The Ultrst Logic Engine

By **Dinil Palackal**

## 🏗️ The Philosophy: Atomic Composition (Revised)
Krnl is a physical code management system designed for a node-based IDE.

1.  **Project Root Libraries**: The `/libraries/` folder exists ONLY at the project root. Files are named `<subject>Concepts.js`. No local library folders allowed.
2.  **Surgical Imports**: Code files (Helpers, Main Functions) import only the specific library atoms they need. No indiscriminate importing.
3.  **The Master Descriptor**: The Entity file (`Entity.js`) is a **Descriptor**. It explicitly describes the IO (Interface) using comments so any coder can instantly understand the "ports" of the software block.
4.  **The Root Server**: The main entity at the root of a project is always a persistent process (e.g., HTTP or WebSocket server).
5.  **Functionality Atoms**: Logic is physically separated into `main_function/`, `helper_functions/`, and `events/`. Helpers and Events are imported only by the Main Function.

---

## 🏗️ Core Classes

| Class | Role | Ultrst Responsibility |
| :--- | :--- | :--- |
| `krnlEntityBase` | **Interface Descriptor** | Explicitly defines the public API and assembles child atoms. |
| `krnlLocalFunctionality` | **Assembly Container** | A minimal wrapper for the self-contained Logic Atom. |
| `krnlInterface` | **IO Hub** | The registry for the explicit ports defined in the Entity. |

---

## 📡 The Modular Flow
1. **Atoms** (Logic/Events/Helpers) live in folders.
2. **Main Function** surgically imports Helpers and Events.
3. **Entity** imports the Main Function and explicitly declares it in the Interface.
4. **Root Entity** boots as a persistent server.
