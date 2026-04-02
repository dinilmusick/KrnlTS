// CalculatorSystem/CalculatorSystem.js
import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";
import { LoggerEntity } from "./entities/Logger/Logger.js";

export class CalculatorSystem extends krnlSystemEntityBase {
    constructor(port = 10091) {
        super("CalculatorSystem", null, port);

        // 1. Logic Assembly
        this.addLocal(CalculatorAtom);

        // 2. Component Assembly
        const display = this.hierarchyManager.createComponentEntity("Display", DisplayEntity);
        const logger = this.hierarchyManager.createComponentEntity("Logger", LoggerEntity);

        // 3. LOCAL WIRING (Same System)
        // Here, multiple entities subscribe to the same output
        const calcEmitter = this.interface.getEmitter("Calculator:onCalculated");
        
        // Wire Display component
        display.interface.getCollector("show").subscribeTo(calcEmitter, (msg) => {
            if (msg.data.status === "complete") {
                display.call("show", msg.data.formatted);
            }
        });

        // Wire Logger component
        logger.interface.getCollector("Audit").subscribeTo(calcEmitter);

        this.startDiscovery().then(() => {
            console.log(`[CalculatorSystem] Ready. Local components (Display, Logger) wired.`);
        });
    }
}

new CalculatorSystem();
