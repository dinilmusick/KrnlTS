/**
 * ASCII Architecture Flowchart: profileSolver
 *
 *   ┌──────────────────────────────────┐
 *   │     Initialize profileSolver     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            breakdown             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          reasoningText           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           endpointSpec           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import { ModelCatalogEntry, ApiKeyEntry } from './types.js';
import { EndpointSpec, RankedCandidate, RankingResult } from './intelligence/types.js';
import { expandSimplifiedProfile } from './intelligence/helpers.js';
import { matchingEngine } from './intelligence/matchingEngine.js';
import { modelCatalog } from './modelCatalog.js';
import { keyStore } from './keyStore.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SolverResult {
  selectedModel: ModelCatalogEntry;
  selectedKey: ApiKeyEntry;
  compatibilityScore: number;
  reasoning: string;
  candidateRankings: RankedCandidate[];
  rankingResult: RankingResult;
}

export class ProfileSolverEngine {
  private buildSolverResult(
    model: ModelCatalogEntry,
    key: ApiKeyEntry,
    candidate: RankedCandidate,
    rankingResult: RankingResult
  ): SolverResult {
    const breakdown = candidate.breakdown;
    const reasoningText = [
      `Selected ${model.name} (${model.providerId.toUpperCase()}) - Score: ${candidate.finalScore}/100`,
      `BaseScore: ${breakdown.baseScore}`,
      `Dist: ${breakdown.distance}`,
      breakdown.downrankPenalty ? `DownrankPenalty: -${breakdown.downrankPenalty}` : '',
      breakdown.costPenalty ? `CostPenalty: -${breakdown.costPenalty}` : ''
    ].filter(Boolean).join(' | ');

    return {
      selectedModel: model,
      selectedKey: key,
      compatibilityScore: candidate.finalScore,
      reasoning: reasoningText,
      candidateRankings: rankingResult.candidates,
      rankingResult
    };
  }

  public solveProfile(profileReq: any): SolverResult | null {
    const endpointSpec: EndpointSpec = expandSimplifiedProfile(profileReq);
    const catalog = modelCatalog.getCatalog();
    
    // Evaluate 4-stage matching engine
    let rankingResult = matchingEngine.rank(endpointSpec, catalog);

    if (!rankingResult.candidates.length) {
      rankingResult = matchingEngine.rank({
        ...endpointSpec,
        blacklistedProviders: [],
        requiredContext: undefined
      }, catalog);
    }

    if (!rankingResult.candidates.length) {
      return null;
    }

    // Stage 1: Find the highest ranked model with a verified ACTIVE or CHECKING key
    for (const candidate of rankingResult.candidates) {
      const model = modelCatalog.getModelById(candidate.modelId);
      if (!model) continue;

      const key = keyStore.peekNextKey(model.providerId, model.id);
      if (key && (key.status === 'active' || key.status === 'checking')) {
        return this.buildSolverResult(model, key, candidate, rankingResult);
      }
    }

    // Stage 2: Fallback to any candidate model with any configured key in pool
    for (const candidate of rankingResult.candidates) {
      const model = modelCatalog.getModelById(candidate.modelId);
      if (!model) continue;

      const key = keyStore.peekNextKey(model.providerId, model.id);
      if (key) {
        return this.buildSolverResult(model, key, candidate, rankingResult);
      }
    }

    return null;
  }
}


// ════ PROFILESOLVER IMPLEMENTATION ════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const profileSolver = new ProfileSolverEngine();