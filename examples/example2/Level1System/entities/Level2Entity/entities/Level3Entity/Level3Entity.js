// examples/example2/Level1System/entities/Level2Entity/entities/Level3Entity/Level3Entity.js
import { Entity } from "../../../../../../../dist/index.js";
import { DeepLogic } from "./functionalities/DeepLogic/DeepLogic.js";

/**
 * DESCRIPTOR: Level3Entity (Bottom Level Entity)
 */
export class Level3Entity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        this.addLocal({
            ...DeepLogic,
            manifest: {
                version: "1.0.0",
                capabilities: ["core:deep_logic"]
            }
        });
    }
}
