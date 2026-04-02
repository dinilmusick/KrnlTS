import { krnlSystemEntityBase } from "../../../krnl/core/index.js";
import { Level2Entity } from "./entities/Level2Entity/Level2Entity.js";

export class Level1System extends krnlSystemEntityBase {
    constructor(port = 10092) {
        super("Level1System", null, port);
        
        // Assemble component
        this.hierarchyManager.createComponentEntity("Level2", Level2Entity);
        
        console.log("[Level1System] Nesting example ready.");
        this.testNesting();
    }

    async testNesting() {
        console.log("[Level1System] Testing 3-level nesting call...");
        // Calling Level3 logic through Level2 promotion
        try {
            // Give it a moment to boot up and promote functionalities
            setTimeout(async () => {
                const result = await this.call("DeepLogic", { data: "Hello from Level 1" });
                console.log("[Level1System] Result:", result);
            }, 500);
        } catch (e) {
            console.error("[Level1System] Call failed:", e.message);
        }
    }
}

new Level1System();
