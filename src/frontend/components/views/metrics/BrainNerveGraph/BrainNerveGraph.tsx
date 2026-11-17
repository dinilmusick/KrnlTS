/**
 * ASCII Architecture Flowchart: BrainNerveGraph
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize BrainNerveGraph    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         BrainNerveGraph          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            currentLog            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │              nodes               │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useState } from 'react';
import { RequestLogEntry } from '../../../../types/app.js';
import { Brain, Zap, History } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { TimelineScrubber } from '../TimelineScrubber.js';
import { StarryCanvas } from './StarryCanvas.js';
import { BrainNerveGraphProps, GraphNode, GraphEdge } from './types.js';


// ════ BRAINNERVEGRAPH IMPLEMENTATION ══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const BrainNerveGraph: React.FC<BrainNerveGraphProps> = ({ logs }) => {
  const [timelineIndex, setTimelineIndex] = useState<number>(logs.length > 0 ? logs.length - 1 : 0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const currentLog: RequestLogEntry | undefined = logs[timelineIndex] || logs[logs.length - 1];

  const nodes: GraphNode[] = [
    { id: 'client', label: 'Client App', type: 'client', x: 80, y: 190 },
    { id: 'gateway', label: 'AIKO Gateway', type: 'model', x: 280, y: 190 },
    { id: 'model', label: currentLog?.modelId || 'Gemini 2.5 Flash', type: 'model', x: 500, y: 120 },
    { id: 'mcp-tool', label: 'MCP Tools', type: 'tool', x: 500, y: 260 }
  ];

  const edges: GraphEdge[] = [
    { id: 'e1', fromId: 'client', toId: 'gateway', type: 'request', active: Boolean(currentLog), opacity: 0.8 },
    { id: 'e2', fromId: 'gateway', toId: 'model', type: 'request', active: Boolean(currentLog), opacity: 0.9 },
    { id: 'e3', fromId: 'gateway', toId: 'mcp-tool', type: 'tool-call', active: Boolean(currentLog?.toolCallsCount), opacity: 0.7 }
  ];

  return (
    <div className="relative w-full rounded-2xl bg-[var(--skipo-card-bg,#1e293b)] border border-[var(--skipo-border,#334155)] p-6 overflow-hidden">
      <StarryCanvas />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--skipo-primary,#3b82f6)]/10 border border-[var(--skipo-primary,#3b82f6)]/20">
            <Brain className="w-5 h-5 text-[var(--skipo-primary,#3b82f6)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--skipo-text,#f8fafc)]">Neural Execution Graph</h3>
            <p className="text-xs text-[var(--skipo-muted,#94a3b8)]">Real-time routing & MCP tool invocation trace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BaseButton variant="secondary" onClick={() => setTimelineIndex(Math.max(0, logs.length - 1))}>
            <Zap className="w-4 h-4 mr-1.5" />
            Live Trace
          </BaseButton>
        </div>
      </div>

      <div className="relative z-10 h-64 w-full bg-[var(--skipo-bg,#0f172a)]/60 rounded-xl border border-[var(--skipo-border,#334155)]/50 p-4 flex items-center justify-around">
        {nodes.map(node => (
          <div
            key={node.id}
            onClick={() => setSelectedNodeId(node.id)}
            className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${
              selectedNodeId === node.id
                ? 'bg-[var(--skipo-primary,#3b82f6)]/20 border-[var(--skipo-primary,#3b82f6)] text-white shadow-lg'
                : 'bg-[var(--skipo-card-bg,#1e293b)]/80 border-[var(--skipo-border,#334155)] text-[var(--skipo-text,#f8fafc)] hover:border-[var(--skipo-primary,#3b82f6)]/50'
            }`}
          >
            <div className="text-xs font-medium text-[var(--skipo-muted,#94a3b8)] uppercase tracking-wider mb-1">{node.type}</div>
            <div className="text-sm font-semibold">{node.label}</div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="relative z-10 mt-6 pt-4 border-t border-[var(--skipo-border,#334155)]">
          <div className="flex items-center gap-2 mb-3 text-xs text-[var(--skipo-muted,#94a3b8)] font-medium">
            <History className="w-4 h-4" />
            Execution Timeline Scrubber
          </div>
          <TimelineScrubber
            logs={logs}
            currentIndex={timelineIndex}
            onChange={setTimelineIndex}
          />
        </div>
      )}
    </div>
  );
};

export default BrainNerveGraph;