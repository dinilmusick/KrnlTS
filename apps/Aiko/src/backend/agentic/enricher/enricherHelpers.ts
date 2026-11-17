/**
 * ASCII Architecture Flowchart: enricherHelpers
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize enricherHelpers    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     extractJsonFromResponse      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             trimmed              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          jsonBlockRegex          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: ENRICHER HELPER UTILITIES ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { EnricherOutput } from '../types.js';
import { JSONValue, Task, Goal } from '../message/agentMessageTypes.js';

export function extractJsonFromResponse(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

export function parseEnricherResponse(
  raw: string,
  fallbackInstruction: string
): EnricherOutput {
  const parsed = extractJsonFromResponse(raw);
  if (!parsed || typeof parsed !== 'object') {
    return {
      normalizedInstruction: fallbackInstruction,
      tasks: [],
      endpointTasks: [],
      structuredPayload: null
    };
  }

  const normalizedInstruction =
    typeof parsed.normalizedInstruction === 'string' && parsed.normalizedInstruction.trim()
      ? parsed.normalizedInstruction.trim()
      : fallbackInstruction;

  const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : (Array.isArray(parsed.endpointTasks) ? parsed.endpointTasks : undefined);

  const tasks = rawTasks
    ? rawTasks.map((t: any, idx: number) => {
        const desc = typeof t.description === 'string' ? t.description : (typeof t.instruction === 'string' ? t.instruction : String(t));
        const goals: Goal[] = Array.isArray(t.goals) && t.goals.length > 0
          ? t.goals.map((g: any) => ({
              description: typeof g.description === 'string' ? g.description : String(g),
              expectedOutput: g.expectedOutput
            }))
          : [{ description: desc }];

        return {
          id: typeof t.id === 'string' ? t.id : `task-${idx + 1}`,
          description: desc,
          instruction: typeof t.instruction === 'string' ? t.instruction : desc,
          goals,
          target: t.target || t.toolName || t.featureName,
          toolName: t.toolName || t.target,
          featureName: t.featureName || t.target,
          dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
          inputFromTasks: Array.isArray(t.inputFromTasks) ? t.inputFromTasks : []
        };
      })
    : undefined;

  let structuredPayload: JSONValue | undefined = undefined;
  if (parsed.structuredPayload !== undefined) {
    structuredPayload = parsed.structuredPayload;
  } else if (parsed.payload !== undefined) {
    structuredPayload = parsed.payload;
  }

  return {
    normalizedInstruction,
    tasks,
    endpointTasks: tasks as Task[] | undefined,
    structuredPayload,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined
  };
}