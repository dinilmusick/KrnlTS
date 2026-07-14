---
name: krnlts-architecture
description: Detailed guide on KrnlTS folder layout, import rules, bubbling visibility, and silent context-destructuring traps.
---

# KrnlTS Core Architecture & Conventions

This skill governs the file layout, module loading conventions, and correct code organization for KrnlTS applications. Adhering to these rules prevents build failures and runtime context scope bugs.

## 1. Project Directory Structure
All downstream KrnlTS entities and applications must conform to the following directory tree:
```
ROOT/
├── doc.md              → System/app documentation
├── src/                → Source typescript (.ts) or javascript (.js) files
├── libraries/          → Core local modules (strictly NO external npm modules allowed here!)
├── entities/           → Declarative child entity definitions
│   └── MyEntity/
│       ├── functionalities/  → Atomic logic blocks
│       │   └── OrderProcess/
│       │       ├── OrderProcessAtom.js    → Configuration descriptor
│       │       ├── main_function/
│       │       │   └── logic.js          → Implementation code
│       │       ├── state_data/
│       │       │   └── state.js          → Initial JSON/JS state schema
│       │       └── helpers/              → Inner functions
│       └── MyEntity.js                   → Entity configuration assembler
├── subapps/            → Backend microservices (booted as Ingress Members)
├── frontends/          → UI packages (Vite/Next.js routes mapped to adapters)
└── assembler.js        → App entrypoint extending krnlSystemEntityBase
```

> [!IMPORTANT]
> **Subapps vs Frontends separation is critical:**
> *   `subapps/` is strictly for backend microservices that host REST/WS/MCP endpoints.
> *   `frontends/` is strictly for UI-oriented web packages extending `KrnlFrontendAdapter` or `KrnlBlockContainerAdapter`.

---

## 2. Module Import Rules
To ensure NodeNext ES compatibility without build errors:
*   **Use `.js` extensions in imports**: All local imports inside typescript files MUST end in `.js` (e.g. `import { helper } from "./helper.js";`), even though the source file is `.ts`.
*   **Keep Descriptors Declarative**: Files defining configuration metadata (`MyEntity.js`, `OrderProcessAtom.js`) should contain strictly static JSON-like structures. Never import logic helpers or third-party packages inside them.

---

## 3. Scope & Bubbling Visibility
Functionalities added inside an entity bubble up and become available to parent or sibling orchestrators according to their `visibility` parameter:
*   `visibility: "public"`: Automatically exposed on the entity's REST API and gross manifest.
*   `visibility: "private"`: Only accessible to logic within the owner entity.

---

## 4. ⚠️ CRITICAL context-destructuring trap
When implementing the `main` logic for a functionality in `logic.js`, the execution context is passed as the **second parameter**:
```typescript
// ✅ CORRECT - always destructure "entity" and alias to "system"
export const main = async (input: any, { state, entity: system }: any) => {
    const port = system.commPort; 
};

// ❌ WRONG - "system" does not exist in the context object and will be undefined!
export const main = async (input: any, { state, system }: any) => {
    const port = system?.commPort; // Runtime Error: system is undefined
};
```
> [!WARNING]
> Destructuring `system` directly is a silent failure. TypeScript will compile it, but your logic will fail at runtime. Always map `entity: system`.
