import { assembleNetwork } from "./admin/network.assembler.js";
import http from "http";
import { WebSocket } from "ws";

// Helper to make local http requests
function requestJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const reqOpts = {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        };

        const req = http.request(reqOpts, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk.toString());
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, text: body });
                }
            });
        });

        req.on("error", reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function main() {
    console.log("=== Launching Ingress Network Demo ===");
    const port = 10099;
    const admin = await assembleNetwork(port, "127.0.0.1");

    await admin.whenReady();
    console.log("\n1. Unified server is ready. Querying Gateway manifest...");

    // Test Gross Manifest
    const manifestRes = await requestJson(`http://localhost:${port}/manifest`);
    console.log("HTTP GET /manifest Result:", JSON.stringify(manifestRes.data, null, 2));

    // Test Ingress Network Topology endpoint
    const topologyRes = await requestJson(`http://localhost:${port}/call/getIngressNetworkTopology`);
    console.log("HTTP POST /call/getIngressNetworkTopology Result:", JSON.stringify(topologyRes.data, null, 2));

    // Test Routing: auth/call/login
    console.log("\n2. Calling AuthService login endpoint via gateway routing...");
    const loginRes = await requestJson(`http://localhost:${port}/auth/call/login`, {
        method: "POST",
        body: { username: "admin", password: "secret" }
    });
    console.log("HTTP POST /auth/call/login Result:", JSON.stringify(loginRes.data, null, 2));

    // Test Routing: data/call/fetchData
    console.log("\n3. Calling DataService fetchData via gateway routing...");
    const dataRes = await requestJson(`http://localhost:${port}/data/call/fetchData`, {
        method: "POST",
        body: { category: "electronics" }
    });
    console.log("HTTP POST /data/call/fetchData Result:", JSON.stringify(dataRes.data, null, 2));

    // Test MCP tools list aggregation
    console.log("\n4. Requesting aggregated MCP tools...");
    const mcpToolsRes = await requestJson(`http://localhost:${port}/mcp`, {
        method: "POST",
        body: {
            jsonrpc: "2.0",
            id: "mcp-list-1",
            method: "tools/list",
            params: {}
        }
    });
    console.log("HTTP POST /mcp tools/list Result:", JSON.stringify(mcpToolsRes.data, null, 2));

    // Test MCP namespaced tool execution
    console.log("\n5. Executing namespaced MCP tool 'ai.generateText'...");
    const mcpCallRes = await requestJson(`http://localhost:${port}/mcp`, {
        method: "POST",
        body: {
            jsonrpc: "2.0",
            id: "mcp-call-1",
            method: "tools/call",
            params: {
                name: "ai.generateText",
                arguments: { prompt: "Explain ingress networking in one sentence." }
            }
        }
    });
    console.log("HTTP POST /mcp tools/call Result:", JSON.stringify(mcpCallRes.data, null, 2));

    // Test WebSocket RPC target routing
    console.log("\n6. Testing WebSocket RPC routing...");
    await new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        ws.on("open", () => {
            // Send namespaced call to 'auth' for heartbeat
            const payload = {
                kind: "rpc-request",
                requestId: "ws-rpc-1",
                method: "call",
                params: {
                    target: "auth",
                    fid: "heartbeat",
                    data: {}
                }
            };
            ws.send(JSON.stringify(payload));
        });
        ws.on("message", (raw) => {
            const msg = JSON.parse(raw.toString());
            console.log("WS RPC Response to namespaced call:", JSON.stringify(msg, null, 2));
            ws.close();
            resolve();
        });
        ws.on("error", reject);
    });

    console.log("\n7. Gracefully shutting down admin network...");
    await admin.shutdown();
    console.log("Network shutdown completed.");
}

main().catch(console.error);
