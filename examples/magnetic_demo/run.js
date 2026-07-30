import { generateDeclarations } from "../../dist/bin/krnlts-watch.js";
import { MyMagneticSystem } from "./assembler.js";
import http from "http";

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
    console.log("=== Phase 1: Generating Local Type Declarations ===");
    // Generate type declarations for autocomplete
    generateDeclarations();

    console.log("\n=== Phase 2: Starting Magnetic Assembler & Gateway ===");
    const port = 10099;
    const system = new MyMagneticSystem(port, { host: "127.0.0.1" });

    await system.startDiscovery();
    await system.whenReady();

    console.log("\n1. Testing Magnetic Functionality with global helper/event dependencies (without imports)...");
    const calcRes = await requestJson(`http://localhost:${port}/call/Calculator`, {
        method: "POST",
        body: { a: 40, b: 2 }
    });
    console.log("HTTP POST /call/Calculator Result:", JSON.stringify(calcRes.data, null, 2));

    console.log("\n2. Testing zero-network internal sub-app routing for KrnlTS sub-app...");
    const loginRes = await requestJson(`http://localhost:${port}/authservice/call/login`, {
        method: "POST",
        body: { username: "admin", password: "secret" }
    });
    console.log("HTTP POST /authservice/call/login Result:", JSON.stringify(loginRes.data, null, 2));

    console.log("\n3. Testing non-KrnlTS sub-app proxying...");
    const nonKrnlRes = await requestJson(`http://localhost:${port}/nonkrnlapp/`);
    console.log("HTTP GET /nonkrnlapp/ Result:", JSON.stringify(nonKrnlRes.data, null, 2));

    console.log("\n4. Shutting down system...");
    await system.shutdown();
    console.log("System shut down cleanly.");
}

main().catch(console.error);
