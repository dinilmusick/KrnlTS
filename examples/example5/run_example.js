import { InstanceSystem } from "./InstanceSystem/InstanceSystem.js";

async function main() {
    console.log("--- Starting Example 5 ---");
    const system = new InstanceSystem(10096);
    await system.startDiscovery();
    
    // Explicitly call the demo
    const result = await system.call("RunInstanceDemo");
    console.log("[InstanceSystem] Demo result:", result);

    setTimeout(() => {
        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
