/**
 * ASCII Architecture Flowchart: memoryAndLearning
 *
 *   ┌──────────────────────────────────────┐
 *   │     Initialize memoryAndLearning     │
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
// ════ AIKO MEMORIES & LEARNING CANONICAL TYPES ═════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { Learning } from './tools.js';

export interface MemoryEntry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
}

export interface Memory {
  schemaVersion: string;
  name: string;
  description?: string;
  entries: MemoryEntry[];
}

export type LearningScope = 'AIKO' | 'TOOL' | 'FEATURE';

export interface LearningCandidate {
  scope: LearningScope;
  target: string;
  content: string;
  reason?: string;
}

export type ExecutionEventType =
  | 'SUCCESS'
  | 'FAILURE'
  | 'RETRY_SUCCESS'
  | 'USER_CORRECTION'
  | 'USER_FEEDBACK'
  | 'VALIDATION_ERROR'
  | 'HTTP_ERROR';

export interface ExecutionEventPayload {
  type: ExecutionEventType;
  query?: string;
  task?: string;
  toolName?: string;
  featureName?: string;
  error?: string;
  userCorrection?: string;
  userFeedback?: string;
  responseStatus?: number;
  attempts?: number;
}

export interface ContextOptions {
  maxMemoryTokens?: number;
  maxLearningTokens?: number;
}

export interface RelevantContext {
  memories: MemoryEntry[];
  toolLearnings: Learning[];
  featureLearnings: Learning[];
  formattedText: string;
}