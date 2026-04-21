import { MechanismSystem } from "./MechanismSystem/MechanismSystem.js";

async function main() {
    console.log("--- Starting Example 4 ---");
    const system = new MechanismSystem(10095);
    await system.startDiscovery();
    
    // Explicitly call the demo
    const result = await system.call("RunMechanismDemo");
    console.log("[MechanismSystem] Demo result:", result);

    setTimeout(() => {
        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
