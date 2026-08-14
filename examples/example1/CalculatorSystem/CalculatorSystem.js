// CalculatorSystem/CalculatorSystem.js
import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";
import { LoggerEntity } from "./entities/Logger/Logger.js";

export class CalculatorSystem extends Entity {
    static Singleton = true;
    constructor(port = 10091, options = {}) {
        super("CalculatorSystem", null, options);

        // 1. Logic Assembly with Manifest declaration
        this.addLocal({ 
            ...CalculatorAtom, 
            manifest: {
                version: "1.0.0",
                author: "KrnlTS",
                capabilities: ["math:arithmetic"]
            },
            sourcePath: "examples/example1/CalculatorSystem/functionalities/Calculator/Calculator.js" 
        });

        // 2. Component Assembly (Child Entities)
        const display = this.hierarchyManager.createComponentEntity("Display", DisplayEntity);
        const logger = this.hierarchyManager.createComponentEntity("Logger", LoggerEntity);

        // 3. Local Event Wiring (In-Process Emitters & Collectors)
        const calcEmitter = this.interface.getEmitter("Calculator:onCalculated");
        
        display.interface.getCollector("show").subscribeTo(calcEmitter, (msg) => {
            if (msg.data.status === "complete") {
                display.call("show", msg.data.formatted);
            }
        });

        logger.interface.getCollector("Audit").subscribeTo(calcEmitter);

        // 4. Observable State Changes
        const stateEmitter = this.interface.getEmitter("Calculator:state:changed");
        stateEmitter.subscribe((msg) => {
            console.log(`[STATE_OBSERVER] Property '${msg.data.prop}' changed to: ${msg.data.value}`);
        });

        // 5. Attach Protocol Adapter
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
