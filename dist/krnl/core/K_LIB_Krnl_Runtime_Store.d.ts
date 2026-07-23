import { KrnlEndpointDefinition, KrnlOrchestratorMemory, KrnlLearning } from "./K_LIB_Krnl_Ai_Concepts.js";
export declare class KrnlRuntimeStore {
    private filePath;
    private data;
    constructor(appRoot: string);
    load(): Promise<void>;
    getEndpointDefinition(endpointId: string): Promise<Partial<KrnlEndpointDefinition> | null>;
    setEndpointDefinition(endpointId: string, config: Partial<KrnlEndpointDefinition>): Promise<void>;
    getAllEndpointDefinitions(): Promise<Record<string, Partial<KrnlEndpointDefinition>>>;
    getEndpointMemory(endpointId: string): Promise<string>;
    appendEndpointMemory(endpointId: string, learning: string): Promise<void>;
    getOrchestratorMemory(): Promise<KrnlOrchestratorMemory>;
    setOrchestratorMemory(memory: string): Promise<void>;
    appendTelemetry(record: any): Promise<void>;
    getTelemetryLog(limit?: number): Promise<any[]>;
    appendLearning(learning: KrnlLearning): Promise<void>;
    searchLearnings(endpointId: string, tags: string[]): Promise<KrnlLearning[]>;
    saveTaskList(listData: {
        tasks: any[];
        cursor: number;
    }): Promise<void>;
    loadTaskList(): Promise<{
        tasks: any[];
        cursor: number;
    } | null>;
    private save;
}
//# sourceMappingURL=K_LIB_Krnl_Runtime_Store.d.ts.map