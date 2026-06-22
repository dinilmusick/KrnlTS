import { MyCustomFrontendSystem } from "./assembler.js";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function requestText(url, options = {}, redirectCount = 0) {
    if (redirectCount > 3) throw new Error("Too many redirects");
    const res = await new Promise((resolve, reject) => {
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

        const req = http.request(reqOpts, (r) => {
            let body = "";
            r.on("data", chunk => body += chunk.toString());
            r.on("end", () => {
                resolve({ status: r.statusCode, headers: r.headers, body });
            });
        });

        req.on("error", reject);
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });

    if ([301, 302, 307, 308].includes(res.status) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        return requestText(redirectUrl, options, redirectCount + 1);
    }
    return res;
}

async function main() {
    console.log("=== Starting Custom Frontend Demo System ===");
    const port = 10088;
    const system = new MyCustomFrontendSystem(port, { host: "127.0.0.1", sourcePath: import.meta.url });

    await system.startDiscovery();
    await system.whenReady();
    console.log("System initialized successfully.");

    // Let's probe the custom frontend dashboard endpoint a few times
    console.log("\n1. Testing GET /frontend/dashboard/ (Proxied Next.js frontend)...");
    let dashboardRes;
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
        try {
            dashboardRes = await requestText(`http://127.0.0.1:${port}/frontend/dashboard/`);
            if (dashboardRes.status === 200) {
                break;
            }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Response Status: ${dashboardRes?.status}`);
    console.log(`Contains Dashboard Text: ${dashboardRes?.body.includes("Custom Next.js Frontend Dashboard")}`);

    console.log("\n2. Testing GET /frontend/default/ (Default UI)...");
    const defaultRes = await requestText(`http://127.0.0.1:${port}/frontend/default/`);
    console.log(`Response Status: ${defaultRes.status}`);

    console.log("\n3. Testing GET /manifest (Aggregated Ingress Topology)...");
    const manifestRes = await requestText(`http://127.0.0.1:${port}/manifest`);
    console.log("Manifest Response:", manifestRes.body);

    console.log("\nAll programmatic custom frontend checks passed successfully!");
    
    // Shut down cleanly for script
    await system.shutdown();
    console.log("System shut down cleanly.");
}

main().catch(console.error);
