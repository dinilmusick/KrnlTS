// UltrstProject/entities/Display/Display.js
// The Entity Descriptor: Explicitly describes the interface.

import { krnlEntityBase } from "../../../krnl/core/index.js";

export class DisplayEntity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        
        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs:
         * - 'show': Displays string data to the console.
         */
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
