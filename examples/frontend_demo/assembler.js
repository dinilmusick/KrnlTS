import { krnlSystemEntityBase } from "../../dist/index.js";

export class MyFrontendSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10099, options = {}) {
        super("MyFrontendSystem", null, port, options.host || "0.0.0.0", { ...options, sourcePath: import.meta.url });
    }
}

export default MyFrontendSystem;
