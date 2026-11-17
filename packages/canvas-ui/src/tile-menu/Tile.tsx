'use client';
import React from 'react';
import type { TileConfig } from './types.js';

interface TileProps {
  tile: TileConfig;
  onClick?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  dragHandleProps?: Record<string, any>;
  isDragging?: boolean;
}

export function Tile({ tile, onClick, onContextMenu, dragHandleProps, isDragging }: TileProps) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={() => onClick?.(tile.id)}
      onContextMenu={(e) => onContextMenu?.(e, tile.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tile.icon && <span style={{ fontSize: '24px' }}>{tile.icon}</span>}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{tile.title}</span>
            {tile.subtitle && <span style={{ color: '#aaa', fontSize: '12px' }}>{tile.subtitle}</span>}
          </div>
        </div>
        <div {...dragHandleProps} style={{ cursor: 'grab', padding: '4px', color: '#666' }}>
          ⠿
        </div>
      </div>
      
      {tile.badges && tile.badges.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
          {tile.badges.map(badge => (
            <span key={badge} style={{ 
              fontSize: '10px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              padding: '2px 6px', 
              borderRadius: '12px',
              color: '#ccc'
            }}>
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
