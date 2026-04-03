// examples/example2/Level1System/entities/Level2Entity/entities/Level3Entity/Level3Entity.js

import { krnlEntityBase } from "../../../../../../../krnl/core/index.js";
import { DeepLogic } from "./functionalities/DeepLogic/DeepLogic.js";

/**
 * DESCRIPTOR: Level3Entity (The Bottom Level)
 * -------------------------------------------------------------------------
 * This entity exists at the very bottom of the directory tree.
 * It adds a public functionality that will be promoted to its owner.
 */
export class Level3Entity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        // Pass identification up to the base class.
        super(name, owner);
        
        /**
         * REGISTER LOCAL LOGIC
         * Because DeepLogic is 'public', Level3 will automatically notify
         * Level2 (its owner) to create a proxy for this logic.
         */
        this.addLocal(DeepLogic);
        
        /**
         * ALTERNATIVE ACTION:
         * If we wanted to add more logic atoms:
         * this.addLocal(SensorLogic);
         * this.addLocal(DiagnosticsLogic);
         */
    }
}
