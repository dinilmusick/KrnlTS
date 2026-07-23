import { KrnlIntelligenceSpec, KrnlAiExecutionTrace } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
import { KrnlEndpointScheduler } from "./K_LIB_Krnl_Endpoint_Scheduler.js";
import { KrnlEndpointAgent } from "./K_LIB_Krnl_Endpoint_Agent.js";
import { krnlSystemEntityBase } from "./K_ENT_Krnl_System_Entity_Base.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";
import { KrnlTaskRunner } from "./K_LIB_Krnl_Task_Runner.js";
import { KrnlPlannerAgent } from "./K_LIB_Krnl_Planner_Agent.js";
export declare class KrnlApplicationOrchestrator {
    private system;
    private aikoClient;
    tracker: KrnlWatchVariablesTracker;
    scheduler: KrnlEndpointScheduler;
    private routingSpec;
    private escalationSpec;
    endpointAgents: Map<string, KrnlEndpointAgent>;
    private store;
    taskRunner: KrnlTaskRunner;
    plannerAgent: KrnlPlannerAgent;
    constructor(system: krnlSystemEntityBase, aikoClient: KrnlAikoClient, tracker: KrnlWatchVariablesTracker, scheduler: KrnlEndpointScheduler, routingSpec: KrnlIntelligenceSpec, escalationSpec: KrnlIntelligenceSpec, store: KrnlRuntimeStore);
    registerAgent(endpointId: string, agent: KrnlEndpointAgent): void;
    getAgentSummaries(): any[];
    handle(naturalLanguageRequest: string): Promise<{
        status: string;
        result: any;
        endpointId: string;
        trace: KrnlAiExecutionTrace;
    }>;
    private selectEndpoint;
    private buildRoutingPrompt;
    private escalate;
    orchestrate(naturalLanguageRequest: string): Promise<void>;
    handleQuery(query: string, context: {
        taskId: string;
        endpointId: string;
    }): Promise<void>;
    _inferTagsFromError(reason: string): string[];
    _compressToLearningField(text: string): string;
    escalateTaskFailure(taskId: string, errorReason: string): Promise<void>;
    private escalateToHuman;
    handleHumanResolution(taskId: string, resolution: {
        action: 'skip' | 'retry' | 'nest';
        tasks?: Array<{
            endpointId: string;
            prompt: string;
        }>;
    }): Promise<void>;
}
//# sourceMappingURL=K_LIB_Krnl_Application_Orchestrator.d.ts.map