import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { ProducerEntity } from "./entities/ProducerEntity/ProducerEntity.js";
import { ConsumerEntity } from "./entities/ConsumerEntity/ConsumerEntity.js";

export class EventSystem extends krnlSystemEntityBase {
    constructor(port = 10093) {
        super("EventSystem", null, port);
        
        // 1. Assemble components
        const producer = this.hierarchyManager.createComponentEntity("Producer", ProducerEntity);
        const consumer = this.hierarchyManager.createComponentEntity("Consumer", ConsumerEntity);
        
        // 2. Wire Events
        // Get the promoted emitter from Producer (bubbled up from Ping functionality)
        // Format is "FunctionalityID:EmitterID"
        const pingEmitter = producer.interface.getEmitter("Ping:ping-emitted");
        
        // Get the promoted collector from Consumer (bubbled up from Logger functionality)
        const logCollector = consumer.interface.getCollector("Logger");
        
        // Subscribe the collector to the emitter
        logCollector.subscribeTo(pingEmitter);
        
        console.log("[EventSystem] Event example ready.");
        this.runScenario();
    }

    async runScenario() {
        console.log("[EventSystem] Running scenario: Producer will emit events, Consumer will log them.");
        
        // Trigger the Producer's Ping logic
        for (let i = 0; i < 3; i++) {
            await new Promise(r => setTimeout(r, 1000));
            console.log(`[EventSystem] Triggering Ping ${i+1}...`);
            await this.call("Ping", { some: "data" });
        }
    }
}

new EventSystem();
