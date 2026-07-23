import { KrnlHTTP } from "../tools/index.js";
export class KrnlAikoClient {
    baseUrl;
    lastUsedModelId = null;
    constructor(aikoPort, aikoHost = 'localhost') {
        this.baseUrl = `http://${aikoHost}:${aikoPort}`;
    }
    static discover(system) {
        // Passively scan system peers registry to locate Aiko peer
        const aikoPeer = system.peers?.get("Aiko");
        if (aikoPeer && aikoPeer.address) {
            // aikoPeer.address is typically like "http://127.0.0.1:10095" or "127.0.0.1:10095"
            let addr = aikoPeer.address;
            if (!addr.startsWith("http")) {
                addr = `http://${addr}`;
            }
            try {
                const url = new URL(addr);
                return new KrnlAikoClient(Number(url.port || 10095), url.hostname);
            }
            catch (e) {
                console.error("[KrnlAikoClient] Failed to parse discovered Aiko address:", addr, e);
            }
        }
        return null;
    }
    async infer(intelligenceSpec, systemPrompt, userPrompt) {
        const client = KrnlHTTP.createClient(this.baseUrl);
        const result = await client.post("/call/infer", {
            intelligenceSpec,
            systemPrompt,
            userPrompt
        });
        if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.payload && result.data.payload.status === "success" && result.data.payload.response) {
            this.lastUsedModelId = result.data.payload.modelId || null;
            return result.data.payload.response;
        }
        const errMsg = result.status === "success" ? (result.data?.payload?.message || result.data?.message) : result.message;
        throw new Error(errMsg || "Invalid or empty response from Aiko infer endpoint");
    }
    async downrankModel(modelId) {
        try {
            const client = KrnlHTTP.createClient(this.baseUrl);
            await client.post("/call/downrankModel", { modelId });
        }
        catch (e) {
            console.error("[KrnlAikoClient] Failed to send downrank request to Aiko:", e.message);
        }
    }
    async fetchCatalog() {
        const client = KrnlHTTP.createClient(this.baseUrl);
        const result = await client.post("/call/SessionManager/AgentProfileManager", {
            action: "list"
        });
        if (result && result.status === "success" && result.data && result.data.status === "success" && result.data.profiles) {
            return result.data.profiles;
        }
        // Fallback to basic manifest check or mock defaults if profiles state is empty
        return {
            "endpoint-grade-1": { description: "Nano — simple CRUD" },
            "endpoint-grade-2": { description: "Mini — standard ops" },
            "endpoint-grade-3": { description: "Standard — moderate logic" },
            "endpoint-grade-4": { description: "Large — complex reasoning" },
            "endpoint-grade-5": { description: "Expert — escalation handler" },
            "orchestrator-standard": { description: "Standard routing" },
            "orchestrator-pro": { description: "Complex routing + escalation" }
        };
    }
    async isAlive() {
        try {
            const client = KrnlHTTP.createClient(this.baseUrl);
            // Heartbeat checks
            const result = await client.post("/call/heartbeat", {});
            return result && result.status === "success";
        }
        catch (e) {
            return false;
        }
    }
    static getNotRunningMessage() {
        return "Aiko is not running. Please start it with: cd ~/Projects/Javascript/Aiko && node src/Aiko.js";
    }
}
//# sourceMappingURL=K_LIB_Krnl_Aiko_Client.js.map