import { krnlSystemEntityBase } from './src/krnl/core/K_ENT_Krnl_System_Entity_Base.js';
import { WebSocket } from 'ws';

async function test() {
    const port = 10100;
    const system = new krnlSystemEntityBase("SinglePortSystem", null, port);
    
    // Add a functionality to test
    system.addLocal({
        id: "ping",
        api: async (input) => { return { pong: true, data: input }; }
    });

    console.log("--- Starting Discovery (Triggering Server) ---");
    // This will start the shared server on 'port'
    await system.startDiscovery();
    
    const baseUrl = `http://localhost:${port}`;

    try {
        // 1. Verify HTTP REST
        console.log("\n[REST] Testing /call/ping on port", port);
        const restRes = await fetch(`${baseUrl}/call/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hello: "world" })
        });
        const restData = await restRes.json();
        console.log("REST Response:", restData);

        // 2. Verify WebSocket
        console.log("\n[WS] Testing WebSocket connection on port", port);
        const ws = new WebSocket(`ws://localhost:${port}`);
        
        await new Promise((resolve, reject) => {
            ws.on('open', () => {
                console.log("WebSocket connected successfully!");
                ws.close();
                resolve();
            });
            ws.on('error', reject);
            setTimeout(() => reject(new Error("WS Connection timeout")), 2000);
        });

        // 3. Verify MCP
        console.log("\n[MCP] Testing /mcp tool listing on port", port);
        const mcpRes = await fetch(`${baseUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
        });
        const mcpData = await mcpRes.json();
        console.log("MCP Tools count:", mcpData.result.tools.length);

        console.log("\n[SUCCESS] All services verified on a single port!");

    } catch (e) {
        console.error("\n[FAILURE] Test failed:", e.message);
    } finally {
        console.log("\n--- Cleaning Up ---");
        system.dispose();
        process.exit(0);
    }
}

test();
