import React from 'react';
import type { UIAuthoringNode } from './types.js';
import { getAuthoringDepth } from './authoringModel.js';

export function UiAuthoringTree(props: {
  nodes: UIAuthoringNode[];
  selectedNodeId?: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {props.nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => props.onSelect(node.id)}
          className={`flex w-full items-center gap-2 border-b border-black/10 px-2 py-1.5 text-left text-xs ${props.selectedNodeId === node.id ? 'bg-black/10' : ''}`}
          style={{ paddingLeft: 8 + getAuthoringDepth(node, props.nodes) * 14 }}
        >
          <span className="font-semibold">{node.name}</span>
          <span className="ml-auto opacity-50">{node.kind}</span>
        </button>
      ))}
      {!props.nodes.length && <div className="p-4 text-xs opacity-60">No authored nodes.</div>}
    </div>
  );
}
