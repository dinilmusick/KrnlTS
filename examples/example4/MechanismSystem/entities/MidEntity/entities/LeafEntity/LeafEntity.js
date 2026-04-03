import { krnlEntityBase } from "../../../../../../../krnl/core/index.js";
import { LeafActionAtom } from "./functionalities/LeafAction/LeafAction.js";

// Entity descriptor: assembly only.
export class LeafEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(LeafActionAtom);
    }
}
