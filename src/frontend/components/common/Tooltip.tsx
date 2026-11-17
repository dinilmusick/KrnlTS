/**
 * ASCII Architecture Flowchart: Tooltip
 *
 *   ┌──────────────────────────────────┐
 *   │        Initialize Tooltip        │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             Tooltip              │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           containerRef           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         handleMouseEnter         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  text: string;
  description?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}


// ════ TOOLTIP IMPLEMENTATION ══════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const Tooltip: React.FC<TooltipProps> = ({ 
  text, 
  description,
  children, 
  className = ''
}) => {
  const { setInspectionText } = useBottomStrip();
  const words = text ? text.trim().split(/\s+/) : [];
  const label = words.length > 4 ? words.slice(0, 4).join(' ') : text;
  const fullDescription = description || text;

  const handleMouseEnter = () => {
    setInspectionText(label, fullDescription);
  };

  const handleMouseLeave = () => {
    setInspectionText(null, null);
  };

  return (
    <div 
      className={`relative inline-flex items-center ${className}`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};