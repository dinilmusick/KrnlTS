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

import { McpToolDefinition } from '../../types.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ZodValidationErrorDetail {
  path: string;
  message: string;
  code: string;
}

export interface AgentReliabilityAttempt {
  attemptIndex: number;
  timestamp: string;
  modelUsed: string;
  providerUsed: string;
  isValid?: boolean;
  validationErrors?: ZodValidationErrorDetail[];
  executionOutput?: string;
  rawToolCall?: {
    name: string;
    argumentsString: string;
  };
}

export interface AgentReliabilityRequest {
  prompt: string;
  tools?: McpToolDefinition[];
  maxRetries?: number;
  requiredContext?: number;
  intelligenceSpec?: any;
  mcpServers?: any;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
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

export interface AgentReliabilityResponse extends AgentReliabilityResult {}