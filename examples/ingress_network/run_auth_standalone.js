import { AuthService } from "./services/AuthService/AuthService.js";
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
    console.log("=== Proving AuthService Standalone Compatibility ===");
    const port = 10095;
    const auth = new AuthService(port, { host: "127.0.0.1" });

    console.log("AuthService instantiated standalone. Starting discovery/shared server...");
    await auth.startDiscovery();
    await auth.whenReady();

    console.log(`AuthService standalone active on port ${auth.port}. Querying manifest...`);
    const manifest = await requestJson(`http://localhost:${port}/manifest`);
    console.log("Standalone Manifest:", JSON.stringify(manifest.data, null, 2));

    console.log("\nCalling login endpoint on standalone service...");
    const login = await requestJson(`http://localhost:${port}/call/login`, {
        method: "POST",
        body: { username: "admin", password: "secret" }
    });
    console.log("Standalone Login response:", JSON.stringify(login.data, null, 2));

    console.log("\nShutting down standalone AuthService...");
    await auth.shutdown();
    console.log("Standalone AuthService shutdown complete.");
}

main().catch(console.error);
