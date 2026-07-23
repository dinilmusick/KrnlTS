import { KrnlIntelligenceSpec } from "./K_LIB_Krnl_Ai_Concepts.js";
export declare class KrnlAikoClient {
    private baseUrl;
    lastUsedModelId: string | null;
    constructor(aikoPort: number, aikoHost?: string);
    static discover(system: any): KrnlAikoClient | null;
    infer(intelligenceSpec: KrnlIntelligenceSpec, systemPrompt: string, userPrompt: string): Promise<string>;
    downrankModel(modelId: string): Promise<void>;
    fetchCatalog(): Promise<Record<string, any>>;
    isAlive(): Promise<boolean>;
    static getNotRunningMessage(): string;
}
//# sourceMappingURL=K_LIB_Krnl_Aiko_Client.d.ts.map