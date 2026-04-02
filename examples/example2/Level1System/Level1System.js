import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { Level2Entity } from "./entities/Level2Entity/Level2Entity.js";
import { TestNestingAtom } from "./functionalities/TestNesting/TestNesting.js";

export class Level1System extends krnlSystemEntityBase {
    constructor(port = 10092) {
        super("Level1System", null, port);
        
        this.addLocal(TestNestingAtom);

        // Assemble component
        this.hierarchyManager.createComponentEntity("Level2", Level2Entity);
        
        console.log("[Level1System] Nesting example ready.");
        this.call("TestNesting");
    }
}

new Level1System();
