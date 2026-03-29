# Krnl: The Modular Software Engine

## 🏗️ Core Entities
These define the building blocks of the Krnl ecosystem.

| File | Purpose | Necessity | Ease of Use | Utility |
| :--- | :--- | :---: | :---: | :---: |
| `K_ENT_Krnl_Entity_Base.js` | The root class for all objects. Supports **Automatic Interface Promotion** from components. | 10 | 9 | **19** |
| `K_ENT_Krnl_System_Entity_Base.js` | Adds networking and discovery to the base entity. | 10 | 8 | **18** |

---

## 📚 Core Libraries
The internal engines of the Entity.

| File | Purpose | Necessity | Ease of Use | Utility |
| :--- | :--- | :---: | :---: | :---: |
| `K_LIB_Krnl_Functionality_Types.js` | Defines **Visibility** (`public`/`private`) and **State Models** (`single`/`multi`). | 10 | 9 | **19** |
| `K_LIB_Krnl_Messaging_Concepts.js` | The "Patch Panel" of the system (Interface, Emitter, Collector). | 10 | 9 | **19** |
| `K_LIB_Krnl_Entity_Compositional_Hierarchy.js` | Manages parent-child links and enforces **Singleton Components**. | 9 | 8 | **17** |

---

## 🛠️ The Compositional Paradigm
Krnl is built on the principle of **Logic Bubbling**.

1.  **Private Logic**: Keep it internal to organize a component.
2.  **Public Logic**: Automatically promotes to the owner's interface.
3.  **Scoped State**: State is owned by functionality, never shared globally.
4.  **Multi-State**: A single functionality can maintain isolated states for different callers (e.g., a "Profile" logic serving 100 different users).
