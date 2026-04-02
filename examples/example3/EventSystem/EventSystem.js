import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { ProducerEntity } from "./entities/ProducerEntity/ProducerEntity.js";
import { ConsumerEntity } from "./entities/ConsumerEntity/ConsumerEntity.js";
import { RunScenarioAtom } from "./functionalities/RunScenario/RunScenario.js";

export class EventSystem extends krnlSystemEntityBase {
    constructor(port = 10093) {
        super("EventSystem", null, port);
        
        // 1. Register logic
        this.addLocal(RunScenarioAtom);

        // 2. Assemble components
        const producer = this.hierarchyManager.createComponentEntity("Producer", ProducerEntity);
        const consumer = this.hierarchyManager.createComponentEntity("Consumer", ConsumerEntity);
        
        // 3. Wire Events
        const pingEmitter = producer.interface.getEmitter("Ping:ping-emitted");
        const logCollector = consumer.interface.getCollector("Logger");
        logCollector.subscribeTo(pingEmitter);
        
        console.log("[EventSystem] Event example ready.");
        
        // Call the functionality instead of a loose function
        this.call("RunScenario");
    }
}

new EventSystem();
