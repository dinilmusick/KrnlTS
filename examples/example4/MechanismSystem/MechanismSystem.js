import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { MidEntity } from "./entities/MidEntity/MidEntity.js";
import { RunMechanismDemoAtom } from "./functionalities/RunMechanismDemo/RunMechanismDemo.js";

export class MechanismSystem extends Entity {
    static Singleton = true;
    constructor(port = 10095, options = {}) {
        super("MechanismSystem", null, options);
        this.hierarchyManager.createComponentEntity("Mid", MidEntity);
        this.addLocal({
            ...RunMechanismDemoAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["demo:mechanisms"]
            }
        });
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
