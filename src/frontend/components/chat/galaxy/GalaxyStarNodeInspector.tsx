/**
 * ASCII Architecture Flowchart: GalaxyStarNodeInspector
 *
 *   ┌──────────────────────────────────┐
 *   │ Initialize GalaxyStarNodeInspector│
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Render Inspector Overlay Panel  │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { X, Key, Shield, Copy, Check, Star, RefreshCw } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { StarNode } from './types.js';
import { ApiKeyEntry } from '../../../../backend/types.js';

export interface GalaxyStarNodeInspectorProps {
  selectedNode: StarNode;
  selectedKeyEntry?: ApiKeyEntry;
  copiedKeyId?: string | null;
  onClose: () => void;
  onCopyKey: (key: string, id: string) => void;
  onSelectModelNode?: (node: StarNode) => void;
  onSetAsNextKey?: (node: StarNode) => void;
  onSetPermanentKey?: (node: StarNode) => void;
  onExploreKey?: (node: StarNode) => void;
  onResetProbabilities?: (node: StarNode) => void;
  onDisableKey?: (node: StarNode) => void;
}

export const GalaxyStarNodeInspector: React.FC<GalaxyStarNodeInspectorProps> = ({
  selectedNode,
  selectedKeyEntry,
  copiedKeyId,
  onClose,
  onCopyKey,
  onSetAsNextKey,
  onSetPermanentKey,
  onExploreKey
}) => {
  const isCopied = copiedKeyId === selectedNode.id;

  return (
    <div className="absolute right-4 top-4 z-20 w-80 p-4 rounded-xl border bg-[var(--skipo-surface,#1e293b)] border-[var(--skipo-border-color,#334155)] shadow-2xl text-[var(--skipo-text,#f8fafc)] select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--skipo-border-color)]">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[var(--skipo-accent,#6366f1)]" />
          <h3 className="font-mono font-bold text-xs uppercase tracking-wider">
            {(selectedNode.type || 'KEY').toUpperCase()}: {selectedNode.label}
          </h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--skipo-surface-hover)] rounded">
          <X size={14} />
        </button>
      </div>

      <div className="py-3 space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-[var(--skipo-text-muted)]">Provider:</span>
          <span className="font-bold">{selectedNode.providerId || 'System'}</span>
        </div>
        {selectedNode.status && (
          <div className="flex justify-between">
            <span className="text-[var(--skipo-text-muted)]">Status:</span>
            <span className="font-bold uppercase text-[var(--skipo-success,#10b981)]">{selectedNode.status}</span>
          </div>
        )}
        {selectedNode.latencyMs !== undefined && (
          <div className="flex justify-between">
            <span className="text-[var(--skipo-text-muted)]">Latency:</span>
            <span>{selectedNode.latencyMs}ms</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--skipo-border-color)] flex flex-col gap-1.5">
        {selectedKeyEntry && (
          <BaseButton
            size="sm"
            variant="secondary"
            onClick={() => onCopyKey(selectedKeyEntry.key, selectedNode.id)}
            icon={isCopied ? <Check size={13} /> : <Copy size={13} />}
          >
            {isCopied ? 'Key Copied!' : 'Copy API Key'}
          </BaseButton>
        )}

        {onSetAsNextKey && (
          <BaseButton size="sm" variant="accent" onClick={() => onSetAsNextKey(selectedNode)}>
            Set as Next Active
          </BaseButton>
        )}

        {onSetPermanentKey && (
          <BaseButton size="sm" variant="ghost" onClick={() => onSetPermanentKey(selectedNode)}>
            Set as Permanent
          </BaseButton>
        )}

        {onExploreKey && (
          <BaseButton size="sm" variant="ghost" onClick={() => onExploreKey(selectedNode)}>
            Inspect Key Logs
          </BaseButton>
        )}
      </div>
    </div>
  );
};

export default GalaxyStarNodeInspector;
