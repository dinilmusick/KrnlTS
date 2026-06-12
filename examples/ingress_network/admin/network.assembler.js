import { AdminSystem } from "./admin.js";
import { AuthService } from "../services/AuthService/AuthService.js";
import { DataService } from "../services/DataService/DataService.js";
import { AIService } from "../services/AIService/AIService.js";

/**
 * assembleNetwork
 * The canonical assembler pattern for creating and configuring the Ingress Network.
 * This runs all microservices under a single OS port via in-process routing.
 *
 * @param {number} port - The unified TCP port for the gateway (admin).
 * @param {string} host - Interface to bind to.
 * @returns {Promise<AdminSystem>}
 */
export async function assembleNetwork(port = 10099, host = "0.0.0.0") {
    const admin = new AdminSystem(port, { host });

    console.log(`[Assembler] Assembling Ingress Network. Admin Gateway: ${admin.entityName}`);

    // Standard ingress configuration mapping prefix paths to service classes.
    // Member ports are dynamically overridden and managed zero-port by the Ingress Network.
    await admin.startIngressNetwork([
        { ServiceClass: AuthService, prefix: "auth" },
        { ServiceClass: DataService, prefix: "data" },
        { ServiceClass: AIService, prefix: "ai" }
    ]);

    console.log(`[Assembler] Ingress Network successfully assembled under port ${port}.`);
    return admin;
}
