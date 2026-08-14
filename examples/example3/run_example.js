import { EventSystem } from "./EventSystem/EventSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 3 (Gross Architecture EventSystem) ---");
    const system = new EventSystem(10094, { telemetryEnabled: true });
    
    // Finalize Root Entity
    await system.finalize();
    system.telemetryEnabled = true;

    // Run scenario
    await system.call("RunScenario");

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[EventSystem]", JSON.stringify(system.getTelemetry(), null, 2));

        console.log("\nCleanup: Disposing system...");
        system.dispose();
        process.exit(0);
    }, 3500);
}

main().catch(console.error);
