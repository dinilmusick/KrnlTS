/**
 * ASCII Architecture Flowchart: messageSanitizer
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize messageSanitizer    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │      SENSITIVE_KEY_PATTERNS      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │      SECRET_VALUE_PATTERNS       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        sanitizeTextValue         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: MESSAGE & CONTEXT SECRET SANITIZER ════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { AgentMessage, JSONValue } from './agentMessageTypes.js';

const SENSITIVE_KEY_PATTERNS = [
  /api[-_]?key/i,
  /auth[-_]?token/i,
  /bearer/i,
  /secret/i,
  /password/i,
  /credential/i,
  /private[-_]?key/i,
  /access[-_]?token/i,
  /refresh[-_]?token/i,
  /session[-_]?token/i
];

const SECRET_VALUE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9\-_.]+/gi,
  /key-[a-zA-Z0-9]{16,}/gi,
  /sk-[a-zA-Z0-9]{20,}/gi,
  /AIza[0-9A-Za-z\-_]{35}/gi,
  /basic\s+[A-Za-z0-9+/=]+/gi
];

export function sanitizeTextValue(text: string): string {
  if (!text) return text;
  let sanitized = text;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]');
  }
  return sanitized;
}

export function sanitizeJsonValue(value: JSONValue): JSONValue {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return sanitizeTextValue(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeJsonValue(item));
  }
  if (typeof value === 'object') {
    const result: Record<string, JSONValue> = {};
    for (const [k, v] of Object.entries(value)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some(p => p.test(k));
      if (isSensitiveKey) {
        result[k] = '[REDACTED_CREDENTIAL]';
      } else {
        result[k] = sanitizeJsonValue(v);
      }
    }
    return result;
  }
  return value;
}

export function sanitizeAgentMessage(msg: AgentMessage): AgentMessage {
  const sanitized: AgentMessage = {
    ...msg,
    task: {
      ...msg.task,
      instruction: sanitizeTextValue(msg.task.instruction)
    }
  };

  if (msg.result) {
    sanitized.result = {
      ...msg.result,
      data: msg.result.data !== undefined ? sanitizeJsonValue(msg.result.data) : undefined,
      summary: msg.result.summary ? sanitizeTextValue(msg.result.summary) : undefined
    };
  }

  if (msg.error) {
    sanitized.error = {
      ...msg.error,
      message: sanitizeTextValue(msg.error.message),
      details: msg.error.details !== undefined ? sanitizeJsonValue(msg.error.details) : undefined
    };
  }

  if (msg.insufficiency) {
    sanitized.insufficiency = {
      ...msg.insufficiency,
      reason: sanitizeTextValue(msg.insufficiency.reason),
      missing: msg.insufficiency.missing.map(m => ({
        ...m,
        description: sanitizeTextValue(m.description)
      })),
      attemptedActions: msg.insufficiency.attemptedActions?.map(a => sanitizeTextValue(a))
    };
  }

  if (msg.context?.resolvedInputs) {
    sanitized.context = {
      ...msg.context,
      resolvedInputs: sanitizeJsonValue(msg.context.resolvedInputs)
    };
  }

  return sanitized;
}