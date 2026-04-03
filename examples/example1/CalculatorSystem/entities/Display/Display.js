// UltrstProject/entities/Display/Display.js
// The Entity Descriptor: Pure assembly, no direct logic.

import { krnlEntityBase } from "../../../../../krnl/core/index.js";
import { showAtom } from "./functionalities/show/show.js";

export class DisplayEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs:
         * - 'show': Displays string data to the console.
         */
        this.addLocal(showAtom);
    }
}
