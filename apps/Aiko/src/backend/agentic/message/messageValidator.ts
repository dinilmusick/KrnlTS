/**
 * ASCII Architecture Flowchart: messageValidator
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize messageValidator    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           VALID_LEVELS           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          VALID_STATUSES          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          VALID_SOURCES           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: AGENT MESSAGE BOUNDARY VALIDATOR ══════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { AgentMessage, AgentLevel, MessageStatus } from './agentMessageTypes.js';

const VALID_LEVELS: Set<AgentLevel> = new Set(['AIKO', 'TOOL', 'ENDPOINT']);
const VALID_STATUSES: Set<MessageStatus> = new Set(['SUCCESS', 'FAILURE', 'INSUFFICIENT_INFORMATION']);
const VALID_SOURCES = new Set(['AGENT', 'EXECUTOR', 'TRANSPORT', 'VALIDATION', 'DEPENDENCY', 'USER_INPUT']);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAgentMessage(message: unknown): ValidationResult {
  const errors: string[] = [];
  if (!message || typeof message !== 'object') {
    return { valid: false, errors: ['AgentMessage must be a non-null object'] };
  }

  const msg = message as Partial<AgentMessage>;

  if (!msg.messageId || typeof msg.messageId !== 'string') {
    errors.push('messageId is required and must be a string');
  }
  if (!msg.correlationId || typeof msg.correlationId !== 'string') {
    errors.push('correlationId is required and must be a string');
  }
  if (!msg.status || !VALID_STATUSES.has(msg.status as MessageStatus)) {
    errors.push(`Invalid status: ${msg.status}. Must be one of SUCCESS, FAILURE, INSUFFICIENT_INFORMATION`);
  }

  // Source checks
  if (!msg.source || typeof msg.source !== 'object') {
    errors.push('source is required and must be an object');
  } else {
    if (!msg.source.level || !VALID_LEVELS.has(msg.source.level)) {
      errors.push(`Invalid source.level: ${msg.source.level}`);
    }
    if (!msg.source.agentId || typeof msg.source.agentId !== 'string') {
      errors.push('source.agentId is required and must be a string');
    }
  }

  // Task checks
  if (!msg.task || typeof msg.task !== 'object') {
    errors.push('task is required and must be an object');
  } else {
    if (!msg.task.taskId || typeof msg.task.taskId !== 'string') {
      errors.push('task.taskId is required and must be a string');
    }
    if (typeof msg.task.instruction !== 'string') {
      errors.push('task.instruction must be a string');
    }
  }

  // Metadata checks
  if (!msg.metadata || typeof msg.metadata !== 'object') {
    errors.push('metadata is required and must be an object');
  } else {
    if (!msg.metadata.createdAt || typeof msg.metadata.createdAt !== 'string') {
      errors.push('metadata.createdAt is required and must be an ISO string');
    }
  }

  // Status-specific invariants
  if (msg.status === 'SUCCESS') {
    if (!msg.result || typeof msg.result !== 'object') {
      errors.push('SUCCESS status requires result object');
    }
  } else if (msg.status === 'FAILURE') {
    if (!msg.error || typeof msg.error !== 'object') {
      errors.push('FAILURE status requires error object');
    } else {
      if (!msg.error.code || typeof msg.error.code !== 'string') {
        errors.push('error.code is required and must be a string');
      }
      if (!msg.error.source || !VALID_SOURCES.has(msg.error.source)) {
        errors.push(`error.source is invalid: ${msg.error.source}`);
      }
      if (typeof msg.error.message !== 'string') {
        errors.push('error.message must be a string');
      }
      if (typeof msg.error.retryable !== 'boolean') {
        errors.push('error.retryable must be a boolean');
      }
    }
  } else if (msg.status === 'INSUFFICIENT_INFORMATION') {
    if (!msg.insufficiency || typeof msg.insufficiency !== 'object') {
      errors.push('INSUFFICIENT_INFORMATION status requires insufficiency object');
    } else {
      if (!Array.isArray(msg.insufficiency.missing) || msg.insufficiency.missing.length === 0) {
        errors.push('insufficiency.missing must be a non-empty array of MissingInformation');
      }
      if (typeof msg.insufficiency.reason !== 'string') {
        errors.push('insufficiency.reason must be a string');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}