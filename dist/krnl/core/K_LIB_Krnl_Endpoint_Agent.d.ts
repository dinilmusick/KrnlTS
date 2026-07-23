import { KrnlEndpointDefinition, KrnlAiExecutionTrace } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
export declare class KrnlEndpointAgent {
    readonly definition: KrnlEndpointDefinition;
    private aikoClient;
    private tracker;
    private system;
    private tools;
    constructor(definition: KrnlEndpointDefinition, aikoClient: KrnlAikoClient, tracker: KrnlWatchVariablesTracker, system: krnlSystemEntityBase, tools?: Record<string, any>);
    executeFromNaturalLanguage(naturalLanguageRequest: string): Promise<{
        result: any;
        trace: KrnlAiExecutionTrace;
    }>;
    private buildSystemPrompt;
    private parsePayload;
    private validatePayload;
    private repairLoop;
    private getPromptHash;
}
//# sourceMappingURL=K_LIB_Krnl_Endpoint_Agent.d.ts.map