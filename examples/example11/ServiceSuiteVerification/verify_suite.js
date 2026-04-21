import { krnlSystemEntityBase } from '../../../src/krnl/core/index.js';

async function test() {
    const system = new krnlSystemEntityBase("TestSystem", null, 10099);
    
    // Add a simple functionality to test
    system.addLocal({
        id: "greet",
        api: async (input) => {
            return { message: `Hello, ${input.name || 'Stranger'}!` };
        }
    });

    console.log("--- Starting Service Suite ---");
    await system.startDiscovery();
    
    const baseUrl = "http://localhost:10099";

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
        console.log("Manifest Entity Name:", manifestData.entityName);
        console.log("Manifest APIs:", manifestData.inputs.api);

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
                    arguments: { name: "AI Agent" }
                }
            })
        });
        const mcpCallData = await mcpCallRes.json();
        console.log("MCP Call Result:", mcpCallData.result.content[0].text);

        // 4. Test ACP
        console.log("\n[ACP] Testing /acp/info...");
        const acpInfoRes = await fetch(`${baseUrl}/acp/info`);
        const acpInfoData = await acpInfoRes.json();
        console.log("ACP Info Agent ID:", acpInfoData.agentId);

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        console.log("\n--- Cleaning Up ---");
        system.dispose();
        process.exit(0);
    }
}

test();
