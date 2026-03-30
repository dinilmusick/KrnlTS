# Krnl: The Ultrst Logic Engine

By **Dinil Palackal**

## 🏗️ The Philosophy: Atomic Scaffolding
Krnl projects follow a strict physical directory hierarchy. No loose code is allowed inside entity descriptors.

### 1. Mandatory Scaffolding
Every entity folder (root or component) MUST contain:
- **`entities/`**: For sub-component entities.
- **`functionalities/`**: For logic atoms.
- **`Entity.js`**: The pure assembly descriptor.

The root entity of a project adds:
- **`libraries/`**: For project-wide concept definitions.

### 2. No Spare Functions
Logic never lives inside the `Entity.js` file. It must always be atomized into a functionality folder and registered via `addLocal()`.

### 3. The Root Server
The top-level entity MUST extend `krnlSystemEntityBase`. This class provides the built-in server infrastructure (WebSocket/CommComponent) required for exposing the app's functionalities to the network.

---

## 🏗️ Core Base Classes

| Class | Root/Comp | Role |
| :--- | :--- | :--- |
| `krnlSystemEntityBase` | **Root Only** | Top-level server. Exposes functionalities to the system. |
| `krnlEntityBase` | **Components** | Internal logic blocks. Promotes public logic to the owner. |

---

## 📡 Atomic Import Flow
1. **Logic Atoms** surgically import root libraries.
2. **Entity Descriptors** assemble logic atoms into a cohesive block.
3. **System Entities** boot the server and handle inter-system wiring.
