/**
 * ASCII Architecture Flowchart: taskHelper
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize taskHelper       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     normalizeToCanonicalTask     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │                id                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           description            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: TASK & GOAL CANONICAL HELPERS ═════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Task, Goal, TaskResultReference } from './agentMessageTypes.js';

export function normalizeToCanonicalTask(raw: {
  id?: string;
  taskId?: string;
  description?: string;
  instruction?: string;
  goals?: Goal[];
  target?: string;
  toolName?: string;
  featureName?: string;
  dependsOn?: string[];
  inputFromTasks?: TaskResultReference[];
}): Task {
  const id = raw.id || raw.taskId || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const description = (raw.description && raw.description.trim())
    || (raw.instruction && raw.instruction.trim())
    || 'Execute task';

  let goals: Goal[] = [];
  if (Array.isArray(raw.goals) && raw.goals.length > 0) {
    goals = raw.goals.map(g => ({
      description: typeof g.description === 'string' ? g.description : String(g),
      expectedOutput: g.expectedOutput
    }));
  } else {
    goals = [{
      description: `Produce result for ${description}`,
      expectedOutput: raw.target ? `Successful result from ${raw.target}` : undefined
    }];
  }

  return {
    id,
    description,
    goals,
    target: raw.target || raw.toolName || raw.featureName,
    toolName: raw.toolName || raw.target,
    featureName: raw.featureName || raw.target,
    instruction: raw.instruction || description,
    dependsOn: Array.isArray(raw.dependsOn) ? raw.dependsOn : [],
    inputFromTasks: Array.isArray(raw.inputFromTasks) ? raw.inputFromTasks : []
  };
}

export function formatTaskSummary(task: Task): string {
  const goalsSummary = task.goals.map(g => `- Goal: ${g.description}${g.expectedOutput ? ` (Expected: ${g.expectedOutput})` : ''}`).join('\n');
  return `Task [${task.id}]: ${task.description}\nTarget: ${task.target || 'None'}\nGoals:\n${goalsSummary}`;
}