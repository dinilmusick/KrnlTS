// examples/example2/Level1System/entities/Level2Entity/Level2Entity.js
import { Entity } from "../../../../../dist/index.js";
import { Level3Entity } from "./entities/Level3Entity/Level3Entity.js";

/**
 * DESCRIPTOR: Level2Entity (Middle Level Entity)
 */
export class Level2Entity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        
        // Component Assembly
        this.hierarchyManager.createComponentEntity("Level3", Level3Entity);
        
        // Privacy filter demonstration: Stop DeepLogic bubbling to Level 1
        const deepProxy = this.getRemote("DeepLogic");
        if (deepProxy) {
            deepProxy.setVisibility('private'); 
            console.log("[Level 2] Caught 'DeepLogic' bubble and marked it PRIVATE.");
        }
    }
}
