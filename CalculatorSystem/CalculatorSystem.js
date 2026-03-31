// CalculatorSystem/CalculatorSystem.js
import { krnlSystemEntityBase } from "../krnl/core/index.js";
import { CalculatorAtom } from "./functionalities/Calculator/Calculator.js";
import { DisplayEntity } from "./entities/Display/Display.js";

/**
 * CALCULATOR SYSTEM (The Backend Logic)
 * Listens on port 10091. Exposes math logic to the network.
 */
export class CalculatorSystem extends krnlSystemEntityBase {
    constructor(port = 10091) {
        super("CalculatorSystem", null, port);

        // 1. Assemble Logic
        this.addLocal(CalculatorAtom);

        // 2. Assemble Components
        this.hierarchyManager.createComponentEntity("Display", DisplayEntity);

        // 3. System Initialization
        this.startDiscovery().then(() => {
            console.log(`[CalculatorSystem] Backend logic ready on port ${port}.`);
        });
    }
}

// Bootstrap
new CalculatorSystem();
