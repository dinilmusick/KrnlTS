// examples/example3/EventSystem/EventSystem.js
import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { ProducerEntity } from "./entities/ProducerEntity/ProducerEntity.js";
import { ConsumerEntity } from "./entities/ConsumerEntity/ConsumerEntity.js";
import { RunScenarioAtom } from "./functionalities/RunScenario/RunScenario.js";

/**
 * DESCRIPTOR: EventSystem (Root Entity)
 */
export class EventSystem extends Entity {
    static Singleton = true;
    constructor(port = 10094, options = {}) {
        super("EventSystem", null, options);
        
        // 1. Register Local Scenario Functionality
        this.addLocal({
            ...RunScenarioAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["scenario:event_test"]
            }
        });

        // 2. Child Entity Assembly
        const producer = this.hierarchyManager.createComponentEntity("Producer", ProducerEntity);
        const consumer = this.hierarchyManager.createComponentEntity("Consumer", ConsumerEntity);
        
        // 3. Inter-Component Event Wiring
        const pingEmitter = producer.interface.getEmitter("Ping:ping-emitted");
        const logCollector = consumer.interface.getCollector("Logger");
        logCollector.subscribeTo(pingEmitter);

        // 4. Observable State Changes
        const pingStateEmitter = producer.interface.getEmitter("Ping:state:changed");
        pingStateEmitter.subscribe((msg) => {
            console.log(`[STATE_OBSERVER] Producer seq updated to: ${msg.data.value}`);
        });
        
        console.log("[EventSystem] Event example ready. Wiring complete.");
        
        // 5. Attach Protocol Adapter
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
