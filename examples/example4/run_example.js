import { MechanismSystem } from "./MechanismSystem/MechanismSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 4 (Gross Architecture MechanismSystem) ---");
    const system = new MechanismSystem(10095, { telemetryEnabled: true });
    
    // Finalize Root Entity
    await system.finalize();
    system.telemetryEnabled = true;

    // Run Demo
    const result = await system.call("RunMechanismDemo");
    console.log("[MechanismSystem] Demo result:", result);

    console.log("\n--- Telemetry Report ---");
    console.log("[MechanismSystem]", JSON.stringify(system.getTelemetry(), null, 2));

    console.log("\nCleanup: Disposing system...");
    system.dispose();
    process.exit(0);
}

main().catch(console.error);
