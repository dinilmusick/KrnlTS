/**
 * ASCII Architecture Flowchart: SpecWeightToggles
 *
 *   ┌─────────────────────────────────────┐
 *   │     Initialize SpecWeightToggles    │
 *   └─────────────────────────────────────┘
 */

import React from 'react';
import { Cpu, Zap, Award, ShieldAlert } from 'lucide-react';
import { Tooltip } from '../../common/Tooltip.js';
import { BaseButton } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface SpecWeightTogglesProps {
  prioritiseReasoning: boolean;
  onToggleReasoning: (v: boolean) => void;
  prioritiseDeterminism: boolean;
  onToggleDeterminism: (v: boolean) => void;
  preferLocal: boolean;
  onTogglePreferLocal: (v: boolean) => void;
  avoidPaidProviders: boolean;
  onToggleAvoidPaid: (v: boolean) => void;
}

// ════ SPECWEIGHTTOGGLES IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const SpecWeightToggles: React.FC<SpecWeightTogglesProps> = ({
  prioritiseReasoning,
  onToggleReasoning,
  prioritiseDeterminism,
  onToggleDeterminism,
  preferLocal,
  onTogglePreferLocal,
  avoidPaidProviders,
  onToggleAvoidPaid
}) => {
  return (
    <div className="p-2 rounded-md border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
      <span className="font-bold uppercase text-[var(--skipo-text)] flex items-center gap-1">
        <Zap size={12} className="text-[var(--skipo-warning)]" /> WEIGHTS & RULES:
      </span>

      <div className="flex flex-wrap gap-1.5">
        <Tooltip text={`REASONING BOOSTER — ${prioritiseReasoning ? 'ON' : 'OFF'}`}>
          <BaseButton
            size="sm"
            onClick={() => onToggleReasoning(!prioritiseReasoning)}
            variant={prioritiseReasoning ? 'accent' : 'secondary'}
            aria-label="Toggle Reasoning"
            icon={<Cpu size={13} />}
          />
        </Tooltip>

        <Tooltip text={`DETERMINISM BOOSTER — ${prioritiseDeterminism ? 'ON' : 'OFF'}`}>
          <BaseButton
            size="sm"
            onClick={() => onToggleDeterminism(!prioritiseDeterminism)}
            variant={prioritiseDeterminism ? 'accent' : 'secondary'}
            aria-label="Toggle Determinism"
            icon={<Zap size={13} />}
          />
        </Tooltip>

        <Tooltip text={`PREFER LOCAL — ${preferLocal ? 'ON' : 'OFF'}`}>
          <BaseButton
            size="sm"
            onClick={() => onTogglePreferLocal(!preferLocal)}
            variant={preferLocal ? 'accent' : 'secondary'}
            aria-label="Prefer Local"
            icon={<Award size={13} />}
          />
        </Tooltip>

        <Tooltip text={`AVOID PAID — ${avoidPaidProviders ? 'ON' : 'OFF'}`}>
          <BaseButton
            size="sm"
            onClick={() => onToggleAvoidPaid(!avoidPaidProviders)}
            variant={avoidPaidProviders ? 'danger' : 'secondary'}
            aria-label="Avoid Paid"
            icon={<ShieldAlert size={13} />}
          />
        </Tooltip>
      </div>
    </div>
  );
};