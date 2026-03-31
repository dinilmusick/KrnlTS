// CalculatorSystem/entities/Logger/Logger.js
import { krnlEntityBase } from "../../../krnl/core/index.js";

export class LoggerEntity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        
        // Register a collector to receive signals
        this.interface.createCollector("calculation-log");

        // LOCAL SUBSCRIPTION
        // We wait for the owner to wire us to the Calculator's emitter
        this.interface.getCollector("calculation-log")._directHandler = (msg) => {
            console.log(`[LOCAL_LOGGER] Audit: ${JSON.stringify(msg.data)}`);
        };
    }
}
