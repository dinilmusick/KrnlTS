// examples/example2/Level1System/Level1System.js
import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { Level2Entity } from "./entities/Level2Entity/Level2Entity.js";
import { TestNestingAtom } from "./functionalities/TestNesting/TestNesting.js";

/**
 * DESCRIPTOR: Level1System (Root Entity)
 */
export class Level1System extends Entity {
    static Singleton = true;
    constructor(port = 10092, options = {}) {
        super("Level1System", null, options);
        
        // 1. Register Local Verification Functionality
        this.addLocal({
            ...TestNestingAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["test:nesting"]
            }
        });

        // 2. Child Entity Assembly
        this.hierarchyManager.createComponentEntity("Level2", Level2Entity);
        
        console.log("[Level 1] System manifested. Nesting initialized.");
        
        // 3. Attach Protocol Adapter
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
