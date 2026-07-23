import { Logger } from "./K_LIB_Krnl_Base_Concepts.js";
export class KrnlRegistryClient {
    registryPort;
    constructor(registryPort = 10099) {
        this.registryPort = registryPort;
    }
    getUrl(action) {
        return `http://127.0.0.1:${this.registryPort}/call/${action}`;
    }
    async isRegistryAlive() {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 800);
            const res = await fetch(this.getUrl("heartbeat"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                signal: controller.signal,
            });
            clearTimeout(id);
            return res.ok;
        }
        catch (_) {
            return false;
        }
    }
    async register(name, port, pid) {
        try {
            const res = await fetch(this.getUrl("registerApp"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, port, pid }),
            });
            if (res.ok) {
                const body = await res.json();
                return body?.status === "success" || body?.success === true;
            }
            return false;
        }
        catch (err) {
            Logger.error(`[KrnlRegistryClient] Register error:`, err.message);
            return false;
        }
    }
    async deregister(name) {
        try {
            const res = await fetch(this.getUrl("deregisterApp"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const body = await res.json();
                return body?.status === "success" || body?.success === true;
            }
            return false;
        }
        catch (err) {
            Logger.error(`[KrnlRegistryClient] Deregister error:`, err.message);
            return false;
        }
    }
    async heartbeat(name) {
        try {
            const res = await fetch(this.getUrl("heartbeatApp"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const body = await res.json();
                return body?.status === "success" || body?.success === true;
            }
            return false;
        }
        catch (err) {
            Logger.error(`[KrnlRegistryClient] Heartbeat error:`, err.message);
            return false;
        }
    }
    async lookup(name) {
        try {
            const res = await fetch(this.getUrl("lookupApp"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const body = await res.json();
                const payload = body?.payload || body?.data || body;
                if (payload && payload.port) {
                    return payload;
                }
            }
            return null;
        }
        catch (_) {
            return null;
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_Registry_Client.js.map