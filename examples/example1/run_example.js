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
            const status = await web.call("SetupComms");
            console.log(`[WebInterfaceSystem] Setup status: ${status}`);
            if (status === "Wiring complete.") {
                console.log("[WebInterfaceSystem] Triggering demo calculation...");
                const res = await web.call("UIPanel", { a: 10, b: 5, op: "add" });
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
