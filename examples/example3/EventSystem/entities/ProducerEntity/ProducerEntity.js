import { krnlEntityBase } from "../../../../../krnl/core/index.js";
import { PingAtom } from "./functionalities/Ping/Ping.js";

export class ProducerEntity extends krnlEntityBase {
    constructor(name, owner) {
        super(name, owner);
        this.addLocal(PingAtom);
    }
}
