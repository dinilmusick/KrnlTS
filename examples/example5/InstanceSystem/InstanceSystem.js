import { krnlSystemEntityBase } from "../../../src/krnl/core/index.js";
import { RunInstanceDemoAtom } from "./functionalities/RunInstanceDemo/RunInstanceDemo.js";

export class InstanceSystem extends krnlSystemEntityBase {
    static Singleton = true;

    constructor(port = 10095) {
        super("InstanceSystem", null, port);
        this.addLocal(RunInstanceDemoAtom);
    }
}

const system = new InstanceSystem();
const result = await system.call("RunInstanceDemo");
console.log("[InstanceSystem] Demo result:", result);
