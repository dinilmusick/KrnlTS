// UltrstProject/UltrstProject.js
// The Root Master Descriptor: Pure Assembly & Server Boot.

import { krnlSystemEntityBase } from "../krnl/core/index.js";

// 1. Import Logic Atoms
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";

// 2. Import Component Descriptors
import { DisplayEntity } from "./entities/Display/Display.js";

/**
 * ULTRST SERVER ENTITY
 * This is the project root. It extends krnlSystemEntityBase to inherit
 * built-in WebSocket server logic, UDP discovery, and peer-to-peer wiring.
 */
export class UltrstProject extends krnlSystemEntityBase {
    /**
     * @param {string} name - Root folder name.
     * @param {number} port - Port for the built-in WebSocket server.
     */
    constructor(name = "UltrstServer", port = 10091) {
        // The super() call boots the CommComponent server automatically.
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

        // --- Logic Assembly ---
        this.addLocal(CalculatorAtom);

        // --- Hierarchy Assembly ---
        this.hierarchyManager.createComponentEntity("Display", DisplayEntity);

        // --- System Initialization ---
        // We use the inherited 'startDiscovery' to make this server
        // visible to other Krnl systems on the local network.
        this.startDiscovery().then(() => {
            console.log(`[${this.entityName}] Discovery active. Peer-to-Peer ready.`);
        });
    }
}

// --- Bootstrap ---
// Instantiating the class is the ONLY action allowed in the root file.
// All logic is now contained within functionalities or inherited system methods.
new UltrstProject();
