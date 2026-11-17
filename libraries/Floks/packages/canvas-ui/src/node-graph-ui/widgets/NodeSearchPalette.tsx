'use client';
import { useState, useMemo } from 'react';
import type { NodeDefinition } from '@floks/contracts';
import { ConnectionRuleStore } from '@floks/contracts';
import { useSearchKeyboardNavigation, BaseButton, BaseInput } from '@floks/ui';

export interface NodeSearchPaletteProps {
  x: number;
  y: number;
  availableNodeTypes?: NodeDefinition[];
  onSpawnNode: (type: string) => void;
  onClose: () => void;
}

type MenuNode = NodeDefinition & {
  category?: string;
  hidden?: boolean;
  menu?: { visible?: boolean };
};

export function menuCategory(node: MenuNode): string {
  return node.category || String(node.metadata?.category ?? 'Other');
}

export function menuHidden(node: MenuNode): boolean {
  return node.hidden === true || node.menu?.visible === false || node.metadata?.menuHidden === true;
}

export function NodeSearchPalette({
  x,
  y,
  availableNodeTypes = [],
  onSpawnNode,
  onClose
}: NodeSearchPaletteProps) {
  const [query, setQuery] = useState('');

  const nodes = useMemo<MenuNode[]>(() => {
    const registered = availableNodeTypes.length > 0
      ? availableNodeTypes
      : ConnectionRuleStore.listNodeTypes();
    return registered.filter((node) => !menuHidden(node as MenuNode)) as MenuNode[];
  }, [availableNodeTypes]);

  const filteredNodes = useMemo(() => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes.filter(
      n => n.type.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        menuCategory(n).toLowerCase().includes(q)
    );
  }, [nodes, query]);

  const groupedNodes = useMemo(() => {
    const groups = new Map<string, MenuNode[]>();
    for (const node of filteredNodes) {
      const category = menuCategory(node);
      const group = groups.get(category) ?? [];
      group.push(node);
      groups.set(category, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredNodes]);

  const {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    listContainerRef
  } = useSearchKeyboardNavigation<MenuNode>({
    items: filteredNodes,
    onSelect: (node) => {
      onSpawnNode(node.type);
      onClose();
    },
    onClose
  });

  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: 'translate(-50%, 0)',
        width: '310px', maxHeight: '430px', backgroundColor: 'var(--skipo-surface)',
        border: 'var(--skipo-border)', borderRadius: 'var(--skipo-radius)',
        boxShadow: 'var(--skipo-shadow)', color: 'var(--skipo-text)', zIndex: 70,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--skipo-font)'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '10px 12px', borderBottom: 'var(--skipo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--skipo-matte-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--skipo-accent)' }}>Spawn Node</span>
          <span style={{ fontSize: '9px', color: 'var(--skipo-text-muted)', fontFamily: 'var(--skipo-font-mono)', backgroundColor: 'var(--skipo-surface)', padding: '1px 4px', borderRadius: 'var(--skipo-radius-sm)' }}>hotkey [N]</span>
        </div>
        <BaseButton variant="ghost" size="sm" onClick={onClose} aria-label="Close search" style={{ padding: '2px 6px', fontSize: '12px' }}>✕</BaseButton>
      </div>

      <div style={{ padding: '8px', borderBottom: 'var(--skipo-border)' }}>
        <BaseInput autoFocus placeholder="Search nodes or categories... (↑↓, ↵ spawn)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
      </div>

      <div ref={listContainerRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '270px', padding: '4px 6px' }}>
        {filteredNodes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--skipo-text-muted)' }}>No matching nodes</div>
        ) : (
          groupedNodes.map(([category, categoryNodes]) => (
            <div key={category}>
              <div style={{ padding: '6px 8px 3px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skipo-text-muted)' }}>
                {category}
              </div>
              {categoryNodes.map((node) => {
                const idx = filteredNodes.findIndex((candidate) => candidate.type === node.type);
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={node.type}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => { onSpawnNode(node.type); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 'var(--skipo-radius-sm)', cursor: 'pointer',
                      backgroundColor: isHighlighted ? 'var(--skipo-surface-hover)' : 'transparent',
                      border: isHighlighted ? 'var(--skipo-border)' : '1px solid transparent',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: isHighlighted ? 600 : 500, color: isHighlighted ? 'var(--skipo-accent)' : 'inherit' }}>
                        {node.label || node.type}
                      </div>
                      {node.description && <div style={{ fontSize: '9px', color: 'var(--skipo-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.description}</div>}
                    </div>
                    {isHighlighted && <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--skipo-accent)', marginLeft: '6px' }}>↵ Spawn</span>}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '6px 10px', borderTop: 'var(--skipo-border)', backgroundColor: 'var(--skipo-matte-bg)', fontSize: '9px', color: 'var(--skipo-text-muted)' }}>
        <span>{filteredNodes.length} visible nodes</span>
        <span style={{ float: 'right' }}>Enter ↵ to spawn</span>
      </div>
    </div>
  );
}
