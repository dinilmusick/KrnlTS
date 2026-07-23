import { KrnlWatchVariablesTracker } from "./K_LIB_Krnl_Watch_Variables_Tracker.js";
export declare class KrnlEndpointScheduler {
    private tracker;
    private executing;
    private queue;
    constructor(tracker: KrnlWatchVariablesTracker);
    dispatch(endpointId: string, task: () => Promise<any>): Promise<any>;
    private hasConflict;
    private release;
    private drainQueue;
}
//# sourceMappingURL=K_LIB_Krnl_Endpoint_Scheduler.d.ts.map