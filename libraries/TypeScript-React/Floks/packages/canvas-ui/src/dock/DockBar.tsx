'use client';
import React, { useState } from 'react';
import type { DockPosition, DockItemConfig } from './types.js';
import { DockItem } from './DockItem.js';

interface DockBarProps {
  items: DockItemConfig[];
  position?: DockPosition;
  activeId?: string;
  onItemClick?: (id: string) => void;
  autoHide?: boolean;
}

export function DockBar({ items, position = 'bottom', activeId, onItemClick, autoHide = false }: DockBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isVertical = position === 'left' || position === 'right';
  
  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    ...(position === 'bottom' ? { bottom: '16px', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'top' ? { top: '16px', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'left' ? { left: '16px', top: '50%', transform: 'translateY(-50%)' } : {}),
    ...(position === 'right' ? { right: '16px', top: '50%', transform: 'translateY(-50%)' } : {}),
  };

  const hiddenTransform = position === 'bottom' ? 'translate(-50%, 150%)' :
                          position === 'top' ? 'translate(-50%, -150%)' :
                          position === 'left' ? 'translate(-150%, -50%)' :
                          'translate(150%, -50%)';

  const baseTransform = position === 'bottom' || position === 'top' ? 'translateX(-50%)' : 'translateY(-50%)';
                          
  const containerStyle: React.CSSProperties = {
    ...positionStyles,
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'rgba(25, 25, 25, 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: autoHide && !isHovered ? hiddenTransform : baseTransform,
  };

  return (
    <>
      {autoHide && (
        <div 
          style={{
            position: 'fixed',
            ...(position === 'bottom' ? { bottom: 0, left: 0, right: 0, height: '24px' } : {}),
            ...(position === 'top' ? { top: 0, left: 0, right: 0, height: '24px' } : {}),
            ...(position === 'left' ? { left: 0, top: 0, bottom: 0, width: '24px' } : {}),
            ...(position === 'right' ? { right: 0, top: 0, bottom: 0, width: '24px' } : {}),
            zIndex: 9998
          }}
          onMouseEnter={() => setIsHovered(true)}
        />
      )}
      <div 
        style={containerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {items.map(item => (
          <DockItem 
            key={item.id} 
            item={item} 
            isActive={activeId === item.id}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}
      </div>
    </>
  );
}
