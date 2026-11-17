/**
 * ASCII Architecture Flowchart: dagValidator
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize dagValidator      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             taskMap              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │                t                 │
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
// ════ DIRECTED ACYCLIC GRAPH (DAG) VALIDATION ENGINE ══════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Task, TaskID, SchedulerError } from '../types.js';

export interface GraphValidationResult {
  valid: boolean;
  error?: SchedulerError;
}

export class DagValidator {
  public static validate(tasks: Task[]): GraphValidationResult {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return {
        valid: false,
        error: { kind: 'VALIDATION', message: 'Task list must be a non-empty array' }
      };
    }

    const taskMap = new Map<TaskID, Task>();

    for (const t of tasks) {
      if (!t.id || typeof t.id !== 'string' || !t.id.trim()) {
        return {
          valid: false,
          error: { kind: 'VALIDATION', message: 'Each task must have a non-empty string ID' }
        };
      }
      if (taskMap.has(t.id)) {
        return {
          valid: false,
          error: { kind: 'DUPLICATE_TASK_ID', message: `Duplicate Task ID detected: "${t.id}"` }
        };
      }
      if (!t.featureName || typeof t.featureName !== 'string' || !t.featureName.trim()) {
        return {
          valid: false,
          error: { kind: 'VALIDATION', message: `Task "${t.id}" is missing required featureName` }
        };
      }
      taskMap.set(t.id, t);
    }

    for (const t of tasks) {
      const deps = t.dependsOn || [];
      for (const depId of deps) {
        if (depId === t.id) {
          return {
            valid: false,
            error: { kind: 'SELF_DEPENDENCY', message: `Task "${t.id}" cannot depend on itself` }
          };
        }
        if (!taskMap.has(depId)) {
          return {
            valid: false,
            error: { kind: 'UNKNOWN_DEPENDENCY', message: `Task "${t.id}" depends on unknown task "${depId}"` }
          };
        }
      }

      for (const ref of t.inputFromTasks || []) {
        if (!ref.taskId || !taskMap.has(ref.taskId)) {
          return {
            valid: false,
            error: { kind: 'INVALID_REFERENCE', message: `Task "${t.id}" references unknown task "${ref.taskId}"` }
          };
        }
        if (ref.taskId === t.id) {
          return {
            valid: false,
            error: { kind: 'INVALID_REFERENCE', message: `Task "${t.id}" cannot reference its own output` }
          };
        }
        const key = ref.targetContextKey || ref.alias || ref.field;
        if (!key) {
          return {
            valid: false,
            error: { kind: 'INVALID_REFERENCE', message: `TaskReference in "${t.id}" missing targetContextKey` }
          };
        }
      }
    }

    const cycleError = this.detectCycles(tasks, taskMap);
    if (cycleError) {
      return { valid: false, error: cycleError };
    }

    return { valid: true };
  }

  private static detectCycles(tasks: Task[], taskMap: Map<TaskID, Task>): SchedulerError | null {
    const visited = new Set<TaskID>();
    const recStack = new Set<TaskID>();
    const cyclePath: TaskID[] = [];

    const dfs = (currId: TaskID): boolean => {
      visited.add(currId);
      recStack.add(currId);
      cyclePath.push(currId);

      const task = taskMap.get(currId);
      for (const depId of task?.dependsOn || []) {
        if (!visited.has(depId)) {
          if (dfs(depId)) return true;
        } else if (recStack.has(depId)) {
          cyclePath.push(depId);
          return true;
        }
      }

      recStack.delete(currId);
      cyclePath.pop();
      return false;
    };

    for (const t of tasks) {
      if (!visited.has(t.id)) {
        cyclePath.length = 0;
        if (dfs(t.id)) {
          const chain = cyclePath.join(' -> ');
          return {
            kind: 'CYCLIC_DEPENDENCY',
            message: `Cyclic dependency detected: ${chain}`,
            details: { cycleChain: chain }
          };
        }
      }
    }

    return null;
  }
}