import fs from "fs";
import path from "path";
export class KrnlRuntimeStore {
    filePath;
    data = {
        endpointDefinitions: {},
        endpointMemories: {},
        orchestratorMemory: { memory: "", lastUpdated: 0 },
        telemetryLog: [],
        learnings: [],
        activeTasks: null
    };
    constructor(appRoot) {
        this.filePath = path.join(appRoot, "krnl_runtime_state.db");
    }
    async load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, "utf-8");
                this.data = JSON.parse(raw);
                if (!this.data.endpointDefinitions)
                    this.data.endpointDefinitions = {};
                if (!this.data.endpointMemories)
                    this.data.endpointMemories = {};
                if (!this.data.orchestratorMemory)
                    this.data.orchestratorMemory = { memory: "", lastUpdated: 0 };
                if (!this.data.telemetryLog)
                    this.data.telemetryLog = [];
                if (!this.data.learnings)
                    this.data.learnings = [];
                if (this.data.activeTasks === undefined)
                    this.data.activeTasks = null;
            }
            else {
                await this.save();
            }
        }
        catch (e) {
            console.error("[KrnlRuntimeStore] Failed to load store, initializing empty:", e);
            this.data = {
                endpointDefinitions: {},
                endpointMemories: {},
                orchestratorMemory: { memory: "", lastUpdated: 0 },
                telemetryLog: [],
                learnings: [],
                activeTasks: null
            };
        }
    }
    async getEndpointDefinition(endpointId) {
        return this.data.endpointDefinitions[endpointId] || null;
    }
    async setEndpointDefinition(endpointId, config) {
        this.data.endpointDefinitions[endpointId] = config;
        await this.save();
    }
    async getAllEndpointDefinitions() {
        return this.data.endpointDefinitions;
    }
    async getEndpointMemory(endpointId) {
        return this.data.endpointMemories[endpointId] || "";
    }
    async appendEndpointMemory(endpointId, learning) {
        const existing = this.data.endpointMemories[endpointId] || "";
        const prefix = existing ? existing + "\n" : "";
        this.data.endpointMemories[endpointId] = prefix + `[${new Date().toISOString()}] ${learning}`;
        await this.save();
    }
    async getOrchestratorMemory() {
        return this.data.orchestratorMemory;
    }
    async setOrchestratorMemory(memory) {
        this.data.orchestratorMemory = {
            memory,
            lastUpdated: Date.now()
        };
        await this.save();
    }
    async appendTelemetry(record) {
        this.data.telemetryLog.push(record);
        if (this.data.telemetryLog.length > 1000) {
            this.data.telemetryLog.shift();
        }
        await this.save();
    }
    async getTelemetryLog(limit) {
        if (limit && limit > 0) {
            return this.data.telemetryLog.slice(-limit);
        }
        return this.data.telemetryLog;
    }
    async appendLearning(learning) {
        if (!this.data.learnings)
            this.data.learnings = [];
        this.data.learnings.push(learning);
        // Backward compatibility memory append:
        await this.appendEndpointMemory(learning.concernedEndpoint, `Problem: ${learning.problemDescription} | Solution: ${learning.solution}`);
        await this.save();
    }
    async searchLearnings(endpointId, tags) {
        const pool = (this.data.learnings || []).filter(l => l.concernedEndpoint === endpointId);
        if (tags.length === 0)
            return pool;
        const matched = pool.filter(l => {
            const intersect = l.tags.filter(t => tags.includes(t));
            return intersect.length > 0;
        }).sort((a, b) => {
            const intersectA = a.tags.filter(t => tags.includes(t)).length;
            const intersectB = b.tags.filter(t => tags.includes(t)).length;
            return intersectB - intersectA;
        });
        return matched.length > 0 ? matched : pool;
    }
    async saveTaskList(listData) {
        this.data.activeTasks = listData;
        await this.save();
    }
    async loadTaskList() {
        return this.data.activeTasks || null;
    }
    async save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
        }
        catch (e) {
            console.error("[KrnlRuntimeStore] Failed to save store:", e);
        }
    }
}
//# sourceMappingURL=K_LIB_Krnl_Runtime_Store.js.map