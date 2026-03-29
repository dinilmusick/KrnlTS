# Krnl: The Ultrst Logic Engine

By **Dinil Palackal**

## 🏗️ The Philosophy: Atomic Composition
Krnl is not just a library; it is a physical code management system.

1.  **Strict Modularization**: Code is divided into Entities, Functionalities, and Libraries folders.
2.  **Functionality Atoms**: Every logic block consists of a **Main Function**, **Helpers**, and **Events** (beginning, during, end, failure).
3.  **Automatic Bubbling**: Public logic from component entities automatically promotes to the owner's interface.
4.  **Scoped State**: State is localized to the functionality atom, either as a single shared object or unique states for every unique caller (multi-state).

---

## 🏗️ Core Classes

| Class | Role | Ultrst Responsibility |
| :--- | :--- | :--- |
| `krnlEntityBase` | **Master Assembler** | Imports and registers functionalities and libraries from its folder. |
| `krnlLocalFunctionality` | **Logic Atom** | Assembles modular code into a callable functionality. |
| `krnlInterface` | **IO Hub** | Manages the promoted ports for the Entity. |

---

## 📡 The Modular Flow
The code flows from the smallest **Helper Atom** into the **Functionality Atom**, which is then registered in the **Entity**, and ultimately bubbles up to the **System Orchestrator**.
