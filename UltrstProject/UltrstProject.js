// UltrstProject/UltrstProject.js
// The Root Master Descriptor: Extending krnlSystemEntityBase.

import { krnlSystemEntityBase } from "../krnl/core/index.js";

// Import Atoms
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";

export class UltrstProject extends krnlSystemEntityBase {
    /**
     * @param {string} name - Root folder name.
     * @param {number} port - Server port.
     */
    constructor(name = "UltrstServer", port = 10091) {
        // Root entities use SystemEntityBase to boot the built-in server logic.
        super(name, null, port);

        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs (API):
         * - 'Calculator': Atomic math logic.
         * - 'show': Atomic display logic (Bubbled from Display component).
         * 
         * Outputs (Events):
         * - 'Calculator:onCalculated': Broadcasts calculation data.
         */

        // 1. Logic Assembly
        this.addLocal(CalculatorAtom);

        // 2. Hierarchy Assembly
        this.hierarchyManager.createComponentEntity("Display", DisplayEntity);

        console.log(`[${this.entityName}] Ultrst Server manifested on port ${port}.`);
    }
}

// --- Bootstrap ---
const server = new UltrstProject();

// Manual test sequence using the standard library 'call' mechanism.
(async () => {
    const res = await server.call("Calculator", { a: 50, b: 25, op: "add" });
    await server.call("show", `Manifested Result: ${res}`);
})();
