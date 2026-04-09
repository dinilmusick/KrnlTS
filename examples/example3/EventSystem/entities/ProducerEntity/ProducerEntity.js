import { krnlEntityBase } from "../../../../../src/krnl/core/index.js";
import { PingAtom } from "./functionalities/Ping/Ping.js";

export class ProducerEntity extends krnlEntityBase {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(PingAtom);
    }
}
