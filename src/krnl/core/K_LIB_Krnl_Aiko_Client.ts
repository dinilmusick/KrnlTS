import { KrnlHTTP } from "../tools/index.js";

export class KrnlAikoClient {
  private baseUrl: string;

  constructor(aikoPort: number, aikoHost: string = 'localhost') {
    this.baseUrl = `http://${aikoHost}:${aikoPort}`;
  }

  static discover(system: any): KrnlAikoClient | null {
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
      } catch (e) {
        console.error("[KrnlAikoClient] Failed to parse discovered Aiko address:", addr, e);
      }
    }
    return null;
  }

  async infer(profileTag: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result: any = await client.post("/call/infer", {
      profileTag,
      systemPrompt,
      userPrompt
    });

    if (result && result.status === "success" && result.response) {
      return result.response;
    }
    throw new Error(result?.message || "Invalid or empty response from Aiko infer endpoint");
  }

  async fetchCatalog(): Promise<Record<string, any>> {
    const client = KrnlHTTP.createClient(this.baseUrl);
    const result: any = await client.post("/call/SessionManager/AgentProfileManager", {
      action: "list"
    });
    if (result && result.status === "success" && result.profiles) {
      return result.profiles;
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

  async isAlive(): Promise<boolean> {
    try {
      const client = KrnlHTTP.createClient(this.baseUrl);
      // Heartbeat checks
      const result = await client.post("/call/heartbeat", {});
      return result && result.status === "success";
    } catch (e) {
      return false;
    }
  }

  static getNotRunningMessage(): string {
    return "Aiko is not running. Please start it with: cd ~/Projects/Javascript/Aiko && node src/Aiko.js";
  }
}
