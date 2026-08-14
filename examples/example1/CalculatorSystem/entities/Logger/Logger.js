// CalculatorSystem/entities/Logger/Logger.js
import { Entity } from "../../../../../dist/index.js";
import { AuditAtom } from "./functionalities/Audit/Audit.js";

export class LoggerEntity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        this.addLocal({
            ...AuditAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["logging:audit"]
            }
        });
    }
}
