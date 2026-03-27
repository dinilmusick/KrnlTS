//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file DummySystemB.js
 * @description A dummy Krnl system that acts as a DATA CONSUMER.
 *
 * Inherits from krnlSystemEntityBase and adds:
 *   - A "B-Commands" collector on its interface
 *   - A callback `onCommand(handler)` to register a custom handler
 *
 * Any data arriving at "B-Commands" is logged + forwarded to the handler.
 * This system is used to verify that the Orchestrator successfully routes
 * DummySystemA's "A-Events" emitter into its "B-Commands" collector.
 */

import { krnlSystemEntityBase } from "../../core/K_ENT_System_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// DUMMY SYSTEM B ////////////////////////////////////////
export class DummySystemB extends krnlSystemEntityBase {
    /**
     * @param {string} [name="DummySystemB"]
     * @param {number} [commPort=10092] - WS listen port for the CommComponent.
     */
    constructor(name = "DummySystemB", commPort = 10092) {
        super(name, null, commPort);

        // ── Custom collector: B-Commands ──────────────────────────────────
        this.interface.createCollector("B-Commands");
        this._commandLog = [];

        // Attach the default handler (can be overridden via onCommand)
        this._attachCollectorHandler("B-Commands", (msg) => {
            const entry = {
                receivedAt: new Date().toISOString(),
                data: msg.data,
            };
            this._commandLog.push(entry);
            console.log(`[${this.entityName}] ✔ B-Commands received:`, JSON.stringify(entry));

            if (this._customHandler) this._customHandler(entry);
        });

        console.log(`[${this.entityName}] Ready. Collectors: system-commands, B-Commands`);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// COMMAND HANDLING /////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Register a custom handler to be called whenever data arrives at "B-Commands".
     * @param {function(Object): void} handler
     */
    onCommand(handler) {
        this._customHandler = handler;
    }

    /**
     * Returns all commands received so far.
     * @returns {Array}
     */
    getCommandLog() {
        return [...this._commandLog];
    }
}
