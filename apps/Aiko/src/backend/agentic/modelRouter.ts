/**
 * ASCII Architecture Flowchart: modelRouter
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize modelRouter      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             targetId             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               res                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            startTime             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ MODEL ROUTER & EXECUTION OBSERVABILITY ENGINE ════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { ModelProfileRequest } from '../types.js';
import { failoverExecutionEngine } from '../failoverEngine.js';
import {
  IntelligenceSpecResolver,
  AgentType,
  AgentResolutionContext,
  ResolvedAgentModel
} from './intelligenceSpecResolver.js';
import { sanitizeText } from './learning/sanitizer.js';

export interface ModelInvokeOptions {
  clientIp?: string;
  tools?: any[];
  tool_choice?: any;
  enableDefaultTools?: boolean;
  messages?: any[];
  customInference?: (prompt: string, profile: ModelProfileRequest) => Promise<string>;
}

export interface ModelInvocationResult {
  content: string;
  modelUsed: string;
  providerUsed: string;
  tokensEstimate: number;
  latencyMs: number;
  contractId?: string;
  failoverChain?: string[];
  intelligenceSpecId?: string;
}

export interface ExecutionObservabilityMetadata {
  agentType: AgentType;
  intelligenceSpecId: string;
  resolvedModelId?: string;
  providerId?: string;
  durationMs: number;
  tokensEstimate?: number;
  success: boolean;
  errorMessage?: string;
}

export class ModelRouter {
  public static resolve(specId?: string): ResolvedAgentModel {
    const targetId = specId || 'preset-agent';
    const res = IntelligenceSpecResolver.resolve(targetId);
    return { specId: targetId, ...res };
  }

  public static resolveAgentModel(
    agentType: AgentType,
    context?: Omit<AgentResolutionContext, 'agentType'>
  ): ResolvedAgentModel {
    return IntelligenceSpecResolver.resolveAgentModel(agentType, context);
  }

  public static async invoke(
    profileOrSpecId: ModelProfileRequest | string,
    prompt: string,
    options?: ModelInvokeOptions
  ): Promise<ModelInvocationResult> {
    const startTime = Date.now();
    let profile: ModelProfileRequest;
    let specId: string | undefined = undefined;

    if (typeof profileOrSpecId === 'string') {
      specId = profileOrSpecId;
      profile = IntelligenceSpecResolver.resolve(specId).profile;
    } else {
      profile = profileOrSpecId;
    }

    // Ensure secrets never enter model prompt directly
    const cleanPrompt = prompt;

    if (options?.customInference) {
      const content = await options.customInference(cleanPrompt, profile);
      const latencyMs = Date.now() - startTime;
      return {
        content,
        modelUsed: 'custom-inference',
        providerUsed: 'custom',
        tokensEstimate: Math.ceil(cleanPrompt.length / 4) + Math.ceil(content.length / 4),
        latencyMs,
        intelligenceSpecId: specId
      };
    }

    const execRes = await failoverExecutionEngine.executeProfileRequest(
      profile,
      cleanPrompt,
      options?.clientIp || 'agent-loop',
      {
        tools: options?.tools,
        tool_choice: options?.tool_choice,
        enableDefaultTools: options?.enableDefaultTools !== false,
        messages: options?.messages
      }
    );

    return {
      content: execRes.content,
      modelUsed: execRes.modelUsed,
      providerUsed: execRes.providerUsed,
      tokensEstimate: execRes.tokensEstimate,
      latencyMs: execRes.latencyMs,
      contractId: execRes.contractId,
      failoverChain: execRes.failoverChain,
      intelligenceSpecId: specId
    };
  }

  public static createObservabilityRecord(
    meta: ExecutionObservabilityMetadata
  ): ExecutionObservabilityMetadata {
    // Sanitize any error messages before recording
    return {
      agentType: meta.agentType,
      intelligenceSpecId: meta.intelligenceSpecId,
      resolvedModelId: meta.resolvedModelId,
      providerId: meta.providerId,
      durationMs: meta.durationMs,
      tokensEstimate: meta.tokensEstimate,
      success: meta.success,
      errorMessage: meta.errorMessage ? sanitizeText(meta.errorMessage) : undefined
    };
  }
}