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
// ════ AIKO PHASE 13: ROUTER SUB-AGENT TYPES ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import {
  AgentMessage,
  AgentLevel,
  TargetDefinition,
  AgentContext,
  MissingInformation,
  TaskResultReference,
  Task
} from '../message/agentMessageTypes.js';

export type RouterDecision = 'SUFFICIENT' | 'INSUFFICIENT';

export type RouterAction =
  | 'ROUTE'
  | 'ESCALATE'
  | 'ASK_USER'
  | 'RETRY'
  | 'COMPLETE';

export interface RouterTaskItem {
  id?: string;
  description?: string;
  instruction?: string;
  target: string;
  toolName?: string;
  featureName?: string;
  dependsOn?: string[];
  inputFromTasks?: TaskResultReference[];
}

export interface RouterInput {
  task?: Task;
  level: AgentLevel;
  definitions?: any;
  examples?: any;
  availableTargets?: TargetDefinition[];
  context: AgentContext;
  message?: AgentMessage;
}

export interface RouterOutput {
  decision: RouterDecision;
  missing?: MissingInformation[];
  reasoning?: string;
  action?: RouterAction;
  tasks?: RouterTaskItem[];
}

export interface RouterConfig {
  level: AgentLevel;
  context: AgentContext;
}