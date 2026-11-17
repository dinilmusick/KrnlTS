'use client';
import { FloatingDetailsPanel, BaseInput, BaseBadge } from '@floks/ui';
import type { GraphNode, Socket } from '@floks/contracts';

export interface NodeDetailsPanelProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onUpdateNode?: (nodeId: string, updates: Partial<GraphNode>) => void;
  storageKey?: string;
}

function renderSockets(sockets: Socket[] | undefined, type: 'Input' | 'Output') {
  if (!sockets || sockets.length === 0) return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: 'var(--skipo-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
        {type} Sockets ({sockets.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sockets.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--skipo-surface)', borderRadius: 'var(--skipo-radius-sm)', fontSize: '12px' }}>
            <span>{s.label || s.id}</span>
            {s.dataType && <BaseBadge variant="neutral">{s.dataType}</BaseBadge>}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderNodeContent(node: GraphNode, onUpdateNode?: (nodeId: string, updates: Partial<GraphNode>) => void) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--skipo-text-muted)', marginBottom: '4px' }}>Label</label>
        <BaseInput
          value={node.label}
          onChange={(e) => onUpdateNode?.(node.id, { label: e.target.value })}
        />
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--skipo-text-muted)' }}>
        <div>Position: X: {Math.round(node.position.x)}, Y: {Math.round(node.position.y)}</div>
      </div>
      {renderSockets(node.inputs, 'Input')}
      {renderSockets(node.outputs, 'Output')}
      {node.data && Object.keys(node.data).length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--skipo-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Custom Data</div>
          <pre style={{ margin: 0, padding: '8px', background: 'var(--skipo-surface)', borderRadius: 'var(--skipo-radius-sm)', fontSize: '11px', color: 'var(--skipo-text)', overflowX: 'auto' }}>
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function NodeDetailsPanel({
  node,
  isOpen,
  onClose,
  isPinned = false,
  onTogglePin,
  onUpdateNode,
  storageKey = 'skipo:node-graph:details-panel'
}: NodeDetailsPanelProps) {
  if (!isOpen || !node) return null;

  return (
    <FloatingDetailsPanel
      title={node.label || 'Node Details'}
      subtitle={`Type: ${node.type} • ID: ${node.id}`}
      isOpen={isOpen}
      onClose={onClose}
      isPinned={isPinned}
      onTogglePin={onTogglePin}
      storageKey={storageKey}
    >
      {renderNodeContent(node, onUpdateNode)}
    </FloatingDetailsPanel>
  );
}
