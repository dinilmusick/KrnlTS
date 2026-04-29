import { krnlEntityBase } from "../../../../../dist/index.js";
import { ReadAtom } from "./functionalities/Read/Read.js";

export class CacheEntity extends krnlEntityBase {
    static Singleton = true;

    constructor(name, owner, options = {}) {
        super(name, owner, options);
        this.addLocal(ReadAtom);
    }
}
