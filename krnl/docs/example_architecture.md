# Ultrst Architecture: Mandatory Scaffolding

The **Ultrst Philosophy** (by Dinil Palackal) enforces a strict physical separation of descriptors and logic atoms.

## 1. Directory Blueprint
Every entity, from the root server to the smallest component, follows the same folder structure.

```
/my-root-server/ (Extends krnlSystemEntityBase)
  /libraries/ (Root only)
  /entities/
    /Display/ (Extends krnlEntityBase)
      /entities/
      /functionalities/
        /show/
      Display.js (Descriptor)
  /functionalities/
    /Calculator/
  UltrstServer.js (Assembler & Bootstrapper)
```

## 2. Rules of Engagement

### Pure Descriptors
The `Display.js` or `UltrstServer.js` files must NOT contain logic. They only import atoms and describe the interface.
State literals should also stay out of descriptor files; define them inside `state_data/` atoms (or shared libraries) and import them.

**Incorrect:**
```javascript
this.addLocal({ id: "show", api: (d) => console.log(d) }); // ❌ NO loose logic
```

**Correct:**
```javascript
import { showAtom } from "./functionalities/show/show.js";
this.addLocal(showAtom); // ✅ Atomized Logic
```

### Root System Base
The project entry point always inherits from `krnlSystemEntityBase` to enable network-wide functionality exposure.
System entities are always singleton. Component entities can explicitly set `Singleton = false` if multiple instances are needed.

```javascript
import { krnlSystemEntityBase } from "krnl/core";

export class MyProjectServer extends krnlSystemEntityBase {
    constructor(port) {
        super("MyServer", null, port);
        // Assembly logic here...
    }
}
```

## 3. Atomic Nesting
Because every entity has an `entities/` folder, the structure can nest infinitely, with each layer maintaining its own isolated logic atoms and component descriptors.
