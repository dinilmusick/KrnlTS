import { Entity } from "../../../../../dist/index.js";
import { HandleAtom } from "./functionalities/Handle/Handle.js";

export class WorkerEntity extends Entity {
    static Singleton = false;

    constructor(name, owner, options = {}) {
        super(name, owner, options);
        this.addLocal({
            ...HandleAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["task:handle"]
            }
        });
    }
}
