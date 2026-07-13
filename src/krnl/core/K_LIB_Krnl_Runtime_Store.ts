import fs from "fs";
import path from "path";
import { KrnlAiEndpointConfig } from "./K_LIB_Krnl_Ai_Concepts.js";

export class KrnlRuntimeStore {
  private filePath: string;
  private data: { endpointAgentProfiles: Record<string, KrnlAiEndpointConfig> } = { endpointAgentProfiles: {} };

  constructor(appRoot: string) {
    this.filePath = path.join(appRoot, "krnl_runtime_state.db");
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.endpointAgentProfiles) {
          this.data.endpointAgentProfiles = {};
        }
      } else {
        await this.save();
      }
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to load store, initializing empty:", e);
      this.data = { endpointAgentProfiles: {} };
    }
  }

  async getProfile(endpointId: string): Promise<KrnlAiEndpointConfig | null> {
    return this.data.endpointAgentProfiles[endpointId] || null;
  }

  async setProfile(endpointId: string, config: KrnlAiEndpointConfig): Promise<void> {
    this.data.endpointAgentProfiles[endpointId] = config;
    await this.save();
  }

  async getAllProfiles(): Promise<Record<string, KrnlAiEndpointConfig>> {
    return this.data.endpointAgentProfiles;
  }

  private async save(): Promise<void> {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to save store:", e);
    }
  }
}
