/**
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

 * ASCII Architecture Flowchart: matchingEngine
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize matchingEngine     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │     Rank Candidate Models        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import {
  EndpointSpec,
  IntelligenceDimension,
  IntelligenceSpec,
  PreferencesSpec,
  RankedCandidate,
  RankingResult,
  CandidateStageBreakdown
} from './types.js';
import { ALL_INTELLIGENCE_DIMENSIONS, tensorToSpec } from './helpers.js';
import { ModelCatalogEntry } from '../types.js';

export class MatchingEngine {
  private catalog: ModelCatalogEntry[];

  constructor(catalog: ModelCatalogEntry[] = []) {
    this.catalog = catalog;
  }

  public matchCandidates(
    intelligenceSpec: IntelligenceSpec | number[],
    preferencesSpec: PreferencesSpec
  ): RankedCandidate[] {
    const spec = Array.isArray(intelligenceSpec) ? tensorToSpec(intelligenceSpec) : intelligenceSpec;
    const result = this.rank({
      intelligenceSpec: spec,
      preferencesSpec
    }, this.catalog);
    return result.candidates;
  }

  public rank(endpointSpec: EndpointSpec, catalog?: ModelCatalogEntry[]): RankingResult {
    const activeCatalog = catalog || this.catalog || [];
    const prefSpec = endpointSpec.preferencesSpec || {
      avoidPaid: Boolean(endpointSpec.avoidPaidProviders),
      prioritiseReasoning: Boolean(endpointSpec.prioritiseReasoning),
      prioritiseDeterminism: Boolean(endpointSpec.prioritiseDeterminism),
      enabledProviders: endpointSpec.enabledProviders || ['google', 'groq', 'cerebras', 'huggingface', 'openrouter', 'together', 'nvidia'],
      requiredContext: endpointSpec.requiredContext
    };

    const weights: Record<IntelligenceDimension, number> = ALL_INTELLIGENCE_DIMENSIONS.reduce((acc, dim) => {
      acc[dim] = 1.0;
      return acc;
    }, {} as Record<IntelligenceDimension, number>);

    if (prefSpec.prioritiseReasoning) {
      weights.reasoning = 2.0;
      weights.planning = 1.5;
    }
    if (prefSpec.prioritiseDeterminism) {
      weights.determinism = 2.0;
      weights.jsonStrictness = 1.5;
    }

    const blacklisted = new Set(endpointSpec.blacklistedProviders || []);
    const enabledProvidersSet = new Set(prefSpec.enabledProviders && prefSpec.enabledProviders.length > 0 ? prefSpec.enabledProviders : null);
    const rankedCandidates: RankedCandidate[] = [];

    let availableModels = activeCatalog.filter(m => {
      if ((m as any).status === 'offline') return false;
      if (blacklisted.has(m.providerId)) return false;
      if (enabledProvidersSet && !enabledProvidersSet.has(m.providerId)) {
        return false;
      }
      return true;
    });

    if (availableModels.length === 0) {
      availableModels = activeCatalog.filter(m => (m as any).status !== 'offline');
    }
    if (availableModels.length === 0) {
      availableModels = [...activeCatalog];
    }

    const reqContext = prefSpec.requiredContext ?? endpointSpec.requiredContext;
    if (reqContext) {
      const contextMatched = availableModels.filter(m => m.contextWindow >= reqContext);
      if (contextMatched.length > 0) {
        availableModels = contextMatched;
      }
    }

    for (const model of availableModels) {
      let weightedSumSquaredDiffs = 0;
      let totalWeights = 0;
      const dimensionDiffs: CandidateStageBreakdown['dimensionDiffs'] = {};

      for (const dim of ALL_INTELLIGENCE_DIMENSIONS) {
        const targetVal = endpointSpec.intelligenceSpec[dim] ?? 0;
        const modelVal = (model as any).intelligenceSpec ? ((model as any).intelligenceSpec[dim] ?? 0) : 0;
        const diff = targetVal - modelVal;
        
        const penaltyMultiplier = diff > 0 ? 1.5 : 1.0;
        const weight = weights[dim];

        dimensionDiffs[dim] = {
          target: targetVal,
          model: modelVal,
          diff,
          penaltyMultiplier
        };

        const adjustedDiff = diff * penaltyMultiplier;
        weightedSumSquaredDiffs += weight * (adjustedDiff * adjustedDiff);
        totalWeights += weight;
      }

      const distance = Math.sqrt(weightedSumSquaredDiffs / (totalWeights || 1));
      const baseScore = Math.max(0, Math.min(100, 100 - distance * 10));

      const downrankCount = (model as any).runtimeStats?.downrankCount || 0;
      const consecutiveFailures = (model as any).runtimeStats?.consecutiveRouteFailures || 0;
      const unavailabilityPenalty = (model as any).status === 'currently_unavailable' ? 25 : 0;
      const downrankPenalty = Math.min(50, (downrankCount * 5) + (consecutiveFailures * 3) + unavailabilityPenalty);
      const scoreAfterDownrank = baseScore - downrankPenalty;

      let costPenalty = 0;
      if (prefSpec.avoidPaid && (model.providerId === 'openrouter' || !(model as any).isFree)) {
        costPenalty = 20;
      }

      const rawFinalScore = scoreAfterDownrank - costPenalty;
      const finalScore = Math.max(1, Math.min(100, Math.round(rawFinalScore)));

      rankedCandidates.push({
        modelId: model.id,
        modelName: model.name,
        providerId: model.providerId,
        isFree: (model as any).isFree ?? true,
        finalScore,
        breakdown: {
          baseScore: Math.round(baseScore * 10) / 10,
          distance: Math.round(distance * 100) / 100,
          downrankPenalty,
          costPenalty,
          finalScore,
          isBlacklisted: false,
          dimensionDiffs
        }
      });
    }

    rankedCandidates.sort((a, b) => b.finalScore - a.finalScore);

    return {
      winner: rankedCandidates[0] || null,
      candidates: rankedCandidates,
      endpointSpec
    };
  }
}


// ════ MATCHINGENGINE IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const matchingEngine = new MatchingEngine();