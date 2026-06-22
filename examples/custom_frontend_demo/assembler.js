import { krnlSystemEntityBase } from "../../dist/index.js";

export class MyCustomFrontendSystem extends krnlSystemEntityBase {
    constructor(port, options = {}) {
        super("MyCustomFrontendSystem", null, port, options.host || "127.0.0.1", { Singleton: true, ...options });
    }
}
