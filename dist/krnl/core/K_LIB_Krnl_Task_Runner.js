export class KrnlTaskList {
    tasks = [];
    cursor = 0;
    constructor(tasks = [], cursor = 0) {
        this.tasks = tasks;
        this.cursor = cursor;
    }
    static create(items, parentTaskId, nestingDepth = 0) {
        const tasks = items.map((item, idx) => ({
            id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
            endpointId: item.endpointId,
            prompt: item.prompt,
            status: 'pending',
            parentTaskId,
            nestingDepth
        }));
        return new KrnlTaskList(tasks);
    }
    getCurrentTask() {
        if (this.cursor >= this.tasks.length)
            return null;
        return this.tasks[this.cursor];
    }
    markDone(taskId, result) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'done';
            task.result = result;
            if (this.getCurrentTask()?.id === taskId) {
                this.cursor++;
            }
            return true;
        }
        return false;
    }
    markSkipped(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'skipped';
            if (this.getCurrentTask()?.id === taskId) {
                this.cursor++;
            }
            return true;
        }
        return false;
    }
    nest(nestedItems, parentTaskId) {
        const parentTask = this.tasks.find(t => t.id === parentTaskId);
        const depth = parentTask ? parentTask.nestingDepth + 1 : 1;
        const nestedList = KrnlTaskList.create(nestedItems, parentTaskId, depth);
        // Insert nested tasks right after the parent task
        const parentIdx = this.tasks.findIndex(t => t.id === parentTaskId);
        if (parentIdx !== -1) {
            this.tasks.splice(parentIdx + 1, 0, ...nestedList.tasks);
        }
        else {
            this.tasks.push(...nestedList.tasks);
        }
        return this;
    }
    async persist(store) {
        if (typeof store.saveTaskList === 'function') {
            await store.saveTaskList({
                tasks: this.tasks,
                cursor: this.cursor
            });
        }
    }
    static async load(store) {
        if (typeof store.loadTaskList === 'function') {
            const data = await store.loadTaskList();
            if (data) {
                return new KrnlTaskList(data.tasks, data.cursor);
            }
        }
        return null;
    }
}
export class KrnlTaskRunner {
    system;
    currentList = null;
    isExecuting = false;
    constructor(system) {
        this.system = system;
    }
    setTaskList(list) {
        this.currentList = list;
    }
    getTaskList() {
        return this.currentList;
    }
    async run(list) {
        this.currentList = list;
        await this.executeNext();
    }
    async onSuccess(taskId, result) {
        if (!this.currentList)
            return;
        this.currentList.markDone(taskId, result);
        if (this.system._aiProfilesStore) {
            await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
            this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
    }
    async receiveSkip(taskId) {
        if (!this.currentList)
            return;
        this.currentList.markSkipped(taskId);
        if (this.system._aiProfilesStore) {
            await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
            this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
    }
    async receiveNest(nestedItems, parentTaskId) {
        if (!this.currentList)
            return;
        this.currentList.nest(nestedItems, parentTaskId);
        if (this.system._aiProfilesStore) {
            await this.currentList.persist(this.system._aiProfilesStore);
        }
        setTimeout(() => {
            this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
        }, 0);
    }
    getStatus() {
        if (!this.currentList)
            return { status: 'idle', currentTask: null, tasks: [] };
        const current = this.currentList.getCurrentTask();
        return {
            status: current ? 'running' : 'complete',
            currentTask: current,
            tasks: this.currentList.tasks,
            cursor: this.currentList.cursor
        };
    }
    async executeNext() {
        if (!this.currentList)
            return;
        const task = this.currentList.getCurrentTask();
        if (!task) {
            console.log("[TaskRunner] All tasks completed successfully.");
            return;
        }
        task.status = 'running';
        if (this.system._aiProfilesStore) {
            await this.currentList.persist(this.system._aiProfilesStore);
        }
        console.log(`[TaskRunner] Event trigger: Executing task ${task.id} (${task.endpointId}) with prompt: "${task.prompt}"`);
        // Call orchestrator handle to execute the endpoint.
        // Signals and failures are routed/returned back to the orchestrator.
        try {
            const orchestrator = this.system._aiOrchestrator;
            if (!orchestrator) {
                throw new Error("Orchestrator not initialized");
            }
            const agent = orchestrator.endpointAgents.get(task.endpointId);
            if (!agent) {
                throw new Error(`Endpoint agent ${task.endpointId} not registered`);
            }
            // Execute endpoint agent
            const scheduler = this.system._aiScheduler || orchestrator.scheduler;
            if (!scheduler) {
                throw new Error("Scheduler not found on system or orchestrator");
            }
            const { result, trace } = await scheduler.dispatch(task.endpointId, async () => {
                return await agent.executeFromNaturalLanguage(task.prompt);
            });
            // Update telemetry
            if (this.system.telemetry && typeof this.system.telemetry.recordAiTrace === 'function') {
                this.system.telemetry.recordAiTrace(trace);
            }
            // Intercept Signals from result
            if (result && typeof result === 'object' && result._krnlSignal === 'QUERY_ORCHESTRATOR') {
                console.log(`[TaskRunner] Detected signal QUERY_ORCHESTRATOR: ${result.query}`);
                // Route query directly to orchestrator to plan nested tasks
                await orchestrator.handleQuery(result.query, { taskId: task.id, endpointId: task.endpointId });
                return;
            }
            // Success! Trigger onSuccess event
            await this.onSuccess(task.id, result);
        }
        catch (error) {
            console.error(`[TaskRunner] Task ${task.id} failed:`, error.message || error);
            // Route failure directly to orchestrator to escalate/handle failure (never handle it inside runner)
            const orchestrator = this.system._aiOrchestrator;
            if (orchestrator) {
                await orchestrator.escalateTaskFailure(task.id, error.message || String(error));
            }
        }
    }
}
// taskListTool for the Planner Agent
export function createTaskListTool(runner) {
    return {
        id: "taskListTool",
        description: "create_list(tasks) → ok | read_list() → list. use-when: plan/mutate task sequence.",
        schema: {
            input: {
                action: "str: 'create' | 'append' | 'read'",
                tasks: "array?: [{ endpointId: string, prompt: string }] (required for 'create'/'append')"
            },
            output: "obj"
        },
        examples: [
            { input: { action: "create", tasks: [{ endpointId: "StoreKey", prompt: "store api key" }] }, output: { status: "ok", count: 1 } },
            { input: { action: "read" }, output: { tasks: [] } }
        ],
        execute: async (payload) => {
            if (payload.action === 'create' && payload.tasks) {
                const list = KrnlTaskList.create(payload.tasks);
                runner.setTaskList(list);
                return { status: "ok", count: payload.tasks.length };
            }
            else if (payload.action === 'append' && payload.tasks) {
                const list = runner.getTaskList() || new KrnlTaskList();
                const newList = KrnlTaskList.create(payload.tasks);
                list.tasks.push(...newList.tasks);
                runner.setTaskList(list);
                return { status: "ok", count: list.tasks.length };
            }
            else if (payload.action === 'read') {
                const list = runner.getTaskList();
                return { tasks: list ? list.tasks : [] };
            }
            throw new Error(`Invalid action: ${payload.action}`);
        }
    };
}
//# sourceMappingURL=K_LIB_Krnl_Task_Runner.js.map