/**
 * ASCII Architecture Flowchart: ProviderEnablementTable
 *
 *   ┌─────────────────────────────────────────┐
 *   │    Initialize ProviderEnablementTable   │
 *   └─────────────────────────────────────────┘
 */

import React from 'react';
import { ProviderId } from '../../../types/app.js';
import { PROVIDERS_META, PROVIDER_COLORS } from '../../../../backend/providers.js';
import { CheckSquare, Square, Cloud } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { useBottomStrip } from '@ultrst-armada/floks';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface ProviderEnablementTableProps {
  allProviderIds: ProviderId[];
  enabledProviders: ProviderId[];
  toggleProvider: (id: ProviderId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  disabled?: boolean;
}

// ════ PROVIDERENABLEMENTTABLE IMPLEMENTATION ══════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ProviderEnablementTable: React.FC<ProviderEnablementTableProps> = ({
  allProviderIds,
  enabledProviders,
  toggleProvider,
  onSelectAll,
  onDeselectAll,
  disabled = false
}) => {
  const { setInspectionText } = useBottomStrip();

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border-2 border-[var(--skipo-border-color)] bg-[var(--skipo-surface)] shadow-[var(--skipo-shadow)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--skipo-border-color)]/30 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-[var(--skipo-success)]" />
            <h3 className="text-sm font-black tracking-wider uppercase text-[var(--skipo-text)]">
              Provider Enablement Matrix
            </h3>
          </div>
          <p className="text-[11px] font-mono text-[var(--skipo-text-muted)] mt-0.5">
            Select permitted providers during matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BaseButton
            size="sm"
            disabled={disabled}
            onClick={onSelectAll}
            onMouseEnter={() => setInspectionText("ENABLE ALL PROVIDERS MATRIX")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText("ENABLE ALL PROVIDERS MATRIX")}
            onBlur={() => setInspectionText(null)}
            aria-label="Enable All Providers"
            variant="secondary"
            className="px-2 py-1"
            icon={<CheckSquare size={15} className="text-[var(--skipo-success)]" />}
          />
          <BaseButton
            size="sm"
            disabled={disabled}
            onClick={onDeselectAll}
            onMouseEnter={() => setInspectionText("DISABLE ALL PROVIDERS MATRIX")}
            onMouseLeave={() => setInspectionText(null)}
            onFocus={() => setInspectionText("DISABLE ALL PROVIDERS MATRIX")}
            onBlur={() => setInspectionText(null)}
            aria-label="Disable All Providers"
            variant="secondary"
            className="px-2 py-1"
            icon={<Square size={15} className="text-[var(--skipo-text-muted)]" />}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--skipo-border-color)]/30 text-[var(--skipo-text-muted)] text-[10px] uppercase font-bold tracking-wider">
              <th className="pb-2 pl-2">Status</th>
              <th className="pb-2">Provider</th>
              <th className="pb-2">Environment</th>
              <th className="pb-2">Cost Model</th>
              <th className="pb-2 text-right pr-2">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--skipo-border-color)]/20">
            {allProviderIds.map((pId) => {
              const meta = PROVIDERS_META[pId];
              const isEnabled = enabledProviders.includes(pId);
              const colorHex = PROVIDER_COLORS[pId] || 'var(--skipo-border-color, #94a3b8)';

              return (
                <tr
                  key={pId}
                  onClick={() => toggleProvider(pId)}
                  className={`cursor-pointer transition-colors ${
                    isEnabled
                      ? 'bg-[var(--skipo-accent)]/10 hover:bg-[var(--skipo-accent)]/20 text-[var(--skipo-text)]'
                      : 'bg-[var(--skipo-matte-bg)]/40 hover:bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)] opacity-60'
                  }`}
                >
                  <td className="py-2.5 pl-2">
                    <div className="flex items-center">
                      {isEnabled ? (
                        <CheckSquare size={16} className="text-[var(--skipo-success)]" />
                      ) : (
                        <Square size={16} className="text-[var(--skipo-text-muted)]" />
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="text-sm">{meta?.name || pId}</span>
                    </div>
                  </td>

                  <td className="py-2.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-[var(--skipo-accent)] font-semibold">
                      <Cloud size={12} /> Cloud Cluster
                    </span>
                  </td>

                  <td className="py-2.5 text-[11px]">
                    {pId === 'google' || pId === 'groq' || pId === 'cerebras' || pId === 'huggingface' || pId === 'nvidia' ? (
                      <span className="text-[var(--skipo-success)] font-bold">Free Tier</span>
                    ) : (
                      <span className="text-[var(--skipo-warning)] font-bold">Token / Usage</span>
                    )}
                  </td>

                  <td className="py-2.5 text-right pr-2">
                    {isEnabled ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[var(--skipo-success)]/20 text-[var(--skipo-success)] border border-[var(--skipo-success)]/40">
                        ENABLED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[var(--skipo-matte-bg)] text-[var(--skipo-text-muted)] border border-[var(--skipo-border-color)]/50">
                        DISABLED
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};