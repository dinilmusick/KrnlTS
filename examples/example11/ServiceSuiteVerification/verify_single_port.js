import { Entity, krnlUnifiedHttpAdapter } from '../../../dist/index.js';
import { WebSocket } from 'ws';

async function test() {
    const port = 10100;
    const system = new Entity("SinglePortSystem");
    
    // Add a functionality with manifest
    system.addLocal({
        id: "ping",
        manifest: {
            version: "1.0.0",
            capabilities: ["test:ping"]
        },
        api: async (input) => { return { pong: true, data: input }; }
    });

    system.attachAdapter(new krnlUnifiedHttpAdapter(system, port));

    console.log("--- Starting Discovery (Finalizing Server) ---");
    await system.finalize();
    
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
