// CalculatorSystem/CalculatorSystem.js
import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";
import { LoggerEntity } from "./entities/Logger/Logger.js";

export class CalculatorSystem extends krnlSystemEntityBase {
    static Singleton = true;
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

        // 4. DEMONSTRATE PROXIED STATE OBSERVABILITY
        // Whenever 'state.lastResult' is changed in Calculator logic, 
        // a 'state:changed' event is automatically emitted.
        const stateEmitter = this.interface.getEmitter("Calculator:state:changed");
        stateEmitter.subscribe((msg) => {
            console.log(`[STATE_OBSERVER] Property '${msg.data.prop}' changed to: ${msg.data.value}`);
        });

        this.startDiscovery().then(() => {
            console.log(`[CalculatorSystem] Ready. Local components (Display, Logger) wired.`);
        });
    }
}
