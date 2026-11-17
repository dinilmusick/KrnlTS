'use client';
import { useState, useMemo } from 'react';
import type { NodeDefinition } from '@floks/contracts';
import { ConnectionRuleStore } from '@floks/contracts';
import { useSearchKeyboardNavigation, BaseButton, BaseInput } from '@floks/ui';

export interface CompatibleNodePickerProps {
  x: number;
  y: number;
  sourceHandle: {
    nodeId: string;
    socketId: string;
    direction: 'input' | 'output';
    dataType?: string;
    label?: string;
  };
  availableNodeTypes?: NodeDefinition[];
  onSelect: (selectedTypes: string[]) => void;
  onClose: () => void;
}

export function CompatibleNodePicker({
  x,
  y,
  sourceHandle,
  availableNodeTypes,
  onSelect,
  onClose
}: CompatibleNodePickerProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const compatibleNodes = useMemo(() => {
    const isOut = sourceHandle.direction === 'output';
    return ConnectionRuleStore.getCompatibleNodeTypes(
      { dataType: sourceHandle.dataType || 'ANY', direction: isOut ? 'OUTPUT' : 'INPUT', handleCategory: 'DATA' },
      availableNodeTypes
    );
  }, [sourceHandle, availableNodeTypes]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return compatibleNodes;
    const term = searchTerm.toLowerCase();
    return compatibleNodes.filter(n => n.type.toLowerCase().includes(term) || n.label.toLowerCase().includes(term));
  }, [compatibleNodes, searchTerm]);

  const handleQuickSelect = (type: string) => onSelect([type]);

  const { highlightedIndex, setHighlightedIndex, handleKeyDown, listContainerRef } = useSearchKeyboardNavigation<NodeDefinition>({
    items: filteredNodes,
    onSelect: (node) => handleQuickSelect(node.type),
    onClose
  });

  const toggleSelect = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: 'translate(-50%, 0)', width: '270px', maxHeight: '360px',
        backgroundColor: 'var(--skipo-surface)', border: 'var(--skipo-border)', borderRadius: 'var(--skipo-radius)',
        boxShadow: 'var(--skipo-shadow)', color: 'var(--skipo-text)', zIndex: 50, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', fontFamily: 'var(--skipo-font)'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '8px 12px', borderBottom: 'var(--skipo-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--skipo-matte-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--skipo-accent)' }}>Compatible Nodes</span>
          <span style={{ fontSize: '9px', color: 'var(--skipo-text-muted)' }}>For {sourceHandle.dataType || 'ANY'} ({sourceHandle.direction})</span>
        </div>
        <BaseButton variant="ghost" size="sm" onClick={onClose} aria-label="Close picker" style={{ padding: '2px 6px' }}>✕</BaseButton>
      </div>

      <div style={{ padding: '6px 8px', borderBottom: 'var(--skipo-border)' }}>
        <BaseInput autoFocus placeholder="Filter nodes... (↑↓ navigate, ↵ spawn)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} />
      </div>

      <div ref={listContainerRef} style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', padding: '4px' }}>
        {filteredNodes.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--skipo-text-muted)' }}>No compatible nodes found</div>
        ) : (
          filteredNodes.map((node, idx) => {
            const isSelected = selectedTypes.has(node.type);
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={node.type}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => toggleSelect(node.type)}
                onDoubleClick={() => handleQuickSelect(node.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: 'var(--skipo-radius-sm)', cursor: 'pointer',
                  backgroundColor: isHighlighted ? 'var(--skipo-surface-hover)' : isSelected ? 'var(--skipo-matte-bg)' : 'transparent',
                  border: isHighlighted ? 'var(--skipo-border)' : '1px solid transparent', marginBottom: '2px', transition: 'background-color 0.1s ease'
                }}
              >
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(node.type)} onClick={(e) => e.stopPropagation()} style={{ cursor: 'pointer' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: isHighlighted ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isHighlighted ? 'var(--skipo-accent)' : 'inherit' }}>
                    {node.label || node.type}
                  </div>
                  {node.description && (
                    <div style={{ fontSize: '9px', color: 'var(--skipo-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.description}</div>
                  )}
                </div>
                {isHighlighted && (
                  <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--skipo-accent)', padding: '1px 4px', borderRadius: 'var(--skipo-radius-sm)', backgroundColor: 'var(--skipo-matte-bg)', border: 'var(--skipo-border)', whiteSpace: 'nowrap' }}>
                    ↵ Enter
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '6px 8px', borderTop: 'var(--skipo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--skipo-matte-bg)' }}>
        <span style={{ fontSize: '10px', color: 'var(--skipo-text-muted)' }}>{selectedTypes.size > 0 ? `${selectedTypes.size} selected` : '↵ Spawn top match'}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <BaseButton variant="secondary" size="sm" onClick={onClose} style={{ padding: '2px 8px', fontSize: '10px' }}>Cancel</BaseButton>
          <BaseButton
            variant="accent" size="sm"
            disabled={selectedTypes.size === 0 && filteredNodes.length === 0}
            onClick={() => {
              if (selectedTypes.size > 0) onSelect(Array.from(selectedTypes));
              else if (filteredNodes.length > 0) handleQuickSelect(filteredNodes[highlightedIndex >= 0 ? highlightedIndex : 0].type);
            }}
            style={{ padding: '2px 10px', fontSize: '10px' }}
          >
            Spawn & Solidify
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
