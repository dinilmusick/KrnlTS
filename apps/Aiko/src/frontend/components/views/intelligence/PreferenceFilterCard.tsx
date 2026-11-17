/**
 * ASCII Architecture Flowchart: PreferenceFilterCard
 *
 *   ┌─────────────────────────────────────┐
 *   │    Initialize PreferenceFilterCard  │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface PreferenceFilterCardProps {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeColorClass: string;
  activeBorderClass: string;
  activeIconBgClass: string;
  disabled?: boolean;
}

// ════ PREFERENCEFILTERCARD IMPLEMENTATION ═════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const PreferenceFilterCard: React.FC<PreferenceFilterCardProps> = ({
  label,
  description,
  active,
  onClick,
  icon,
  activeColorClass,
  activeBorderClass,
  activeIconBgClass,
  disabled = false
}) => {
  return (
    <BaseButton
      type="button"
      disabled={disabled}
      onClick={onClick}
      variant={active ? 'accent' : 'secondary'}
      className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all w-full ${
        active
          ? `${activeBorderClass} ${activeColorClass}`
          : 'border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] hover:border-[var(--skipo-accent)]/50 text-[var(--skipo-text)]'
      }`}
    >
      <div className={`p-2 rounded-md ${active ? activeIconBgClass : 'bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)]'}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--skipo-text)]">
          <span>{label}</span>
          {active && <CheckCircle2 size={12} className="text-[var(--skipo-accent)]" />}
        </div>
        <p className="text-[10px] text-[var(--skipo-text-muted)] font-mono">
          {description}
        </p>
      </div>
    </BaseButton>
  );
};