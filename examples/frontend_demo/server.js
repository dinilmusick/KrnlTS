import { MyFrontendSystem } from "./assembler.js";

async function main() {
    console.log("=== Starting Glass-Brutalism Theme Showcase Server ===");
    const port = 10099;
    const system = new MyFrontendSystem(port, { host: "127.0.0.1" });
    await system._startSharedServer();
    await system.startDiscovery();
    await system.whenReady();
    console.log(`\n🚀 Server live and running at: http://127.0.0.1:${port}/frontend/`);
    console.log("Press Ctrl+C to stop.");
}

main().catch(console.error);
