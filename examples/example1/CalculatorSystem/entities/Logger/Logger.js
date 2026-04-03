// CalculatorSystem/entities/Logger/Logger.js
import { krnlEntityBase } from "../../../krnl/core/index.js";
import { AuditAtom } from "./functionalities/Audit/Audit.js";

export class LoggerEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        /**
         * INTERFACE DESCRIPTION
         * ---------------------------------------------------------
         * Inputs:
         * - 'Audit': Logs calculation data.
         */
        this.addLocal(AuditAtom);
    }
}
