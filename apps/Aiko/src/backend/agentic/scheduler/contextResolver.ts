/**
 * ASCII Architecture Flowchart: contextResolver
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize contextResolver    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        getNestedProperty         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          normalizedPath          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              parts               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ DEPENDENCY CONTEXT & TASK REFERENCE RESOLVER ════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Task, TaskID, SchedulerTaskResult } from './types.js';
import { JSONValue } from '../../aiko/types.js';

export function getNestedProperty(obj: any, path?: string): any {
  if (!obj || !path) return obj;
  const normalizedPath = path.startsWith('result.') ? path.slice(7) : path.startsWith('output.') ? path.slice(7) : path;
  if (!normalizedPath) return obj;

  const parts = normalizedPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object') {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export class ContextResolver {
  public static resolve(
    task: Task,
    results: Map<TaskID, SchedulerTaskResult>
  ): Record<string, JSONValue> {
    const context: Record<string, JSONValue> = {};

    for (const depId of task.dependsOn || []) {
      const depResult = results.get(depId);
      if (depResult && depResult.state === 'SUCCESS') {
        const rawOutput = depResult.result ?? depResult.rawResult?.response?.body ?? null;
        context[depId] = {
          taskId: depId,
          featureName: depResult.featureName || '',
          output: rawOutput
        };
      }
    }

    if (task.inputFromTasks && task.inputFromTasks.length > 0) {
      for (const ref of task.inputFromTasks) {
        const depResult = results.get(ref.taskId);
        if (!depResult || depResult.state !== 'SUCCESS') continue;

        const baseObj = depResult.result ?? depResult.rawResult?.response?.body ?? null;
        const targetKey = ref.targetContextKey || ref.alias || ref.field || ref.taskId;
        const lookupPath = ref.path || ref.field;

        if (lookupPath) {
          const extracted = getNestedProperty(baseObj, lookupPath);
          context[targetKey] = extracted !== undefined ? extracted : null;
        } else {
          context[targetKey] = baseObj;
        }
      }
    }

    return context;
  }
}