/**
 * ASCII Architecture Flowchart: mcpTypes
 *
 *   ┌──────────────────────────────────────┐
 *   │         Initialize mcpTypes          │
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

import { ProviderId } from '../types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export type McpTool = McpToolDefinition;

export interface McpServerRegistration {
  id?: string;
  name: string;
  transport?: 'stdio' | 'sse';
  urlOrCommand?: string;
  url?: string;
  args?: string[];
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  toolsCount?: number;
  registeredAt?: string;
  error?: string;
}

export interface AgentReliabilityAttempt {
  attemptIndex: number;
  timestamp: string;
  modelUsed: string;
  providerUsed: ProviderId;
  isValid?: boolean;
  validationErrors?: Array<{ path: string; message: string; code: string }>;
  executionOutput?: string;
  rawToolCall?: {
    name: string;
    argumentsString: string;
  };
}

export interface AgentReliabilityResult {
  success: boolean;
  contractId: string;
  totalAttempts: number;
  finalOutput: string;
  validatedToolCalls: Array<{ id: string; name: string; parsedArguments: any; result?: any }>;
  attempts: AgentReliabilityAttempt[];
  totalLatencyMs: number;
}