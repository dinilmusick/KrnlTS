/**
 * ASCII Architecture Flowchart: messageFactory
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize messageFactory     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        generateMessageId         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │       createSuccessMessage       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               msg                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: AGENT MESSAGE FACTORY ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import {
  AgentMessage,
  AgentLevel,
  ErrorSource,
  JSONValue,
  MissingInformation,
  TaskResultReference
} from './agentMessageTypes.js';
import { sanitizeAgentMessage } from './messageSanitizer.js';

let messageCounter = 0;

export function generateMessageId(prefix: string = 'msg'): string {
  messageCounter++;
  return `${prefix}-${Date.now()}-${messageCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createSuccessMessage(params: {
  correlationId: string;
  parentMessageId?: string;
  source: {
    level: AgentLevel;
    agentId: string;
    toolName?: string;
    featureName?: string;
  };
  task: {
    taskId: string;
    instruction: string;
    target?: string;
  };
  data?: JSONValue;
  summary?: string;
  outputSchema?: Record<string, any>;
  context?: {
    resolvedInputs?: JSONValue;
    dependencyResults?: TaskResultReference[];
  };
  attempt?: number;
  resolvedBy?: AgentLevel;
}): AgentMessage {
  const msg: AgentMessage = {
    messageId: generateMessageId(`msg-${params.source.level.toLowerCase()}`),
    correlationId: params.correlationId,
    parentMessageId: params.parentMessageId,
    status: 'SUCCESS',
    source: params.source,
    task: params.task,
    result: {
      data: params.data,
      summary: params.summary,
      outputSchema: params.outputSchema
    },
    context: params.context,
    metadata: {
      createdAt: new Date().toISOString(),
      attempt: params.attempt ?? 1,
      resolvedBy: params.resolvedBy ?? params.source.level
    }
  };
  return sanitizeAgentMessage(msg);
}

export function createFailureMessage(params: {
  correlationId: string;
  parentMessageId?: string;
  source: {
    level: AgentLevel;
    agentId: string;
    toolName?: string;
    featureName?: string;
  };
  task: {
    taskId: string;
    instruction: string;
    target?: string;
  };
  error: {
    code: string;
    source: ErrorSource;
    message: string;
    details?: JSONValue;
    retryable: boolean;
  };
  context?: {
    resolvedInputs?: JSONValue;
    dependencyResults?: TaskResultReference[];
  };
  attempt?: number;
}): AgentMessage {
  const msg: AgentMessage = {
    messageId: generateMessageId(`msg-err-${params.source.level.toLowerCase()}`),
    correlationId: params.correlationId,
    parentMessageId: params.parentMessageId,
    status: 'FAILURE',
    source: params.source,
    task: params.task,
    error: params.error,
    context: params.context,
    metadata: {
      createdAt: new Date().toISOString(),
      attempt: params.attempt ?? 1
    }
  };
  return sanitizeAgentMessage(msg);
}

export function createInsufficientInfoMessage(params: {
  correlationId: string;
  parentMessageId?: string;
  source: {
    level: AgentLevel;
    agentId: string;
    toolName?: string;
    featureName?: string;
  };
  task: {
    taskId: string;
    instruction: string;
    target?: string;
  };
  missing: MissingInformation[];
  reason: string;
  attemptedActions?: string[];
  context?: {
    resolvedInputs?: JSONValue;
    dependencyResults?: TaskResultReference[];
  };
  attempt?: number;
}): AgentMessage {
  const msg: AgentMessage = {
    messageId: generateMessageId(`msg-insuf-${params.source.level.toLowerCase()}`),
    correlationId: params.correlationId,
    parentMessageId: params.parentMessageId,
    status: 'INSUFFICIENT_INFORMATION',
    source: params.source,
    task: params.task,
    insufficiency: {
      missing: params.missing,
      reason: params.reason,
      attemptedActions: params.attemptedActions
    },
    context: params.context,
    metadata: {
      createdAt: new Date().toISOString(),
      attempt: params.attempt ?? 1
    }
  };
  return sanitizeAgentMessage(msg);
}