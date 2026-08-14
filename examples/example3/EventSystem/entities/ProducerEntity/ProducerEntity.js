import { Entity } from "../../../../../dist/index.js";
import { PingAtom } from "./functionalities/Ping/Ping.js";

export class ProducerEntity extends Entity {
    static Singleton = true;
    constructor(name, owner) {
        super(name, owner);
        this.addLocal({
            ...PingAtom,
            manifest: {
                version: "1.0.0",
                capabilities: ["events:ping"]
            }
        });
    }
}
