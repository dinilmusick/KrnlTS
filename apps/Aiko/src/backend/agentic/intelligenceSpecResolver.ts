// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO INTELLIGENCE SPEC RESOLVER & MODEL ROUTING GATEWAY ════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import { ModelProfileRequest, ModelCatalogEntry } from '../types.js';
import { IntelligenceSpec } from '../intelligence/types.js';
import { tensorToSpec, createDefaultIntelligenceSpec } from '../intelligence/helpers.js';
import { presetsStorage } from '../storage/presetsStorage.js';
import { DEFAULT_INTELLIGENCE_PRESETS } from '../intelligence/presets.js';
import { matchingEngine } from '../intelligence/matchingEngine.js';
import { modelCatalog } from '../modelCatalog.js';
import { ToolDefinition, FeatureDefinition } from '../types/tools.js';
import { AgentDefinition, SubAgentDefinition } from '../types/agentTypes.js';

export type AgentType = 'AIKO' | 'TOOL' | 'ENDPOINT';

export interface AgentResolutionContext {
  agentType: AgentType;
  explicitSpecId?: string;
  subAgentRole?: string;
  tool?: Partial<ToolDefinition>;
  feature?: Partial<FeatureDefinition>;
  agentDefinition?: AgentDefinition;
}

export interface ResolvedAgentModel {
  specId: string;
  spec: IntelligenceSpec;
  profile: ModelProfileRequest;
  resolvedModel?: ModelCatalogEntry | null;
  score?: number;
  subAgentRole?: string;
  subAgent?: SubAgentDefinition | null;
}

export class IntelligenceSpecResolver {
  public static resolveAgentModel(
    agentType: AgentType,
    context?: {
      explicitSpecId?: string;
      subAgentRole?: string;
      tool?: Partial<ToolDefinition>;
      feature?: Partial<FeatureDefinition>;
      agentDefinition?: AgentDefinition;
    }
  ): ResolvedAgentModel {
    const role = context?.subAgentRole;
    let specId: string | undefined = context?.explicitSpecId;
    let activeSubAgent: SubAgentDefinition | null = null;

    if (!specId && agentType === 'ENDPOINT') {
      const featAgent = context?.feature?.agent || context?.feature?.agentDefinition || context?.agentDefinition;
      if (featAgent && role && featAgent.subAgents?.[role]) {
        activeSubAgent = featAgent.subAgents[role] || null;
        specId = activeSubAgent?.intelligenceSpecId || featAgent.intelligenceSpecs?.[role];
      }
      if (!specId && featAgent) {
        specId = featAgent.intelligenceSpecId || (role ? featAgent.intelligenceSpecs?.[role] : undefined);
      }
      if (!specId) specId = context?.feature?.intelligenceSpecId;

      // Parent tool inheritance
      if (!specId) {
        const toolAgent = context?.tool?.agent || context?.tool?.agentDefinition;
        if (toolAgent && role && toolAgent.subAgents?.[role]) {
          activeSubAgent = activeSubAgent || toolAgent.subAgents[role] || null;
          specId = toolAgent.subAgents[role]?.intelligenceSpecId || toolAgent.intelligenceSpecs?.[role];
        }
        if (!specId && toolAgent) {
          specId = toolAgent.intelligenceSpecId || (role ? toolAgent.intelligenceSpecs?.[role] : undefined);
        }
        if (!specId) specId = context?.tool?.intelligenceSpecId;
      }

      if (!specId) {
        specId = role === 'router' ? 'preset-logic' : 'preset-code';
      }
    } else if (!specId && agentType === 'TOOL') {
      const toolAgent = context?.tool?.agent || context?.tool?.agentDefinition || context?.agentDefinition;
      if (toolAgent && role && toolAgent.subAgents?.[role]) {
        activeSubAgent = toolAgent.subAgents[role] || null;
        specId = activeSubAgent?.intelligenceSpecId || toolAgent.intelligenceSpecs?.[role];
      }
      if (!specId && toolAgent) {
        specId = toolAgent.intelligenceSpecId || (role ? toolAgent.intelligenceSpecs?.[role] : undefined);
      }
      if (!specId) specId = context?.tool?.intelligenceSpecId;
      if (!specId) {
        specId = role === 'router' ? 'preset-logic' : (role ? 'preset-code' : 'preset-agent');
      }
    } else if (!specId) {
      specId = 'preset-agent';
    }

    const { spec, profile, resolvedModel, score } = this.resolve(specId || 'preset-agent');

    if (activeSubAgent) {
      if (activeSubAgent.prioritiseReasoning !== undefined) {
        profile.prioritiseReasoning = activeSubAgent.prioritiseReasoning;
      }
      if (activeSubAgent.prioritiseDeterminism !== undefined) {
        profile.prioritiseDeterminism = activeSubAgent.prioritiseDeterminism;
      }
      if (activeSubAgent.avoidPaidProviders !== undefined) {
        profile.avoidPaidProviders = activeSubAgent.avoidPaidProviders;
      }
    }

    return {
      specId: specId || 'preset-agent',
      spec,
      profile,
      resolvedModel,
      score,
      subAgentRole: role,
      subAgent: activeSubAgent
    };
  }

  public static resolve(specId?: string): {
    spec: IntelligenceSpec;
    profile: ModelProfileRequest;
    resolvedModel: ModelCatalogEntry | null;
    score?: number;
  } {
    const targetId = specId || 'preset-agent';
    const preset = presetsStorage.getPresetById(targetId) ||
      DEFAULT_INTELLIGENCE_PRESETS.find(p => p.id === targetId) ||
      DEFAULT_INTELLIGENCE_PRESETS.find(p => p.id === 'preset-agent') ||
      DEFAULT_INTELLIGENCE_PRESETS[0];

    const spec = preset?.tensor
      ? tensorToSpec(preset.tensor)
      : createDefaultIntelligenceSpec({ reasoning: 9, planning: 9, toolUsage: 9.5, determinism: 9.5, jsonStrictness: 9.5 });

    const profile: ModelProfileRequest = {
      intelligenceSpec: spec,
      prioritiseReasoning: preset?.prioritiseReasoning ?? false,
      prioritiseDeterminism: preset?.prioritiseDeterminism ?? true,
      avoidPaidProviders: preset?.avoidPaidProviders ?? false
    };

    let resolvedModel: ModelCatalogEntry | null = null;
    let score: number | undefined = undefined;

    try {
      const rankResult = matchingEngine.rank(
        {
          intelligenceSpec: spec,
          prioritiseReasoning: profile.prioritiseReasoning,
          prioritiseDeterminism: profile.prioritiseDeterminism,
          avoidPaidProviders: profile.avoidPaidProviders
        },
        modelCatalog.getCatalog()
      );
      if (rankResult.winner) {
        const catEntry = modelCatalog.getCatalog().find(m => m.id === rankResult.winner?.modelId);
        resolvedModel = catEntry || null;
        score = rankResult.winner.finalScore;
      }
    } catch {
      // Graceful fallback to null if catalog uninitialized
    }

    return { spec, profile, resolvedModel, score };
  }
}
