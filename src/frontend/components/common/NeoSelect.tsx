/**
 * ASCII Architecture Flowchart: NeoSelect
 *
 *   ┌──────────────────────────────────┐
 *   │       Initialize NeoSelect       │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            NeoSelect             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { BaseSelect } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface NeoSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'rose' | 'slate' | 'violet';
  icon?: LucideIcon;
  dotColor?: string;
  disabled?: boolean;
}

export interface NeoSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: NeoSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showSearch?: boolean;
  disabled?: boolean;
  align?: 'left' | 'right';
  badge?: string;
}

// ════ NEOSELECT IMPLEMENTATION ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const NeoSelect: React.FC<NeoSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false
}) => {
  const selectOptions = options.map(opt => ({
    value: opt.value,
    label: opt.badge ? `${opt.label} [${opt.badge}]` : opt.label
  }));

  return (
    <div className={`flex flex-col gap-1 font-mono text-xs ${className}`}>
      {label && <label htmlFor={id} className="text-slate-400 font-bold">{label}</label>}
      <BaseSelect
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        options={selectOptions}
        disabled={disabled}
        aria-label={label || placeholder || 'Select Option'}
        className="w-full"
      />
    </div>
  );
};