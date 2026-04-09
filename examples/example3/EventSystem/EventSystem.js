// examples/example3/EventSystem/EventSystem.js

import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";
import { ProducerEntity } from "./entities/ProducerEntity/ProducerEntity.js";
import { ConsumerEntity } from "./entities/ConsumerEntity/ConsumerEntity.js";
import { RunScenarioAtom } from "./functionalities/RunScenario/RunScenario.js";

/**
 * DESCRIPTOR: EventSystem
 * -------------------------------------------------------------------------
 * This system demonstrates the inter-component event wiring.
 * Producer: Generates 'ping' signals.
 * Consumer: Listens and logs those signals.
 */
export class EventSystem extends krnlSystemEntityBase {
    static Singleton = true;
    /**
     * @param {number} port - Network listen port for the system server.
     */
    constructor(port = 10093) {
        // Initialize the base system with a name and port.
        super("EventSystem", null, port);
        
        /**
         * REGISTER CONTROL LOGIC
         * We add a private functionality atom to orchestrate the test scenario.
         */
        this.addLocal(RunScenarioAtom);

        /**
         * SUMMON COMPONENTS
         * We create the Producer and Consumer from their specific descriptors.
         */
        const producer = this.hierarchyManager.createComponentEntity("Producer", ProducerEntity);
        const consumer = this.hierarchyManager.createComponentEntity("Consumer", ConsumerEntity);
        
        /**
         * INTER-COMPONENT WIRING
         * ---------------------------------------------------------------------
         * We take the output emitter from the Producer and pipe it into the
         * input collector of the Consumer.
         */
        
        // 1. Get the emitter from the Producer's interface.
        // It was promoted as "FunctionalityID:EmitterID".
        const pingEmitter = producer.interface.getEmitter("Ping:ping-emitted");
        
        // 2. Get the collector (The Logger functionality itself) from the Consumer.
        const logCollector = consumer.interface.getCollector("Logger");
        
        // 3. Sacred Wiring: Link the source to the listener.
        logCollector.subscribeTo(pingEmitter);

        // 4. IMPLICIT REACTIVITY (New in v1.2.0)
        // Subscribe to the state:changed emitter of the Ping functionality.
        // Whenever logic.js mutates 'state.seq', this will fire.
        const pingStateEmitter = producer.interface.getEmitter("Ping:state:changed");
        pingStateEmitter.subscribe((msg) => {
            console.log(`[STATE_OBSERVER] Producer seq updated to: ${msg.data.value}`);
        });
        
        /**
         * ALTERNATIVE WIRING:
         * We could wire the producer directly to a system-level collector:
         * this.interface.createCollector("system-log").subscribeTo(pingEmitter);
         */
        
        console.log("[EventSystem] Event example ready. Wiring complete.");
        
        // Trigger the scenario atom.
        this.call("RunScenario");
    }
}

// Bootstrap the server.
new EventSystem();
