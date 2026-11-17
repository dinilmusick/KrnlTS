/**
 * ASCII Architecture Flowchart: GalaxyOverlays
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize GalaxyOverlays     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          GalaxyOverlays          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { ApiKeyEntry, ProviderId, RotationStrategy } from '../../../../backend/types.js';
import { StarNode, SubNode, ContextMenuState } from '../galaxy/types.js';
import { GalaxyHoverTooltip } from '../galaxy/GalaxyHoverTooltip.js';
import { GalaxyContextMenu } from '../galaxy/GalaxyContextMenu.js';
import { GalaxyStarNodeInspector } from '../galaxy/GalaxyStarNodeInspector.js';
import { GalaxyFaultedSubNodeInspector } from '../galaxy/GalaxyFaultedSubNodeInspector.js';
import { GalaxyAddKeyModal } from '../galaxy/GalaxyAddKeyModal.js';
import { apiClient } from '../../../../libraries/apiClient.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface GalaxyOverlaysProps {
  hoveredNode: StarNode | null;
  hoveredSubNode: SubNode | null;
  selectedNode: StarNode | null;
  selectedSubNode: SubNode | null;
  contextMenu: ContextMenuState | null;
  keys: ApiKeyEntry[];
  nodes: StarNode[];
  copiedKeyId: string | null;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  setSelectedNode: (node: StarNode | null) => void;
  setSelectedSubNode: (sub: SubNode | null) => void;
  setContextMenu: (ctx: ContextMenuState | null) => void;
  onCopyKey: (val: string, id: string) => void;
  onSelectModelNode?: (modelId: string) => void;
  onSetNextKey?: (keyId: string) => void;
  onSetPermanentKey?: (keyId: string | null) => void;
  onExploreKey?: (keyId: string) => void;
  onToggleKeyStatus?: (keyId: string, disabled: boolean) => void;
  onRefreshKeys?: () => void;
  strategy?: RotationStrategy;
  onSetStrategy?: (strategy: RotationStrategy) => void;
}


// ════ GALAXYOVERLAYS IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const GalaxyOverlays: React.FC<GalaxyOverlaysProps> = ({
  hoveredNode,
  hoveredSubNode,
  selectedNode,
  selectedSubNode,
  contextMenu,
  keys,
  nodes,
  copiedKeyId,
  showAddModal,
  setShowAddModal,
  setSelectedNode,
  setSelectedSubNode,
  setContextMenu,
  onCopyKey,
  onSelectModelNode,
  onSetNextKey,
  onSetPermanentKey,
  onExploreKey,
  onToggleKeyStatus,
  onRefreshKeys
}) => {
  return (
    <div onWheel={(e) => e.stopPropagation()} className="overscroll-contain">
      {hoveredNode && !selectedNode && (
        <GalaxyHoverTooltip hoveredNode={hoveredNode} hoveredSubNode={hoveredSubNode} keys={keys} />
      )}

      {contextMenu && (
        <GalaxyContextMenu
          contextMenu={contextMenu}
          onClose={() => setContextMenu(null)}
          onSelectModelNode={(node) => { onSelectModelNode?.(node.label || node.id); setContextMenu(null); }}
          onSetAsNextKey={(node) => { onSetNextKey?.(node.id); setContextMenu(null); }}
          onSetPermanentKey={(node) => { onSetPermanentKey?.(node.isPermanent ? null : node.id); setContextMenu(null); }}
          onExploreKey={(node) => { onExploreKey?.(node.id); setContextMenu(null); }}
          onResetProbabilities={() => setContextMenu(null)}
          onDisableKey={(node) => { onToggleKeyStatus?.(node.id, true); setContextMenu(null); }}
        />
      )}

      {selectedNode && (
        <GalaxyStarNodeInspector
          selectedNode={selectedNode}
          selectedKeyEntry={keys.find(k => k.id === selectedNode.id)}
          copiedKeyId={copiedKeyId}
          onClose={() => setSelectedNode(null)}
          onCopyKey={onCopyKey}
          onSelectModelNode={(node) => onSelectModelNode?.(node.id)}
          onSetAsNextKey={(node) => onSetNextKey?.(node.id)}
          onSetPermanentKey={(node) => onSetPermanentKey?.(node.isPermanent ? null : node.id)}
          onExploreKey={(node) => onExploreKey?.(node.id)}
          onResetProbabilities={() => setSelectedNode(null)}
          onDisableKey={(node) => onToggleKeyStatus?.(node.id, true)}
        />
      )}

      {selectedSubNode && (
        <GalaxyFaultedSubNodeInspector
          selectedSubNode={selectedSubNode}
          keys={keys}
          nodes={nodes}
          onClose={() => setSelectedSubNode(null)}
          onResetProbabilities={() => setSelectedSubNode(null)}
        />
      )}

      {showAddModal && (
        <GalaxyAddKeyModal
          onClose={() => setShowAddModal(false)}
          onAddKey={async (providerId, email, keyVal) => {
            await apiClient.addKey({ providerId, label: email, key: keyVal });
            onRefreshKeys?.();
          }}
        />
      )}
    </div>
  );
};