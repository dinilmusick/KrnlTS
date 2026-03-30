// UltrstProject/UltrstProject.js
// The Master Descriptor: Root Persistent Process (HTTP/WS Server).

import { krnlEntityBase } from "../krnl/core/index.js";

// Import Atoms
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";

export class UltrstProject extends krnlEntityBase {
    constructor(name = "UltrstServer") {
        super(name);

        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs (API):
         * - 'Calculator': Performs basic math operations.
         * - 'show': Promoted from Display component.
         * 
         * Outputs (Events):
         * - 'Calculator:onCalculated': Broadcasts math results.
         */

        // --- Logic Assembly ---
        this.addLocal(CalculatorAtom);

        // --- Component Assembly ---
        this.hierarchyManager.createComponentEntity("Display", DisplayEntity);

        this._startServer();
    }

    _startServer() {
        console.log(`[${this.entityName}] Server active. Waiting for requests...`);
        // Simulating persistent process
        setInterval(() => {
            // Heartbeat or Background logic
        }, 10000);
    }

    /**
     * Entry point for IDE or Runtime execution.
     */
    async handleRequest(operation, data) {
        console.log(`[Server] Received request: ${operation}`);
        return await this.call(operation, data);
    }
}

// --- Bootstrap ---
const server = new UltrstProject();

// Manual test call to verify functioning
server.handleRequest("Calculator", { a: 100, b: 50, op: "sub" }).then(res => {
    server.handleRequest("show", `The server result was ${res}`);
});
