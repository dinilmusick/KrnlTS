/**
 * ASCII Architecture Flowchart: types
 *
 *   ┌──────────────────────────────────────┐
 *   │           Initialize types           │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │  Execute Component / Pipeline Logic  │
 *   └──────────────────────────────────────┘
 *                      │
 *                      ▼
 *   ┌──────────────────────────────────────┐
 *   │    Return State / Result Payload     │
 *   └──────────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: ENRICHER SUB-AGENT TYPES ═══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { AgentLevel, AgentContext, TaskResultReference, JSONValue, Task, Goal } from '../message/agentMessageTypes.js';

export interface EnrichedTaskItem {
  id?: string;
  description?: string;
  goals?: Goal[];
  instruction: string;
  target?: string;
  toolName?: string;
  featureName?: string;
  dependsOn?: string[];
  inputFromTasks?: TaskResultReference[];
}

export interface EnricherInput {
  task?: Task;
  instruction?: string;
  level: AgentLevel;
  definitions?: any;
  examples?: any;
  context: AgentContext;
  dependencyResults?: TaskResultReference[];
  correlationId?: string;
  target?: string;
}

export interface EnricherOutput {
  normalizedInstruction: string;
  tasks?: EnrichedTaskItem[];
  endpointTasks?: Task[];
  structuredPayload?: JSONValue;
  reasoning?: string;
}

export interface EnricherConfig {
  level: AgentLevel;
  context: AgentContext;
}