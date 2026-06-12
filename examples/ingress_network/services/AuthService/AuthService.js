import { krnlSystemEntityBase } from "../../../../dist/index.js";

export class AuthService extends krnlSystemEntityBase {
    static Singleton = true;
    constructor(port = 10091, options = {}) {
        super("AuthService", null, port, options.host || "0.0.0.0", options);

        this.addLocal({
            id: "login",
            visibility: "public",
            description: "Authenticate user and return session token.",
            api: async (input) => {
                const { username, password } = input || {};
                if (username === "admin" && password === "secret") {
                    return { authenticated: true, token: "session-tok-12345", username };
                }
                return { authenticated: false, reason: "Invalid credentials" };
            }
        });
    }
}
