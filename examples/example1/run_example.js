import { CalculatorSystem } from "./CalculatorSystem/CalculatorSystem.js";
import { WebInterfaceSystem } from "./WebInterfaceSystem/WebInterfaceSystem.js";

async function main() {
    console.log("--- Starting Example 1 (Full P2P) ---");
    const calc = new CalculatorSystem(10091);
    const web = new WebInterfaceSystem(10092);

    // Explicitly start discovery for both
    await calc.startDiscovery();
    await web.startDiscovery();

    console.log("Systems started. Manually triggering SetupComms on WebInterface...");

    // Simulate what the original constructor did
    setTimeout(async () => {
        try {
            let status = await web.call("SetupComms");
            // Handle both raw string and wrapped status for backward compatibility in examples
            if (status && typeof status === 'object' && status.status === 'success') {
                status = status.payload;
            }

            console.log(`[WebInterfaceSystem] Setup status: ${status}`);
            if (status === "Wiring complete.") {
                console.log("[WebInterfaceSystem] Triggering demo calculation...");
                let res = await web.call("UIPanel", { a: 10, b: 5, op: "add" });
                if (res && typeof res === 'object' && res.status === 'success') res = res.payload;
                console.log("[WebInterfaceSystem] Result from UIPanel:", res);
            }
        } catch (e) {
            console.error("Error during example 1 execution:", e);
        }
    }, 2000);

    // Wait for discovery and wiring
    setTimeout(() => {
        console.log("\nCleanup: Disposing systems...");
        calc.dispose();
        web.dispose();
        process.exit(0);
    }, 12000);
}

main().catch(console.error);
