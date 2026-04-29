import { MechanismSystem } from "./MechanismSystem/MechanismSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 4 ---");
    const system = new MechanismSystem(10095);
    await system.startDiscovery();
    
    // Explicitly call the demo
    const result = await system.call("RunMechanismDemo");
    console.log("[MechanismSystem] Demo result:", result);

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[MechanismSystem]", JSON.stringify(system.getTelemetry(), null, 2));

        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
