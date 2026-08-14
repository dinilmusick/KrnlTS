import { Entity, krnlUnifiedHttpAdapter } from "../../../dist/index.js";
import { RunInstanceDemoAtom } from "./functionalities/RunInstanceDemo/RunInstanceDemo.js";

export class InstanceSystem extends Entity {
    static Singleton = true;

    constructor(port = 10096, options = {}) {
        super("InstanceSystem", null, options);
        this.addLocal({
            ...RunInstanceDemoAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["demo:instances"]
            }
        });
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port, options.host || "0.0.0.0"));
    }
}
