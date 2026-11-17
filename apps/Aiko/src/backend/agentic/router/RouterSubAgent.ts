// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: REUSABLE ROUTER SUB-AGENT ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { AgentLevel } from '../message/agentMessageTypes.js';
import { RouterInput, RouterOutput, RouterConfig } from './types.js';
import { buildToolRouterPrompt, buildAikoRouterPrompt, buildCapabilityGatePrompt } from './routerPrompt.js';
import { parseRouterResponse, parseCapabilityGateResponse } from './routerHelpers.js';
import { IntelligenceSpecResolver } from '../intelligenceSpecResolver.js';
import { failoverExecutionEngine } from '../../failoverEngine.js';

export class RouterSubAgent {
  private readonly defaultLevel: AgentLevel;
  private readonly config?: RouterConfig;

  constructor(config?: RouterConfig) {
    this.config = config;
    this.defaultLevel = config?.level || 'TOOL';
  }

  public async evaluate(input: RouterInput): Promise<RouterOutput> {
    const level = input.level || this.defaultLevel;
    const context = input.context || this.config?.context;

    const prompt = buildCapabilityGatePrompt(input);
    const resolved = IntelligenceSpecResolver.resolveAgentModel(level, {
      explicitSpecId: context?.intelligenceSpecId,
      subAgentRole: 'router',
      tool: context?.toolDefinition,
      feature: context?.featureDefinition,
      agentDefinition: context?.toolDefinition?.agent || context?.featureDefinition?.agent
    });
    const profile = resolved.profile;
    const providerToUse = context?.selectedProvider || resolved.subAgent?.selectedProvider;
    const modelToUse = context?.selectedModel || resolved.subAgent?.selectedModel;

    let rawResponse = '';
    try {
      if (context?.customInference) {
        rawResponse = await context.customInference(prompt, profile);
      } else if (providerToUse && modelToUse) {
        try {
          const direct = await failoverExecutionEngine.executeDirectRequest(
            providerToUse as any,
            modelToUse,
            prompt
          );
          rawResponse = direct.content;
        } catch {
          const profRes = await failoverExecutionEngine.executeProfileRequest(profile, prompt);
          rawResponse = profRes.content;
        }
      } else {
        const profRes = await failoverExecutionEngine.executeProfileRequest(profile, prompt);
        rawResponse = profRes.content;
      }
    } catch {
      return {
        decision: 'SUFFICIENT',
        reasoning: 'Router model execution fallback: permitted downstream'
      };
    }

    return parseCapabilityGateResponse(rawResponse, input);
  }

  public async analyze(input: RouterInput): Promise<RouterOutput> {
    const level = input.level || this.defaultLevel;
    const context = input.context || this.config?.context;

    if (input.message?.status === 'SUCCESS') {
      return {
        decision: 'SUFFICIENT',
        action: 'COMPLETE',
        reasoning: 'Message completed successfully'
      };
    }

    const prompt = level === 'AIKO' ? buildAikoRouterPrompt(input) : buildToolRouterPrompt(input);

    const resolved = IntelligenceSpecResolver.resolveAgentModel(level, {
      explicitSpecId: context?.intelligenceSpecId,
      subAgentRole: 'router',
      tool: context?.toolDefinition,
      feature: context?.featureDefinition,
      agentDefinition: context?.toolDefinition?.agent || context?.featureDefinition?.agent
    });
    const profile = resolved.profile;
    const providerToUse = context?.selectedProvider || resolved.subAgent?.selectedProvider;
    const modelToUse = context?.selectedModel || resolved.subAgent?.selectedModel;

    let rawResponse = '';
    try {
      if (context?.customInference) {
        rawResponse = await context.customInference(prompt, profile);
      } else if (providerToUse && modelToUse) {
        try {
          const direct = await failoverExecutionEngine.executeDirectRequest(
            providerToUse as any,
            modelToUse,
            prompt
          );
          rawResponse = direct.content;
        } catch {
          const profRes = await failoverExecutionEngine.executeProfileRequest(profile, prompt);
          rawResponse = profRes.content;
        }
      } else {
        const profRes = await failoverExecutionEngine.executeProfileRequest(profile, prompt);
        rawResponse = profRes.content;
      }
    } catch {
      if (level === 'AIKO') {
        return {
          decision: 'INSUFFICIENT',
          action: 'ASK_USER',
          reasoning: 'Fallback: Escalated unresolved message to user',
          missing: input.message?.insufficiency?.missing || [
            { key: 'input', description: 'Additional input required', required: true }
          ]
        };
      }
      return {
        decision: 'INSUFFICIENT',
        action: 'ESCALATE',
        reasoning: 'Fallback: Escalate unresolved message to AIKO'
      };
    }

    return parseRouterResponse(rawResponse, input);
  }
}
