import fs from "fs";
import path from "path";
import { KrnlEndpointDefinition, KrnlOrchestratorMemory } from "./K_LIB_Krnl_Ai_Concepts.js";

export class KrnlRuntimeStore {
  private filePath: string;
  private data: {
    endpointDefinitions: Record<string, Partial<KrnlEndpointDefinition>>;
    endpointMemories: Record<string, string>;
    orchestratorMemory: KrnlOrchestratorMemory;
    telemetryLog: any[];
  } = {
    endpointDefinitions: {},
    endpointMemories: {},
    orchestratorMemory: { memory: "", lastUpdated: 0 },
    telemetryLog: []
  };

  constructor(appRoot: string) {
    this.filePath = path.join(appRoot, "krnl_runtime_state.db");
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.endpointDefinitions) this.data.endpointDefinitions = {};
        if (!this.data.endpointMemories) this.data.endpointMemories = {};
        if (!this.data.orchestratorMemory) this.data.orchestratorMemory = { memory: "", lastUpdated: 0 };
        if (!this.data.telemetryLog) this.data.telemetryLog = [];
      } else {
        await this.save();
      }
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to load store, initializing empty:", e);
      this.data = {
        endpointDefinitions: {},
        endpointMemories: {},
        orchestratorMemory: { memory: "", lastUpdated: 0 },
        telemetryLog: []
      };
    }
  }

  async getEndpointDefinition(endpointId: string): Promise<Partial<KrnlEndpointDefinition> | null> {
    return this.data.endpointDefinitions[endpointId] || null;
  }

  async setEndpointDefinition(endpointId: string, config: Partial<KrnlEndpointDefinition>): Promise<void> {
    this.data.endpointDefinitions[endpointId] = config;
    await this.save();
  }

  async getAllEndpointDefinitions(): Promise<Record<string, Partial<KrnlEndpointDefinition>>> {
    return this.data.endpointDefinitions;
  }

  async getEndpointMemory(endpointId: string): Promise<string> {
    return this.data.endpointMemories[endpointId] || "";
  }

  async appendEndpointMemory(endpointId: string, learning: string): Promise<void> {
    const existing = this.data.endpointMemories[endpointId] || "";
    const prefix = existing ? existing + "\n" : "";
    this.data.endpointMemories[endpointId] = prefix + `[${new Date().toISOString()}] ${learning}`;
    await this.save();
  }

  async getOrchestratorMemory(): Promise<KrnlOrchestratorMemory> {
    return this.data.orchestratorMemory;
  }

  async setOrchestratorMemory(memory: string): Promise<void> {
    this.data.orchestratorMemory = {
      memory,
      lastUpdated: Date.now()
    };
    await this.save();
  }

  async appendTelemetry(record: any): Promise<void> {
    this.data.telemetryLog.push(record);
    if (this.data.telemetryLog.length > 1000) {
      this.data.telemetryLog.shift();
    }
    await this.save();
  }

  async getTelemetryLog(limit?: number): Promise<any[]> {
    if (limit && limit > 0) {
      return this.data.telemetryLog.slice(-limit);
    }
    return this.data.telemetryLog;
  }

  private async save(): Promise<void> {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("[KrnlRuntimeStore] Failed to save store:", e);
    }
  }
}
