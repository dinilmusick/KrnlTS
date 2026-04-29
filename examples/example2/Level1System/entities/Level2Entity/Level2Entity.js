// examples/example2/Level1System/entities/Level2Entity/Level2Entity.js

import { krnlEntityBase } from "../../../../../dist/index.js";
import { Level3Entity } from "./entities/Level3Entity/Level3Entity.js";

/**
 * DESCRIPTOR: Level2Entity (The Middle Level)
 * -------------------------------------------------------------------------
 * This entity sits between the system and the component. 
 * It will receive the bubbled logic and demonstrate how to HIDE it from
 * the Level 1 System above it.
 */
export class Level2Entity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        // Initialize the base entity.
        super(name, owner);
        
        /**
         * SUMMON COMPONENT
         * Creating Level3 will trigger its constructor, which adds 'DeepLogic'.
         * Because 'DeepLogic' is public, it will automatically register a
         * REMOTE proxy inside THIS Level2Entity instance.
         */
        this.hierarchyManager.createComponentEntity("Level3", Level3Entity);
        
        /**
         * BUBBLING CONTROL (The "Privacy Filter")
         * ---------------------------------------------------------------------
         * By default, the proxy created above is 'public' and would bubble to Level 1.
         * To STOP the bubbling, we find the proxy and set it to 'private'.
         * 
         * This means Level2 can call 'DeepLogic', but Level1 will never know it exists.
         */
        const deepProxy = this.getRemote("DeepLogic");
        if (deepProxy) {
            deepProxy.setVisibility('private'); 
            console.log("[Level 2] Caught 'DeepLogic' bubble and marked it PRIVATE.");
        }

        /**
         * ALTERNATIVE ACTION:
         * To allow bubbling (the default behavior):
         * // Do nothing. DeepLogic remains public and reaches Level 1.
         * 
         * To selectively rename the logic while bubbling:
         * this.addRemote({ id: "SecretLogic", targetEntity: l3, targetFunction: "DeepLogic" });
         */
    }
}
