import { krnlSystemEntityBase } from "../../dist/index.js";

export class MyMagneticSystem extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10099, options = {}) {
        // We supply import.meta.url so that the loader can resolve directory paths relative to this file!
        super("MyMagneticSystem", null, port, options.host || "0.0.0.0", { ...options, sourcePath: import.meta.url });
    }
}

export default MyMagneticSystem;
