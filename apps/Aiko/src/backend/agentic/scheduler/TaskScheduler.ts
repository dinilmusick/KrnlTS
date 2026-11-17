/**
 * ASCII Architecture Flowchart: TaskScheduler
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize TaskScheduler     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             combined             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               val                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │                t                 │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ DEPENDENCY-AWARE TASK SCHEDULER ENGINE ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import {
  Task, TaskID, TaskState, SchedulerResult, SchedulerError,
  SchedulerTaskResult, SchedulerExecuteInput
} from './types.js';
import { DagValidator } from './dagValidator.js';
import { ContextResolver } from './contextResolver.js';

export class TaskScheduler {
  private taskMap = new Map<TaskID, Task>();
  private states = new Map<TaskID, TaskState>();
  private results = new Map<TaskID, SchedulerTaskResult>();
  private executionOrder: TaskID[] = [];

  public addTasks(newTasks: Task[]): { success: boolean; error?: SchedulerError } {
    const combined = [...Array.from(this.taskMap.values()), ...newTasks];
    const val = DagValidator.validate(combined);
    if (!val.valid) return { success: false, error: val.error };
    for (const t of newTasks) {
      this.taskMap.set(t.id, t);
      this.states.set(t.id, 'PENDING');
    }
    return { success: true };
  }

  public async execute(input: SchedulerExecuteInput): Promise<SchedulerResult> {
    const startTime = Date.now();
    const { tasks, executor, options } = input;
    const maxConcurrency = Math.max(1, options?.maxConcurrency || 100);

    this.taskMap.clear();
    this.states.clear();
    this.results.clear();
    this.executionOrder = [];

    const initVal = DagValidator.validate(tasks);
    if (!initVal.valid) {
      return { success: false, tasks: [], executionOrder: [], error: initVal.error, durationMs: Date.now() - startTime };
    }

    for (const t of tasks) {
      this.taskMap.set(t.id, t);
      this.states.set(t.id, 'PENDING');
    }

    while (this.hasUnfinishedTasks()) {
      this.updateBlockedStates();
      const readyTasks = this.getReadyTasks();

      if (readyTasks.length === 0) {
        if (this.hasUnfinishedTasks()) this.forceBlockRemaining();
        break;
      }

      const batch = readyTasks.slice(0, maxConcurrency);
      await Promise.all(
        batch.map(async task => {
          this.states.set(task.id, 'RUNNING');
          const taskStart = Date.now();
          const context = ContextResolver.resolve(task, this.results);

          try {
            const execRes = await executor.execute({ task, context });
            const dur = Date.now() - taskStart;

            if (execRes.success) {
              this.states.set(task.id, 'SUCCESS');
              this.results.set(task.id, {
                taskId: task.id, state: 'SUCCESS',
                result: execRes.result ?? execRes.rawResult?.response?.body ?? null,
                rawResult: execRes.rawResult, attempts: execRes.attempts || 1,
                durationMs: dur, featureName: task.featureName, instruction: task.instruction
              });
            } else {
              this.states.set(task.id, 'FAILED');
              this.results.set(task.id, {
                taskId: task.id, state: 'FAILED',
                error: execRes.error || { kind: 'EXECUTION_FAILED' as const, message: 'Task execution failed' },
                rawResult: execRes.rawResult, attempts: execRes.attempts || 1,
                durationMs: dur, featureName: task.featureName, instruction: task.instruction
              });
            }
          } catch (err: any) {
            const dur = Date.now() - taskStart;
            this.states.set(task.id, 'FAILED');
            this.results.set(task.id, {
              taskId: task.id, state: 'FAILED',
              error: { kind: 'EXECUTION_FAILED' as const, message: err.message || String(err) },
              durationMs: dur, featureName: task.featureName, instruction: task.instruction
            });
          }

          this.executionOrder.push(task.id);
        })
      );
    }

    const allTaskList: SchedulerTaskResult[] = Array.from(this.taskMap.values()).map(t => {
      return this.results.get(t.id) || {
        taskId: t.id, state: this.states.get(t.id) || 'BLOCKED', durationMs: 0,
        featureName: t.featureName, instruction: t.instruction,
        error: { kind: 'EXECUTION_FAILED' as const, message: 'Task was blocked or unresolved' }
      };
    });

    const isAllSuccess = allTaskList.length > 0 && allTaskList.every(r => r.state === 'SUCCESS');
    return {
      success: isAllSuccess, tasks: allTaskList, executionOrder: this.executionOrder,
      error: !isAllSuccess ? { kind: 'EXECUTION_FAILED' as const, message: 'One or more tasks failed or were blocked' } : undefined,
      durationMs: Date.now() - startTime
    };
  }

  private hasUnfinishedTasks(): boolean {
    for (const state of this.states.values()) {
      if (state === 'PENDING' || state === 'READY' || state === 'RUNNING') return true;
    }
    return false;
  }

  private getReadyTasks(): Task[] {
    const ready: Task[] = [];
    for (const [id, state] of this.states.entries()) {
      if (state !== 'PENDING') continue;
      const task = this.taskMap.get(id);
      if (!task) continue;
      if ((task.dependsOn || []).every(depId => this.states.get(depId) === 'SUCCESS')) {
        ready.push(task);
      }
    }
    return ready;
  }

  private updateBlockedStates(): void {
    for (const [id, state] of this.states.entries()) {
      if (state === 'PENDING') {
        const task = this.taskMap.get(id);
        if (!task) continue;
        const hasFailedDep = (task.dependsOn || []).some(depId => {
          const s = this.states.get(depId);
          return s === 'FAILED' || s === 'BLOCKED';
        });
        if (hasFailedDep) {
          this.states.set(id, 'BLOCKED');
          this.results.set(id, {
            taskId: id, state: 'BLOCKED', durationMs: 0,
            featureName: task.featureName, instruction: task.instruction,
            error: { kind: 'EXECUTION_FAILED', message: `Blocked by failed or blocked dependency` }
          });
        }
      }
    }
  }

  private forceBlockRemaining(): void {
    for (const [id, state] of this.states.entries()) {
      if (state === 'PENDING' || state === 'READY' || state === 'RUNNING') {
        this.states.set(id, 'BLOCKED');
        const task = this.taskMap.get(id);
        this.results.set(id, {
          taskId: id, state: 'BLOCKED', durationMs: 0,
          featureName: task?.featureName || '', instruction: task?.instruction || '',
          error: { kind: 'EXECUTION_FAILED', message: 'Unexecutable task blocked' }
        });
      }
    }
  }
}