//////////////////////////////////////// CODE OVERVIEW ////////////////////////////////////////////
/**
 * @file DummySystemA.js
 * @description A dummy Krnl system that acts as a DATA PRODUCER.
 *
 * Inherits from krnlSystemEntityBase and adds:
 *   - An "A-Events" emitter on its interface (in addition to the base "system-events")
 *   - A `publishEvent(data)` method to push data through that emitter
 *
 * This system is used to test that the Orchestrator can wire its "A-Events" emitter
 * to another system's collector.
 */

import { krnlSystemEntityBase } from "../../core/K_ENT_System_Entity_Base.js";

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// MAIN API FUNCTIONS AND DATA //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////// DUMMY SYSTEM A ////////////////////////////////////////
export class DummySystemA extends krnlSystemEntityBase {
    /**
     * @param {string} [name="DummySystemA"]
     * @param {number} [commPort=10091] - WS listen port for the CommComponent.
     */
    constructor(name = "DummySystemA", commPort = 10091) {
        super(name, null, commPort);

        // ── Custom emitter: A-Events ──────────────────────────────────────
        this.interface.createEmitter("A-Events");
        console.log(`[${this.entityName}] Ready. Emitters: system-events, A-Events`);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////// PUBLISHING ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Pushes a data payload through the "A-Events" emitter.
     * Any system whose collector is wired to this emitter will receive the data.
     *
     * @param {*} data - Arbitrary data payload.
     */
    publishEvent(data) {
        const emitter = this.interface.getEmitter("A-Events");
        emitter.pushDataStreamToEmitter(data);
        console.log(`[${this.entityName}] Published A-Event:`, JSON.stringify(data));
    }
}
