import { krnlSystemEntityBase } from "../../../dist/index.js";
import { MidEntity } from "./entities/MidEntity/MidEntity.js";
import { RunMechanismDemoAtom } from "./functionalities/RunMechanismDemo/RunMechanismDemo.js";

// System descriptor: assembly + orchestration trigger only.
export class MechanismSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10094) {
        super("MechanismSystem", null, port);
        this.hierarchyManager.createComponentEntity("Mid", MidEntity);
        this.addLocal(RunMechanismDemoAtom);
    }
}

// const system = new MechanismSystem();
// const result = await system.call("RunMechanismDemo");
// console.log("[MechanismSystem] Demo result:", result);
