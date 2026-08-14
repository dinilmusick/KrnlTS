import { InstanceSystem } from "./InstanceSystem/InstanceSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 5 (Gross Architecture InstanceSystem) ---");
    const system = new InstanceSystem(10096, { telemetryEnabled: true });
    
    // Finalize Root Entity
    await system.finalize();
    system.telemetryEnabled = true;

    // Run Demo
    const result = await system.call("RunInstanceDemo");
    console.log("[InstanceSystem] Demo result:", result);

    console.log("\n--- Telemetry Report ---");
    console.log("[InstanceSystem]", JSON.stringify(system.getTelemetry(), null, 2));

    console.log("\nCleanup: Disposing system...");
    system.dispose();
    process.exit(0);
}

main().catch(console.error);
