/**
 * ASCII Architecture Flowchart: ModelCatalogView
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize ModelCatalogView    │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         ModelCatalogView         │
 *   └──────────────────────────────────┘
 */

import React, { useState } from 'react';
import { Layers, RefreshCw, AlertTriangle, Database, Gift, DollarSign, HelpCircle } from 'lucide-react';
import { NeoViewContainer } from '../common/NeoViewContainer.js';
import { NeoButton } from '../common/NeoButton.js';
import { BaseButton } from '@ultrst-armada/floks';
import { Tooltip } from '../common/Tooltip.js';
import { ModelCatalogEntry, ProviderId } from '../../types/app.js';
import { ModelCard } from './catalog/ModelCard.js';
import { getProviderIcon } from './catalog/providerIconHelper.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface ProviderCatalogStatus {
  providerId: ProviderId;
  status: 'online' | 'missing-key' | 'error';
  error?: string;
  modelsCount: number;
}

interface ModelCatalogViewProps {
  onCloseToGraph: () => void;
  catalog: ModelCatalogEntry[];
  providerStatuses?: ProviderCatalogStatus[];
  onRefreshEndpoints: () => void;
}

// ════ MODELCATALOGVIEW IMPLEMENTATION ═════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const ModelCatalogView: React.FC<ModelCatalogViewProps> = ({
  onCloseToGraph,
  catalog,
  providerStatuses = [],
  onRefreshEndpoints
}) => {
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [providerFilter, setProviderFilter] = useState<ProviderId | 'all'>('all');

  const filtered = catalog.filter((m) => {
    if (tierFilter === 'free' && !m.isFree) return false;
    if (tierFilter === 'paid' && m.isFree) return false;
    if (providerFilter !== 'all' && m.providerId !== providerFilter) return false;
    return true;
  });

  const providersList: Array<{ id: ProviderId; label: string }> = [
    { id: 'google', label: 'Google Gemini' },
    { id: 'groq', label: 'Groq LPU' },
    { id: 'cerebras', label: 'Cerebras Systems' },
    { id: 'openrouter', label: 'OpenRouter' },
    { id: 'together', label: 'Together AI' },
    { id: 'nvidia', label: 'NVIDIA NIM' },
    { id: 'huggingface', label: 'Hugging Face' }
  ];

  return (
    <NeoViewContainer titleIcon={Layers} onCloseToGraph={onCloseToGraph}>
      <div className="space-y-4">
        {((providerFilter !== 'all' && providerStatuses.find(ps => ps.providerId === providerFilter)?.status === 'missing-key') ||
          (providerStatuses.length > 0 && providerStatuses.every(ps => ps.status !== 'online'))) && (
          <div className="p-2.5 rounded border-2 border-dashed border-amber-600 bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-center justify-between font-mono text-[11px] gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <AlertTriangle size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
              {providerStatuses.filter(ps => ps.status !== 'online').map(ps => {
                const ProvIcon = getProviderIcon(ps.providerId);
                return (
                  <Tooltip key={ps.providerId} text={ps.status === 'missing-key' ? `No API key for ${ps.providerId.toUpperCase()}` : ps.error || 'Fetch failed'}>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-700/40 bg-amber-200/50 dark:bg-amber-900/40 cursor-help font-bold">
                      <ProvIcon size={12} /> {ps.status === 'missing-key' ? 'KEY_REQD' : 'FETCH_ERR'}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
            <HelpCircle size={14} className="text-amber-600 dark:text-amber-400 cursor-help shrink-0" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded border-2 border-slate-700/80 bg-slate-100/70 dark:bg-slate-900/70 shadow-sm font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded border border-slate-700/60">
              <BaseButton size="sm" variant={tierFilter === 'all' ? 'accent' : 'ghost'} onClick={() => setTierFilter('all')} className="p-1.5">
                <Database size={14} />
              </BaseButton>
              <BaseButton size="sm" variant={tierFilter === 'free' ? 'accent' : 'ghost'} onClick={() => setTierFilter('free')} className="p-1.5">
                <Gift size={14} />
              </BaseButton>
              <BaseButton size="sm" variant={tierFilter === 'paid' ? 'accent' : 'ghost'} onClick={() => setTierFilter('paid')} className="p-1.5">
                <DollarSign size={14} />
              </BaseButton>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded border border-slate-700/60">
              <BaseButton size="sm" variant={providerFilter === 'all' ? 'accent' : 'ghost'} onClick={() => setProviderFilter('all')} className="p-1.5">
                <Layers size={14} />
              </BaseButton>
              {providersList.map((p) => {
                const PIcon = getProviderIcon(p.id);
                return (
                  <BaseButton
                    key={p.id}
                    size="sm"
                    variant={providerFilter === p.id ? 'accent' : 'ghost'}
                    onClick={() => setProviderFilter(p.id)}
                    className="p-1.5"
                  >
                    <PIcon size={14} />
                  </BaseButton>
                );
              })}
            </div>
          </div>

          <NeoButton icon={RefreshCw} tooltipText="Fetch Active Models from Canonical Endpoints" onClick={onRefreshEndpoints} variant="accent" size="sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
          {filtered.length === 0 ? (
            <div className="md:col-span-2 p-8 text-center rounded border-2 border-dashed border-slate-700/80 text-slate-400 font-mono text-xs">
              NO_CATALOG_CANDIDATES_FOUND
            </div>
          ) : (
            filtered.map((m, idx) => <ModelCard key={`${m.providerId}-${m.id}-${idx}`} model={m} />)
          )}
        </div>
      </div>
    </NeoViewContainer>
  );
};