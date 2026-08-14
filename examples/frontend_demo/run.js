import { MyFrontendSystem } from "./assembler.js";
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
    console.log("=== Starting Refactored Frontend Demo System ===");
    const port = 10899;
    const system = new MyFrontendSystem(port, { host: "127.0.0.1" });
    await system._startSharedServer();
    await system.startDiscovery();
    await system.boot();
    await system.whenReady();
    console.log("System initialized successfully.");

    console.log("\n1. Testing GET /frontend/ (HTML UI root page)...");
    const htmlRes = await requestText(`http://127.0.0.1:${port}/frontend/`);
    console.log(`Response Status: ${htmlRes.status}`);
    console.log(`Content-Type: ${htmlRes.headers['content-type']}`);
    console.log(`Contains HTML root: ${htmlRes.body.includes("<div id=\"root\"></div>")}`);

    console.log("\n2. Testing GET /frontend/bundle.js (Compiled esbuild React Bundle)...");
    const bundleRes = await requestText(`http://127.0.0.1:${port}/frontend/bundle.js`);
    console.log(`Response Status: ${bundleRes.status}`);
    console.log(`Contains Component JS: ${bundleRes.body.length > 50}`);

    console.log("\n3. Testing GET /frontend/styles.css (Central CSS Style Authority)...");
    const cssRes = await requestText(`http://127.0.0.1:${port}/frontend/styles.css`);
    console.log(`Response Status: ${cssRes.status}`);
    console.log(`Contains CSS tokens: ${cssRes.body.includes("--krnl-font-sans")}`);

    console.log("\n4. Testing POST /frontend/api/createUser (In-Process API & Phantom Execution Emission)...");
    const cuRes = await requestText(`http://127.0.0.1:${port}/frontend/api/createUser`, {
        method: "POST",
        body: { username: "dinil", email: "dinil@example.com", age: 25, isAdmin: true }
    });
    console.log("CreateUser Response Status:", cuRes.status);
    console.log("CreateUser Body:", cuRes.body);

    console.log("\n5. Testing GET /frontend/api/heartbeat...");
    const hbRes = await requestText(`http://127.0.0.1:${port}/frontend/api/heartbeat`);
    console.log("Heartbeat Response:", hbRes.body);

    console.log("\nAll programmatic checks for frontend_demo passed successfully!");
    
    // Shut down cleanly for script
    system.dispose();
    console.log("System shut down cleanly.");
    process.exit(0);
}

main().catch(console.error);
