// examples/example2/Level1System/Level1System.js

import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";
import { Level2Entity } from "./entities/Level2Entity/Level2Entity.js";
import { TestNestingAtom } from "./functionalities/TestNesting/TestNesting.js";

/**
 * DESCRIPTOR: Level1System (The Root Server)
 * -------------------------------------------------------------------------
 * This is the top-most entity. It will attempt to call functionalities
 * from its deep components to verify what bubbled up and what didn't.
 */
export class Level1System extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10092) {
        // Initialize the network-enabled system base.
        super("Level1System", null, port);
        
        /**
         * REGISTER TEST LOGIC
         * We add a local functionality atom to run the verification scenario.
         */
        this.addLocal(TestNestingAtom);

        /**
         * SUMMON MIDDLE LAYER
         * Creating Level2 will recursively create Level3.
         */
        this.hierarchyManager.createComponentEntity("Level2", Level2Entity);
        
        console.log("[Level 1] System manifested. Nesting initialized.");
        
        /**
         * EXECUTE VERIFICATION
         * We call our local 'TestNesting' functionality to see what's visible.
         */
        this.call("TestNesting");
        
        /**
         * ALTERNATIVE ACTION:
         * To manually check the interface:
         * console.log("Public Ports:", this.interface.collectorNames);
         */
    }
}

// Bootstrap the system process.
new Level1System();
