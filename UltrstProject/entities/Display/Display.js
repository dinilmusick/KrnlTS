// UltrstProject/entities/Display/Display.js
// A "Component Entity" Atom.

import { krnlEntityBase } from "../../../krnl/core/index.js";

export class DisplayEntity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        
        // Add component-specific logic
        this.addLocal({
            id: "show",
            visibility: "public",
            api: (data) => {
                console.log(`[DISPLAY]: ${data}`);
                return true;
            }
        });
    }
}
