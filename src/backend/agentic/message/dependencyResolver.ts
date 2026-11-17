/**
 * ASCII Architecture Flowchart: dependencyResolver
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize dependencyResolver   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         extractPathValue         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              parts               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               part               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: TASK DEPENDENCY & RESULT RESOLVER ═════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { JSONValue, TaskResultReference, AgentMessage } from './agentMessageTypes.js';

export function extractPathValue(obj: JSONValue, path?: string): JSONValue | undefined {
  if (path === undefined || path === '' || path === '.') {
    return obj;
  }
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const parts = path.split('.').map(p => p.trim()).filter(Boolean);
  let current: any = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current as JSONValue;
}

export function resolveTaskDependencies(
  references: TaskResultReference[],
  completedMessages: Map<string, AgentMessage>
): { resolvedInputs: Record<string, JSONValue>; missingReferences: TaskResultReference[] } {
  const resolvedInputs: Record<string, JSONValue> = {};
  const missingReferences: TaskResultReference[] = [];

  for (const ref of references) {
    const priorMsg = completedMessages.get(ref.taskId) || completedMessages.get(ref.messageId);
    if (!priorMsg || priorMsg.status !== 'SUCCESS' || !priorMsg.result) {
      missingReferences.push(ref);
      continue;
    }

    const sourceData = priorMsg.result.data;
    const extracted = extractPathValue(sourceData, ref.path);

    if (extracted !== undefined) {
      resolvedInputs[ref.targetContextKey] = extracted;
    } else {
      missingReferences.push(ref);
    }
  }

  return {
    resolvedInputs,
    missingReferences
  };
}

export function mergeDependencyContext(
  baseContext: Record<string, JSONValue> | undefined,
  resolvedDependencies: Record<string, JSONValue>
): Record<string, JSONValue> {
  return {
    ...(baseContext || {}),
    ...resolvedDependencies
  };
}