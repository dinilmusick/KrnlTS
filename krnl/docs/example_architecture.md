# Ultrst Architecture: Surgical Logic Assembly

The **Ultrst Philosophy** (by Dinil Palackal) emphasizes physical code separation and explicit interface descriptions. 

## 1. Project-Wide Library Structure
Libraries exist **ONLY** at the project root. They are named by subject (e.g., `LogicConcepts.js`, `MathConcepts.js`).

```
/my-project/
  /libraries/
    ProjectConcepts.js
  /entities/
    MainServer.js
```

## 2. The Surgical Import Model
Functionality code files (Helpers, Main Functions) import only the specific library atoms they need directly from the root `/libraries/` folder.

### Logic Atom (`main_function/logic.js`)
```javascript
// Surgical import: Only what is needed for this specific logic
import { format } from "../helper_functions/formatter.js";
import { ProjectConcepts } from "../../../libraries/ProjectConcepts.js";

export const main = async (input, { emitters }) => {
    const result = format(input);
    console.log(`[${ProjectConcepts.PHILOSOPHY}] result: ${result}`);
    return result;
};
```

## 3. The Entity as a Descriptor
The Entity file is where you explicitly describe the IO (Inputs/Outputs) using comments. This makes the software block instantly recognizable to other coders.

### Entity Root (`MyEntity.js`)
```javascript
import { krnlEntityBase } from "krnl/core";
import { MyLogicAtom } from "./functionalities/MyLogic/MyLogic.js";

export class MyEntity extends krnlEntityBase {
    constructor(name) {
        super(name);

        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs:
         * - 'MyLogic': Processes incoming signals.
         * 
         * Outputs:
         * - 'MyLogic:onComplete': Fires when processing is done.
         */
        this.addLocal(MyLogicAtom);
    }
}
```

## 4. The Root Entity (The Server)
The main entity at the root of the project always acts as a persistent process, typically an HTTP or WebSocket server, serving as the entry point for the entire system.
