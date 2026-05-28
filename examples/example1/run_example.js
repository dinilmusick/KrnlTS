import { CalculatorSystem } from "./CalculatorSystem/CalculatorSystem.js";
import { WebInterfaceSystem } from "./WebInterfaceSystem/WebInterfaceSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 1 (Full P2P) ---");
    const calc = new CalculatorSystem(10091, { telemetryEnabled: true });
    const web = new WebInterfaceSystem(10092, { telemetryEnabled: true });

    // Explicitly start discovery for both
    await calc.startDiscovery();
    await web.startDiscovery();

    console.log("Systems started. Manually triggering SetupComms on WebInterface...");

    // Simulate what the original constructor did
    setTimeout(async () => {
        try {
            let status = await web.call("SetupComms");
            // SetupComms returns a raw string after auto-unwrap
            console.log(`[WebInterfaceSystem] Setup status: ${status}`);

            if (status === "Wiring complete.") {
                console.log("[WebInterfaceSystem] Triggering demo calculation...");
                let res = await web.call("UIPanel", { a: 10, b: 5, op: "add" });
                // UIPanel returns { status: "success", result: 15, ... } after auto-unwrap
                console.log("[WebInterfaceSystem] Result from UIPanel:", JSON.stringify(res, null, 2));
            }
        } catch (e) {
            console.error("Error during example 1 execution:", e);
        }
    }, 2000);

    // Enable Telemetry for observability
    calc.telemetryEnabled = true;
    web.telemetryEnabled = true;

    // Wait for discovery and wiring
    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[CalculatorSystem]", JSON.stringify(calc.getTelemetry(), null, 2));
        console.log("[WebInterfaceSystem]", JSON.stringify(web.getTelemetry(), null, 2));
        
        console.log("\nCleanup: Disposing systems...");
        calc.dispose();
        web.dispose();
        process.exit(0);
    }, 12000);
}

main().catch(console.error);
