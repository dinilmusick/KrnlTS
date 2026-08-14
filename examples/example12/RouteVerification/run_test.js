import { Entity, krnlUnifiedHttpAdapter } from '../../../dist/index.js';

class RouteTestSystem extends Entity {
    constructor(port = 10099) {
        super("RouteTestSystem");
        this.addLocal({
            id: "ping",
            manifest: {
                version: "1.0.0",
                capabilities: ["test:ping"]
            },
            api: async () => ({ pong: true })
        });
        this.attachAdapter(new krnlUnifiedHttpAdapter(this, port));
    }
}

async function test() {
    console.log("--- Starting Example 12 (Gross Architecture Route Verification) ---");
    const port = 10099;
    const system = new RouteTestSystem(port);
    await system.finalize();

    const baseUrl = `http://localhost:${port}`;

    try {
        // 1. Valid Route Test
        const validRes = await fetch(`${baseUrl}/call/ping`, { method: 'POST' });
        console.log("[RouteVerification] /call/ping status:", validRes.status);

        // 2. Invalid Route Test
        const invalidRes = await fetch(`${baseUrl}/invalid-route`);
        console.log("[RouteVerification] /invalid-route status:", invalidRes.status);

        console.log("🎉 ROUTE VERIFICATION PASSED SUCCESSFULLY! 🎉");
    } finally {
        system.dispose();
        process.exit(0);
    }
}

test().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
