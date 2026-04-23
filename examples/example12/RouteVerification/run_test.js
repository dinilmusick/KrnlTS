import { krnlSystemEntityBase } from '../../../src/krnl/core/K_ENT_Krnl_System_Entity_Base.js';

class RouteTestSystem extends krnlSystemEntityBase {
    constructor() {
        super("RouteTestSystem", 10099);
    }
}

const system = new RouteTestSystem();
await system.activateServiceSuite();

console.log("System started. Test with: curl -i http://localhost:10099/invalid-route");
console.log("Press Ctrl+C to stop.");
