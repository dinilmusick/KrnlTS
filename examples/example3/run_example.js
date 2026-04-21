import { EventSystem } from "./EventSystem/EventSystem.js";

async function main() {
    console.log("--- Starting Example 3 ---");
    const system = new EventSystem(10094);
    await system.startDiscovery();
    
    // Example 3 calls 'RunScenario' in its constructor
    setTimeout(() => {
        system.dispose();
        process.exit(0);
    }, 8000);
}

main().catch(console.error);
