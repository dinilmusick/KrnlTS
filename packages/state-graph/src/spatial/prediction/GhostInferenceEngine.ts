import type { GraphNode, Socket } from '../../types.js';
import type { NodeDefinition } from '../../domain/BaseNode.js';
import { ConnectionRuleStore } from '../../rules/ConnectionRuleStore.js';
import type { GhostCandidate, GhostInferenceOptions, GhostSocketMapping } from './types.js';

export class GhostInferenceEngine {
  public static inferNextNodes(
    selectedNodes: GraphNode[],
    allNodeDefs: NodeDefinition[],
    options: GhostInferenceOptions = {}
  ): GhostCandidate[] {
    if (selectedNodes.length === 0 || allNodeDefs.length === 0) {
      return [];
    }

    const scenarioCount = Math.max(1, options.scenarioCount ?? 3);
    const maxSuggestions = options.maxSuggestionsPerNode ?? 2;
    const candidates: GhostCandidate[] = [];

    for (const sourceNode of selectedNodes) {
      const outputSockets = sourceNode.outputs ?? [];
      if (outputSockets.length === 0) continue;

      const scoredDefs: Array<{
        def: NodeDefinition;
        mappings: GhostSocketMapping[];
        score: number;
      }> = [];

      for (const def of allNodeDefs) {
        if (def.type === sourceNode.type) continue;
        const mappings = this.resolveSocketMappings(outputSockets, def);
        if (mappings.length === 0) continue;

        let score = mappings.length * 10;
        if (options.customScorer) {
          score += options.customScorer(sourceNode.type, def.type);
        } else {
          score += this.computeAffinityScore(sourceNode.type, def.type);
        }

        scoredDefs.push({ def, mappings, score });
      }

      scoredDefs.sort((a, b) => b.score - a.score);

      for (let sIdx = 0; sIdx < scenarioCount; sIdx++) {
        const slice = scoredDefs.slice(sIdx * maxSuggestions, (sIdx + 1) * maxSuggestions);
        for (let i = 0; i < slice.length; i++) {
          const match = slice[i];
          const yOffset = (i - (slice.length - 1) / 2) * 140;
          candidates.push({
            id: `ghost-${sourceNode.id}-${match.def.type}-s${sIdx}-${i}`,
            nodeType: match.def.type,
            label: match.def.label || match.def.type,
            scenarioIndex: sIdx,
            score: match.score,
            sourceNodeId: sourceNode.id,
            socketMappings: match.mappings,
            relativeOffset: { x: 260, y: yOffset }
          });
        }
      }
    }

    return candidates;
  }

  private static resolveSocketMappings(
    sourceOutputs: Socket[],
    targetDef: NodeDefinition
  ): GhostSocketMapping[] {
    const mappings: GhostSocketMapping[] = [];
    const targetInputs = targetDef.inputs ?? [];

    for (const outSocket of sourceOutputs) {
      const matchingInput = targetInputs.find(inp => {
        return ConnectionRuleStore.canConnect(
          { dataType: outSocket.dataType || 'ANY', direction: 'OUTPUT', handleCategory: 'DATA' },
          { dataType: inp.dataType || 'ANY', direction: 'INPUT', handleCategory: 'DATA' }
        );
      });

      if (matchingInput) {
        const resolution = ConnectionRuleStore.resolve(
          { dataType: outSocket.dataType || 'ANY', direction: 'OUTPUT', handleCategory: 'DATA' },
          { dataType: matchingInput.dataType || 'ANY', direction: 'INPUT', handleCategory: 'DATA' }
        );
        mappings.push({
          sourceSocketId: outSocket.id,
          targetSocketId: matchingInput.id,
          wireType: resolution.wireType || 'DEFAULT'
        });
      }
    }

    return mappings;
  }

  private static computeAffinityScore(sourceType: string, targetType: string): number {
    const s = sourceType.toLowerCase();
    const t = targetType.toLowerCase();
    if ((s.includes('source') || s.includes('input')) && (t.includes('process') || t.includes('filter'))) return 15;
    if ((s.includes('process') || s.includes('filter')) && (t.includes('sink') || t.includes('output'))) return 15;
    if (s.includes('audio') && t.includes('audio')) return 12;
    if (s.includes('data') && t.includes('data')) return 10;
    return 5;
  }
}
