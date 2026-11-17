/**
 * ASCII Architecture Flowchart: NeoButton
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize NeoButton       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            NeoButton             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           sizeClasses            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            iconSizes             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Tooltip } from './Tooltip.js';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface NeoButtonProps {
  icon: LucideIcon;
  tooltipText: string;
  onClick: () => void;
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
}

// ════ NEOBUTTON IMPLEMENTATION ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const NeoButton: React.FC<NeoButtonProps> = ({
  icon: Icon,
  tooltipText,
  onClick,
  active = false,
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  label,
  description
}) => {
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const mapVariant = () => {
    if (variant === 'primary') return 'accent';
    if (variant === 'danger') return 'danger';
    if (variant === 'accent') return 'accent';
    return 'secondary';
  };

  return (
    <Tooltip text={label || tooltipText} description={description || tooltipText}>
      <BaseButton
        onClick={onClick}
        disabled={disabled}
        variant={mapVariant()}
        size={size}
        aria-label={label || tooltipText}
        className={`${active ? 'ring-2 ring-slate-800 dark:ring-slate-200' : ''} ${className}`}
        icon={<Icon size={iconSizes[size]} className="stroke-[2.2]" />}
      />
    </Tooltip>
  );
};