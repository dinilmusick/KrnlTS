import { krnlSystemEntityBase } from "../../../../dist/index.js";

export class AuthService extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10091, options = {}) {
        // Source path option is required so the magnetic loader knows where this class is located
        super("AuthService", null, port, options.host || "0.0.0.0", { ...options, sourcePath: import.meta.url });
    }
    async boot() {
        await super.boot();
    }
}

export default AuthService;
