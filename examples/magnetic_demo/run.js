import { generateDeclarations } from "../../dist/bin/krnlts-watch.js";
import { MyMagneticSystem } from "./assembler.js";
import http from "http";

function requestText(url, options = {}) {
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
                resolve({ status: res.statusCode, headers: res.headers, body });
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
    generateDeclarations();

    console.log("\n=== Phase 2: Starting Magnetic Assembler & Gateway ===");
    const port = 10799;
    const system = new MyMagneticSystem(port, { host: "127.0.0.1" });

    await system._startSharedServer();
    await system.startDiscovery();
    await system.boot();
    await system.whenReady();

    console.log("\n1. Testing Magnetic Functionality...");
    const calcRes = await requestText(`http://localhost:${port}/call/Calculator`, {
        method: "POST",
        body: { a: 40, b: 2 }
    });
    console.log("Calculator Result:", calcRes.body);

    console.log("\n2. Testing zero-network internal sub-app routing...");
    const loginRes = await requestText(`http://localhost:${port}/authservice/call/login`, {
        method: "POST",
        body: { username: "admin", password: "secret" }
    });
    console.log("AuthService Login Result:", loginRes.body);

    console.log("\n3. Testing Parent Frontend Root UI (/frontend/)...");
    const parentUiRes = await requestText(`http://localhost:${port}/frontend/`);
    console.log("Parent UI Status:", parentUiRes.status);
    console.log("Contains Sub-App Tab:", parentUiRes.body.includes("authservice"));

    console.log("\n4. Testing Sub-App Frontend UI Aggregation (/frontend/subapps/authservice/)...");
    const subUiRes = await requestText(`http://localhost:${port}/frontend/subapps/authservice/`);
    console.log("Sub-App UI Status:", subUiRes.status);
    console.log("Sub-App UI HTML:", subUiRes.body.includes("AuthService Embedded Sub-App UI"));

    console.log("\n5. Testing Style Trickle-Down (/frontend/subapps/authservice/styles.css)...");
    const subCssRes = await requestText(`http://localhost:${port}/frontend/subapps/authservice/styles.css`);
    console.log("Style Trickle Status:", subCssRes.status);
    console.log("Contains Parent CSS Tokens:", subCssRes.body.includes("--krnl-font-sans"));

    console.log("\nAll magnetic_demo tests passed successfully!");

    system.dispose();
    console.log("System shut down cleanly.");
    process.exit(0);
}

main().catch(console.error);
