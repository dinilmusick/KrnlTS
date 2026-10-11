import { KrnlTask, KrnlTaskStatus } from "./K_LIB_Krnl_Ai_Concepts.js";
import { KrnlRuntimeStore } from "./K_LIB_Krnl_Runtime_Store.js";

export class KrnlTaskList {
  tasks: KrnlTask[] = [];
  cursor = 0;

  constructor(tasks: KrnlTask[] = [], cursor = 0) {
    this.tasks = tasks;
    this.cursor = cursor;
  }

  static create(items: Array<{ endpointId: string; prompt: string }>, parentTaskId?: string, nestingDepth = 0): KrnlTaskList {
    const tasks = items.map((item, idx) => ({
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${idx}`,
      endpointId: item.endpointId,
      prompt: item.prompt,
      status: 'pending' as KrnlTaskStatus,
      parentTaskId,
      nestingDepth
    }));
    return new KrnlTaskList(tasks);
  }

  getCurrentTask(): KrnlTask | null {
    if (this.cursor >= this.tasks.length) return null;
    return this.tasks[this.cursor];
  }

  markDone(taskId: string, result: any): boolean {
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

  markSkipped(taskId: string): boolean {
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

  nest(nestedItems: Array<{ endpointId: string; prompt: string }>, parentTaskId: string): KrnlTaskList {
    const parentTask = this.tasks.find(t => t.id === parentTaskId);
    const depth = parentTask ? parentTask.nestingDepth + 1 : 1;
    const nestedList = KrnlTaskList.create(nestedItems, parentTaskId, depth);
    
    // Insert nested tasks right after the parent task
    const parentIdx = this.tasks.findIndex(t => t.id === parentTaskId);
    if (parentIdx !== -1) {
      this.tasks.splice(parentIdx + 1, 0, ...nestedList.tasks);
    } else {
      this.tasks.push(...nestedList.tasks);
    }
    return this;
  }

  async persist(store: KrnlRuntimeStore): Promise<void> {
    if (typeof (store as any).saveTaskList === 'function') {
      await (store as any).saveTaskList({
        tasks: this.tasks,
        cursor: this.cursor
      });
    }
  }

  static async load(store: KrnlRuntimeStore): Promise<KrnlTaskList | null> {
    if (typeof (store as any).loadTaskList === 'function') {
      const data = await (store as any).loadTaskList();
      if (data) {
        return new KrnlTaskList(data.tasks, data.cursor);
      }
    }
    return null;
  }
}

export class KrnlTaskRunner {
  private system: any;
  private currentList: KrnlTaskList | null = null;
  private isExecuting = false;

  constructor(system: any) {
    this.system = system;
  }

  setTaskList(list: KrnlTaskList) {
    this.currentList = list;
  }

  getTaskList(): KrnlTaskList | null {
    return this.currentList;
  }

  async run(list: KrnlTaskList): Promise<void> {
    this.currentList = list;
    await this.executeNext();
  }

  async onSuccess(taskId: string, result: any): Promise<void> {
    if (!this.currentList) return;
    this.currentList.markDone(taskId, result);
    if (this.system._aiProfilesStore) {
      await this.currentList.persist(this.system._aiProfilesStore);
    }
    setTimeout(() => {
      this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
    }, 0);
  }

  async receiveSkip(taskId: string): Promise<void> {
    if (!this.currentList) return;
    this.currentList.markSkipped(taskId);
    if (this.system._aiProfilesStore) {
      await this.currentList.persist(this.system._aiProfilesStore);
    }
    setTimeout(() => {
      this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
    }, 0);
  }

  async receiveNest(nestedItems: Array<{ endpointId: string; prompt: string }>, parentTaskId: string): Promise<void> {
    if (!this.currentList) return;
    this.currentList.nest(nestedItems, parentTaskId);
    if (this.system._aiProfilesStore) {
      await this.currentList.persist(this.system._aiProfilesStore);
    }
    setTimeout(() => {
      this.executeNext().catch(err => console.error("[TaskRunner] executeNext error:", err));
    }, 0);
  }

  getStatus(): any {
    if (!this.currentList) return { status: 'idle', currentTask: null, tasks: [] };
    const current = this.currentList.getCurrentTask();
    return {
      status: current ? 'running' : 'complete',
      currentTask: current,
      tasks: this.currentList.tasks,
      cursor: this.currentList.cursor
    };
  }

  private async executeNext(): Promise<void> {
    if (!this.currentList) return;
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

    } catch (error: any) {
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
export function createTaskListTool(runner: KrnlTaskRunner) {
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
    execute: async (payload: { action: string; tasks?: Array<{ endpointId: string; prompt: string }> }) => {
      if (payload.action === 'create' && payload.tasks) {
        const list = KrnlTaskList.create(payload.tasks);
        runner.setTaskList(list);
        return { status: "ok", count: payload.tasks.length };
      } else if (payload.action === 'append' && payload.tasks) {
        const list = runner.getTaskList() || new KrnlTaskList();
        const newList = KrnlTaskList.create(payload.tasks);
        list.tasks.push(...newList.tasks);
        runner.setTaskList(list);
        return { status: "ok", count: list.tasks.length };
      } else if (payload.action === 'read') {
        const list = runner.getTaskList();
        return { tasks: list ? list.tasks : [] };
      }
      throw new Error(`Invalid action: ${payload.action}`);
    }
  };
}
