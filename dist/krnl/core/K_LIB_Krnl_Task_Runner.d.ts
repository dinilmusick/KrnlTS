import { KrnlTask } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";
export declare class KrnlTaskList {
    tasks: KrnlTask[];
    cursor: number;
    constructor(tasks?: KrnlTask[], cursor?: number);
    static create(items: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId?: string, nestingDepth?: number): KrnlTaskList;
    getCurrentTask(): KrnlTask | null;
    markDone(taskId: string, result: any): boolean;
    markSkipped(taskId: string): boolean;
    nest(nestedItems: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId: string): KrnlTaskList;
    persist(store: KrnlRuntimeStore): Promise<void>;
    static load(store: KrnlRuntimeStore): Promise<KrnlTaskList | null>;
}
export declare class KrnlTaskRunner {
    private system;
    private currentList;
    private isExecuting;
    constructor(system: any);
    setTaskList(list: KrnlTaskList): void;
    getTaskList(): KrnlTaskList | null;
    run(list: KrnlTaskList): Promise<void>;
    onSuccess(taskId: string, result: any): Promise<void>;
    receiveSkip(taskId: string): Promise<void>;
    receiveNest(nestedItems: Array<{
        endpointId: string;
        prompt: string;
    }>, parentTaskId: string): Promise<void>;
    getStatus(): any;
    private executeNext;
}
export declare function createTaskListTool(runner: KrnlTaskRunner): {
    id: string;
    description: string;
    schema: {
        input: {
            action: string;
            tasks: string;
        };
        output: string;
    };
    examples: ({
        input: {
            action: string;
            tasks: {
                endpointId: string;
                prompt: string;
            }[];
        };
        output: {
            status: string;
            count: number;
            tasks?: undefined;
        };
    } | {
        input: {
            action: string;
            tasks?: undefined;
        };
        output: {
            tasks: never[];
            status?: undefined;
            count?: undefined;
        };
    })[];
    execute: (payload: {
        action: string;
        tasks?: Array<{
            endpointId: string;
            prompt: string;
        }>;
    }) => Promise<{
        status: string;
        count: number;
        tasks?: undefined;
    } | {
        tasks: KrnlTask[];
        status?: undefined;
        count?: undefined;
    }>;
};
//# sourceMappingURL=K_LIB_Krnl_Task_Runner.d.ts.map