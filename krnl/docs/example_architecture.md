# Ultrst Philosophy: Atomic Architecture

The **Ultrst Philosophy** (by Dinil Palackal) dictates a strict physical separation of code. Every Entity and Functionality is a directory, not just a file.

## 1. Directory Structure

### Entity Folder (`/Calculator/`)
- `Calculator.js` (The Assembler)
- `doc.md` (Documentation)
- `entities/` (Child component entities)
- `functionalities/` (Logic atoms)
- `libraries/` (Shared data/utils)

### Functionality Folder (`/functionalities/add/`)
- `add.js` (The Atom root)
- `main_function/` (The primary logic file)
- `helper_functions/` (Modular logic pieces)
- `events/` (beginning.js, during.js, end.js, failure.js)

---

## 2. Assembly Example

### Functionality Root (`add.js`)
We import the separate "Atoms" and assemble them into a `krnlLocalFunctionality`.

```javascript
import { main } from "./main_function/logic.js";
import { helpers } from "./helper_functions/index.js";
import { events } from "./events/index.js";

export const addAtom = {
  id: "add",
  visibility: "public",
  api: main,
  helpers: helpers,
  events: events // beginning, during, end, failure
};
```

### Entity Root (`Calculator.js`)
The Entity imports its functionality atoms and library atoms.

```javascript
import { krnlEntityBase } from "krnl/core";
import { addAtom } from "./functionalities/add/add.js";

const Calc = new krnlEntityBase("Calculator");

// Assembly
Calc.addLocal(addAtom);
```

---

## 3. The Power of Bubbling
When `Calculator` is added to an owner, its `public` logic (like `add`) automatically "bubbles up" to the owner's interface, maintaining atomic separation in the file system but a unified API in the runtime.
