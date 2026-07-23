import { KrnlAikoClient } from "./K_LIB_Krnl_Aiko_Client.js";
import { KrnlTaskRunner, KrnlTaskList } from "./K_LIB_Krnl_Task_Runner.js";
export declare class KrnlPlannerAgent {
    private aikoClient;
    private system;
    private runner;
    private tool;
    constructor(aikoClient: KrnlAikoClient, system: any, runner: KrnlTaskRunner);
    plan(naturalLanguageRequest: string, contextData?: string): Promise<KrnlTaskList>;
}
//# sourceMappingURL=K_LIB_Krnl_Planner_Agent.d.ts.map