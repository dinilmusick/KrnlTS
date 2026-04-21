import { Level1System } from "./Level1System/Level1System.js";

async function main() {
    console.log("--- Starting Example 2 ---");
    const system = new Level1System(10093);
    await system.startDiscovery();
    
    // Example 2 calls 'TestNesting' in its constructor
    setTimeout(() => {
        system.dispose();
        process.exit(0);
    }, 5000);
}

main().catch(console.error);
