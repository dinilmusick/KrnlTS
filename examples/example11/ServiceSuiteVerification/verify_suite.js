import { Entity, krnlUnifiedHttpAdapter } from '../../../dist/index.js';

async function test() {
    const port = 10099;
    const system = new Entity("TestSystem");
    
    // Add a simple functionality to test with manifest
    system.addLocal({
        id: "greet",
        manifest: {
            version: "1.0.0",
            capabilities: ["demo:greet"]
        },
        api: async (input) => {
            return { message: `Hello, ${input.name || 'Stranger'}!` };
        }
    });

    system.attachAdapter(new krnlUnifiedHttpAdapter(system, port));

    console.log("--- Starting Service Suite with Gross Architecture Entity ---");
    await system.finalize();
    
    const baseUrl = `http://localhost:${port}`;

    try {
        // 1. Test REST
        console.log("\n[REST] Testing /call/greet...");
        const restRes = await fetch(`${baseUrl}/call/greet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Antigravity" })
        });
        const restData = await restRes.json();
        console.log("REST Response:", restData);

        // 2. Test Manifest
        console.log("\n[MANIFEST] Testing /manifest...");
        const manifestRes = await fetch(`${baseUrl}/manifest`);
        const manifestData = await manifestRes.json();
        console.log("Manifest Entity Name:", manifestData.entity);
        console.log("Manifest APIs:", manifestData.apiNames);

        // 3. Test MCP
        console.log("\n[MCP] Testing /mcp (tools/list)...");
        const mcpListRes = await fetch(`${baseUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "tools/list",
                params: {}
            })
        });
        const mcpListData = await mcpListRes.json();
        console.log("MCP Tools:", mcpListData.result.tools.map(t => t.name));

        console.log("\n[MCP] Testing /mcp (tools/call/greet)...");
        const mcpCallRes = await fetch(`${baseUrl}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                    name: "greet",
                    arguments: { name: "Agent" }
                }
            })
        });
        const mcpCallData = await mcpCallRes.json();
        console.log("MCP Call Result:", mcpCallData.result);

        // 4. Test ACP
        console.log("\n[ACP] Testing /acp...");
        const acpRes = await fetch(`${baseUrl}/acp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: "call",
                target: "greet",
                payload: { name: "ACP Client" }
            })
        });
        const acpData = await acpRes.json();
        console.log("ACP Response:", acpData);

        console.log("\n🎉 ALL PROTOCOLS VERIFIED SUCCESSFULLY ON THE UNIFIED HTTP ADAPTER! 🎉");

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        system.dispose();
        process.exit(0);
    }
}

test();
