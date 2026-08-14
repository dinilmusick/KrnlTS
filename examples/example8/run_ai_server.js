import { AIServerSystem } from "./AIServerSystem/AIServerSystem.js";
import { telemetry } from "../../dist/index.js";

async function main() {
    telemetry.enabled = true;
    const port = 10111;
    const system = new AIServerSystem(port);

    // Finalize Root Entity
    await system.finalize();

    console.log("--- Starting Example 8 (Gross Architecture AI Server) ---");
    console.log(`[AIServerSystem] Active and listening on port ${port}`);

    // Verify Direct Call
    const calcRes = await system.call("calculator", { a: 20, b: 3, op: "mul" });
    console.log("[AIServerSystem] Calculator result:", calcRes);

    // Verify Text Processor
    const textRes = await system.call("textProcessor", { text: "krnlts", action: "uppercase" });
    console.log("[AIServerSystem] Text processor result:", textRes);

    // Verify Flow Call
    const flowRes = await system.call("calculateAndFormat", { a: 10, b: 5, op: "add" });
    console.log("[AIServerSystem] Flow result:", flowRes);

    // Verify Manifest Aggregation
    const reqs = system.getWorkspaceRequirements();
    console.log("[AIServerSystem] Manifest requirements:", reqs);

    setTimeout(() => {
        console.log("\n--- Telemetry Report ---");
        console.log("[AIServerSystem]", JSON.stringify(system.getTelemetry(), null, 2));

        system.dispose();
        process.exit(0);
    }, 500);
}

main().catch(err => {
    console.error("Failed to run AI Server example:", err);
});
