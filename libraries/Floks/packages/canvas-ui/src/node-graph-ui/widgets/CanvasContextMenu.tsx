'use client';
import type React from 'react';
import type { NodeDefinition } from '@floks/contracts';

export interface CanvasContextMenuProps {
  x: number;
  y: number;
  availableNodeTypes?: NodeDefinition[];
  hasSelection: boolean;
  onSpawnNode: (type: string) => void;
  onOpenSpawnMenu?: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onClose: () => void;
}

export function CanvasContextMenu({
  x,
  y,
  availableNodeTypes,
  hasSelection,
  onSpawnNode,
  onOpenSpawnMenu,
  onSelectAll,
  onDeleteSelected,
  onClearSelection,
  onClose
}: CanvasContextMenuProps) {
  const itemStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: 'var(--skipo-text, #fff)',
    borderRadius: '4px',
    userSelect: 'none'
  };

  const shortcutStyle: React.CSSProperties = {
    fontSize: '9px',
    color: 'var(--skipo-text-muted, #888)',
    fontFamily: 'monospace'
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        minWidth: '180px',
        backgroundColor: 'var(--skipo-surface, #1e1e1e)',
        border: '1px solid var(--skipo-border, #333)',
        borderRadius: '6px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
        padding: '4px',
        zIndex: 60,
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Node Spawn Section / Tile Menu */}
      {onOpenSpawnMenu && (
        <div
          style={{
            ...itemStyle,
            fontWeight: 600,
            color: 'var(--skipo-accent, #61afef)',
            backgroundColor: 'rgba(97, 175, 239, 0.08)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(97, 175, 239, 0.16)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(97, 175, 239, 0.08)')}
          onClick={() => {
            onOpenSpawnMenu();
            onClose();
          }}
        >
          <span>Spawn Node Menu...</span>
          <span style={shortcutStyle}>N</span>
        </div>
      )}
      <div style={{ padding: '4px 8px', fontSize: '9px', textTransform: 'uppercase', color: 'var(--skipo-text-muted, #888)', fontWeight: 600 }}>
        Quick Spawn
      </div>
      <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
        {(!availableNodeTypes || availableNodeTypes.length === 0) ? (
          <div
            style={itemStyle}
            onClick={() => {
              onSpawnNode('default');
              onClose();
            }}
          >
            <span>Default Node</span>
          </div>
        ) : (
          availableNodeTypes.map((def) => (
            <div
              key={def.type}
              style={itemStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                onSpawnNode(def.type);
                onClose();
              }}
            >
              <span>{def.label || def.type}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--skipo-border, #333)', margin: '4px 0' }} />

      {/* Global & Selection Actions */}
      <div
        style={itemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        onClick={() => {
          onSelectAll();
          onClose();
        }}
      >
        <span>Select All</span>
        <span style={shortcutStyle}>⌘A</span>
      </div>

      {hasSelection && (
        <>
          <div
            style={{ ...itemStyle, color: '#e06c75' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(224, 108, 117, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => {
              onDeleteSelected();
              onClose();
            }}
          >
            <span>Delete Selected</span>
            <span style={shortcutStyle}>Del</span>
          </div>
          <div
            style={itemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => {
              onClearSelection();
              onClose();
            }}
          >
            <span>Clear Selection</span>
          </div>
        </>
      )}
    </div>
  );
}
