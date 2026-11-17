/**
 * ASCII Architecture Flowchart: executionTypes
 *
 *   ┌──────────────────────────────────────┐
 *   │      Initialize executionTypes       │
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

import { ProviderId } from '../../../../backend/types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export type ExecutionNodeType =
  | 'user'
  | 'agent'
  | 'enricher'
  | 'router'
  | 'tool'
  | 'endpoint'
  | 'zod'
  | 'executor'
  | 'key';

export interface ExecutionNode {
  id: string;
  type: ExecutionNodeType;
  label: string;
  status?: 'pending' | 'running' | 'success' | 'failed' | 'blocked';
  model?: string;
  provider?: string;
  apiKeyName?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  glow?: boolean;
}

export type ExecutionEdgeType =
  | 'access'
  | 'message'
  | 'success'
  | 'failure'
  | 'insufficiency'
  | 'recovery';

export interface ExecutionEdge {
  id: string;
  source: string;
  target: string;
  type: ExecutionEdgeType;
  label?: string;
  metadata?: {
    messageId?: string;
    correlationId?: string;
    parentMessageId?: string;
    source?: string;
    target?: string;
    status?: string;
    task?: {
      taskId: string;
      instruction: string;
      target?: string;
      goals?: string[];
    };
    result?: any;
    error?: {
      code?: string;
      source?: string;
      message?: string;
      retryable?: boolean;
    };
    insufficiency?: string;
    missingInformation?: string[];
    timestamp?: string;
  };
}

export interface GraphState {
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
}