import React from 'react';
import { GitBranch, Network } from 'lucide-react';
import { TilesMenu, type FrnlTileRecord } from '../tiles/TilesMenu.js';
import { frnlNodeGraph, type FrnlNodeGraphNode, type FrnlNodeGraphEdge } from '../../frnl/frnlNodeGraph.js';
import { frnlForceGraph, type FrnlForceGraphNode, type FrnlForceGraphLink } from '../../frnl/frnlForceGraph.js';

export const GRAPHS_MENU_REQUIRED_SERVICES = ['workspace'] as const;

export interface GraphRecord extends FrnlTileRecord {
  kind?: 'editable' | 'force';
  nodes?: FrnlNodeGraphNode[];
  edges?: FrnlNodeGraphEdge[];
  links?: FrnlForceGraphLink[];
}

export interface GraphsMenuProps {
  graphs: GraphRecord[];
  onSelectGraph: (graph: GraphRecord) => void;
  onCreateGraph?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function GraphsMenu({ graphs, onSelectGraph, onCreateGraph, loading, error }: GraphsMenuProps) {
  const ForceGraph = frnlForceGraph;
  const NodeGraph = frnlNodeGraph;
  return <TilesMenu
    id="graphsMenu"
    title="Graphs"
    subtitle="Reusable graph workspaces backed by the canonical FRNL graph components."
    tiles={graphs}
    loading={loading}
    error={error}
    createLabel="NEW GRAPH"
    onSelect={onSelectGraph}
    onCreate={onCreateGraph}
    renderTile={(graph) => (
      <>
        <div className="flex items-center gap-2 text-xs font-black uppercase">
          {graph.kind === 'force' ? <Network size={15} /> : <GitBranch size={15} />}
          {graph.title}
        </div>
        <p className="mt-2 text-[11px] text-[var(--skipo-text-muted)]">{graph.description}</p>
        <div className="mt-3 h-28 border border-[var(--skipo-border-color)] overflow-hidden">
          {graph.kind === 'force'
            ? <ForceGraph nodes={(graph.nodes as FrnlForceGraphNode[]) ?? []} links={graph.links ?? []} width={420} height={150} />
            : <NodeGraph nodes={graph.nodes ?? []} edges={graph.edges ?? []} editable={false} showControls={false} showMiniMap={false} />}
        </div>
      </>
    )}
  />;
}
