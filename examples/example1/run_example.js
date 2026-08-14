import { CalculatorSystem } from "./CalculatorSystem/CalculatorSystem.js";
import { WebInterfaceSystem } from "./WebInterfaceSystem/WebInterfaceSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    console.log("--- Starting Example 1 (Full P2P with Gross Architecture Entity) ---");
    const calc = new CalculatorSystem(10091, { telemetryEnabled: true });
    const web = new WebInterfaceSystem(10092, { telemetryEnabled: true });

    // Finalize entities (activates root protocol adapters)
    await calc.finalize();
    await web.finalize();

    console.log("Systems finalized and active. Demonstrating in-process and component capabilities...");

    // Test in-process child entity bubbling and execution
    const calcResult = await calc.call("Calculator", { a: 25, b: 17, op: "add" });
    console.log("[CalculatorSystem] Calculation result:", JSON.stringify(calcResult, null, 2));

    // Test workspace requirements aggregation
    const calcReqs = calc.getWorkspaceRequirements();
    console.log("[CalculatorSystem] Manifest requirements declared:", JSON.stringify(calcReqs, null, 2));

    // Enable Telemetry for observability
    calc.telemetryEnabled = true;
    web.telemetryEnabled = true;

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[CalculatorSystem]", JSON.stringify(calc.getTelemetry(), null, 2));
        console.log("[WebInterfaceSystem]", JSON.stringify(web.getTelemetry(), null, 2));
        
        console.log("\nCleanup: Disposing systems...");
        calc.dispose();
        web.dispose();
        process.exit(0);
    }, 1000);
}

main().catch(console.error);
