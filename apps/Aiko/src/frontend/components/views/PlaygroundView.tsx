/**
 * ASCII Architecture Flowchart: PlaygroundView
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize PlaygroundView     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          PlaygroundView          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         evaluateMatching         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │               res                │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Sliders, Send, Zap, RefreshCw, Award } from 'lucide-react';
import { NeoViewContainer } from '../common/NeoViewContainer.js';
import { NeoButton } from '../common/NeoButton.js';
import { BaseTextarea } from '@ultrst-armada/floks';
import { apiClient } from '../../../libraries/apiClient.js';
import { IntelligenceSpecEditor } from './intelligence/IntelligenceSpecEditor.js';
import { createDefaultIntelligenceSpec } from '../../../libraries/intelligenceDefaults.js';
import type { IntelligenceSpec, RankedCandidate } from '../../../libraries/intelligenceContracts.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface PlaygroundViewProps {
  onCloseToGraph: () => void;
}


// ════ PLAYGROUNDVIEW IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ onCloseToGraph }) => {
  const [intelSpec, setIntelSpec] = useState<IntelligenceSpec>(createDefaultIntelligenceSpec({
    reasoning: 8, planning: 8, toolUsage: 8, coding: 8, structuredOutput: 8, jsonStrictness: 8
  }));

  const [prioritiseReasoning, setPrioritiseReasoning] = useState(true);
  const [prioritiseDeterminism, setPrioritiseDeterminism] = useState(false);
  const [preferLocal, setPreferLocal] = useState(false);
  const [avoidPaidProviders, setAvoidPaidProviders] = useState(false);

  const [prompt, setPrompt] = useState('Evaluate intelligence specification ranking performance.');
  const [loading, setLoading] = useState(false);
  const [rankingCandidates, setRankingCandidates] = useState<RankedCandidate[]>([]);
  const [winner, setWinner] = useState<RankedCandidate | null>(null);
  const [output, setOutput] = useState<string | null>(null);

  const evaluateMatching = async () => {
    try {
      const res = await apiClient.rankMatching({
        intelligenceSpec: intelSpec,
        prioritiseReasoning,
        prioritiseDeterminism,
        preferLocal,
        avoidPaidProviders
      });
      if (res.success && res.ranking) {
        setRankingCandidates(res.ranking.candidates || []);
        setWinner(res.ranking.winner || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    evaluateMatching();
  }, [intelSpec, prioritiseReasoning, prioritiseDeterminism, preferLocal, avoidPaidProviders]);

  const handleExecute = async () => {
    setLoading(true);
    setOutput(null);
    try {
      const res = await apiClient.generate({
        intelligenceSpec: intelSpec,
        prioritiseReasoning,
        prioritiseDeterminism,
        preferLocal,
        avoidPaidProviders
      }, prompt);

      if (res.success) {
        setOutput(res.data.content);
      } else {
        setOutput(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeoViewContainer titleIcon={Sliders} onCloseToGraph={onCloseToGraph}>
      <div className="space-y-3 font-mono text-xs">
        {/* 15 Intelligence Parameters Editor */}
        <IntelligenceSpecEditor
          spec={intelSpec}
          onChange={setIntelSpec}
          prioritiseReasoning={prioritiseReasoning}
          onToggleReasoning={setPrioritiseReasoning}
          prioritiseDeterminism={prioritiseDeterminism}
          onToggleDeterminism={setPrioritiseDeterminism}
          preferLocal={preferLocal}
          onTogglePreferLocal={setPreferLocal}
          avoidPaidProviders={avoidPaidProviders}
          onToggleAvoidPaid={setAvoidPaidProviders}
        />

        {/* Winner Route Banner */}
        {winner && (
          <div className="p-2.5 rounded-md border-2 border-emerald-600 bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 flex items-center justify-between shadow-[2px_2px_0px_0px_#000]">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-emerald-600" />
              <span className="font-bold">MATCH WINNER: {winner.modelName} ({winner.providerId.toUpperCase()})</span>
            </div>
            <span className="font-black text-emerald-700 dark:text-emerald-300">{winner.finalScore}/100</span>
          </div>
        )}

        {/* Execution Prompt & Action */}
        <div className="space-y-2 font-mono text-xs pt-1">
          <BaseTextarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={2}
            className="w-full font-mono text-xs"
            placeholder="Enter prompt to execute via winning route..."
          />

          <div className="flex justify-end">
            <NeoButton
              icon={Send}
              tooltipText="Execute Prompt via Winning Route"
              onClick={handleExecute}
              disabled={loading || !winner}
              variant="primary"
              size="sm"
            />
          </div>

          {output && (
            <div className="p-3 rounded border-2 border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs space-y-1.5 max-h-52 overflow-y-auto">
              <div className="font-bold text-indigo-400 border-b border-slate-800 pb-1">Response ({winner?.modelName}):</div>
              <div className="whitespace-pre-wrap">{output}</div>
            </div>
          )}
        </div>
      </div>
    </NeoViewContainer>
  );
};