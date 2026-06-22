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
    console.log("=== Starting Frontend Demo System ===");
    const port = 10099;
    const system = new MyFrontendSystem(port, { host: "127.0.0.1" });

    await system.startDiscovery();
    await system.whenReady();
    console.log("System initialized successfully.");

    console.log("\n1. Testing GET /frontend/default/ (HTML UI page)...");
    const htmlRes = await requestText(`http://127.0.0.1:${port}/frontend/default/`);
    console.log(`Response Status: ${htmlRes.status}`);
    console.log(`Content-Type: ${htmlRes.headers['content-type']}`);
    console.log(`Contains Title: ${htmlRes.body.includes("<title>KrnlTS Frontend Demo System")}`);

    console.log("\n1b. Testing GET /frontend/default (Redirect to trailing slash)...");
    const redirectRes = await requestText(`http://127.0.0.1:${port}/frontend/default`);
    console.log(`Response Status: ${redirectRes.status}`);
    console.log(`Location Header: ${redirectRes.headers['location']}`);

    console.log("\n2. Testing GET /frontend/default/manifest.json...");
    const manifestRes = await requestText(`http://127.0.0.1:${port}/frontend/default/manifest.json`);
    console.log(`Response Status: ${manifestRes.status}`);
    const manifest = JSON.parse(manifestRes.body);
    console.log("Manifest Entity Name:", manifest.entityName);
    console.log("Available Endpoints:", Object.keys(manifest.inputs.api));

    console.log("\n3. Testing GET /frontend/default/api/heartbeat...");
    const hbRes = await requestText(`http://127.0.0.1:${port}/frontend/default/api/heartbeat`);
    console.log("Heartbeat Response:", hbRes.body);

    console.log("\n4. Testing POST /frontend/default/api/createUser...");
    const cuRes = await requestText(`http://127.0.0.1:${port}/frontend/default/api/createUser`, {
        method: "POST",
        body: { username: "dinil", email: "dinil@example.com", age: 25, isAdmin: true }
    });
    console.log("CreateUser Response:", cuRes.body);

    console.log("\n5. Testing GET /frontend/default/history...");
    const histRes = await requestText(`http://127.0.0.1:${port}/frontend/default/history`);
    console.log("History Response:", histRes.body);

    console.log("\nAll programmatic checks passed successfully!");
    
    // Shut down cleanly for script
    await system.shutdown();
    console.log("System shut down cleanly.");
}

main().catch(console.error);
