import { krnlEntityBase } from "../../../../../krnl/core/index.js";
import { HandleAtom } from "./functionalities/Handle/Handle.js";

export class WorkerEntity extends krnlEntityBase {
    static Singleton = false;

    constructor(name, owner, options = {}) {
        super(name, owner, options);
        this.addLocal(HandleAtom);
    }
}
