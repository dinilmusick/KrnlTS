// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO PHASE 13: REUSABLE ENRICHER SUB-AGENT ═════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { AgentLevel } from '../message/agentMessageTypes.js';
import { EnricherInput, EnricherOutput, EnricherConfig } from './types.js';
import {
  buildAikoEnricherPrompt,
  buildToolEnricherPrompt,
  buildEndpointEnricherPrompt
} from './enricherPrompt.js';
import { parseEnricherResponse } from './enricherHelpers.js';
import { IntelligenceSpecResolver } from '../intelligenceSpecResolver.js';
import { failoverExecutionEngine } from '../../failoverEngine.js';

export class EnricherSubAgent {
  private readonly defaultLevel: AgentLevel;
  private readonly config?: EnricherConfig;

  constructor(config?: EnricherConfig) {
    this.config = config;
    this.defaultLevel = config?.level || 'AIKO';
  }

  public async enrich(input: EnricherInput): Promise<EnricherOutput> {
    const level = input.level || this.defaultLevel;
    const context = input.context || this.config?.context;
    const instruction = input.instruction || input.task?.description || '';

    if (!instruction || typeof instruction !== 'string') {
      return {
        normalizedInstruction: '',
        tasks: [],
        endpointTasks: [],
        structuredPayload: null
      };
    }

    let prompt = '';
    if (level === 'AIKO') {
      prompt = buildAikoEnricherPrompt(input);
    } else if (level === 'TOOL') {
      prompt = buildToolEnricherPrompt(input);
    } else {
      prompt = buildEndpointEnricherPrompt(input);
    }

    const resolved = IntelligenceSpecResolver.resolveAgentModel(level, {
      explicitSpecId: context?.intelligenceSpecId,
      subAgentRole: 'enhancer',
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
      // Fallback on model error: maintain instruction fidelity
      return {
        normalizedInstruction: input.instruction,
        tasks: [],
        structuredPayload: null
      };
    }

    return parseEnricherResponse(rawResponse, input.instruction);
  }
}
