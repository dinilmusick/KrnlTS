/**
 * ASCII Architecture Flowchart: ModelsBrowserView
 *
 *   ┌──────────────────────────────────┐
 *   │   Initialize ModelsBrowserView   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │        ModelsBrowserView         │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │         filteredCatalog          │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          matchesSearch           │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

import React, { useState } from 'react';
import { BaseButton, BaseInput, BaseSelect } from '@ultrst-armada/floks';
import { RefreshCw, Cpu, Key, Sliders, Database, Gift, DollarSign } from 'lucide-react';
import { ModelsBrowserViewProps } from './ModelsBrowserView/types.js';
import { ModelCard } from './catalog/ModelCard.js';
import { NeoViewContainer } from '../common/NeoViewContainer.js';

export const ModelsBrowserView: React.FC<ModelsBrowserViewProps> = ({
  onCloseToGraph,
  catalog,
  onOpenSpecWindow,
  onOpenKeyManager,
  providerStatuses = [],
  onRefreshEndpoints,
  onOpenChatWithModel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'paid'>('all');

  const filteredCatalog = catalog.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.providerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || m.providerId === selectedProvider;
    const matchesTier = tierFilter === 'all' || (tierFilter === 'free' ? m.isFree : !m.isFree);
    return matchesSearch && matchesProvider && matchesTier;
  });

  const providerOptions = [
    { value: 'all', label: 'All Providers' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'groq', label: 'Groq LPU' },
    { value: 'cerebras', label: 'Cerebras Systems' },
    { value: 'openrouter', label: 'OpenRouter' },
    { value: 'together', label: 'Together AI' },
    { value: 'nvidia', label: 'NVIDIA NIM' },
    { value: 'huggingface', label: 'Hugging Face' }
  ];

  return (
    <NeoViewContainer titleIcon={Cpu} onCloseToGraph={onCloseToGraph}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
              Model Catalog & Route Registry
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Explore active model endpoints, 15-parameter procedural intelligence sigils, and live routing weights
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <BaseButton variant="secondary" size="sm" onClick={onRefreshEndpoints} className="font-mono text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sync Models
            </BaseButton>
            {onOpenSpecWindow && (
              <BaseButton variant="secondary" size="sm" onClick={onOpenSpecWindow} className="font-mono text-xs">
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                Spec Matrix
              </BaseButton>
            )}
            {onOpenKeyManager && (
              <BaseButton variant="accent" size="sm" onClick={() => onOpenKeyManager()} className="font-mono text-xs">
                <Key className="w-3.5 h-3.5 mr-1.5" />
                Manage API Keys
              </BaseButton>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex-1 min-w-[240px] relative">
            <BaseInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by model name, ID, provider..."
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <BaseButton
              size="sm"
              variant={tierFilter === 'all' ? 'accent' : 'secondary'}
              onClick={() => setTierFilter('all')}
              className="px-2.5 py-1 text-xs font-mono font-bold"
              icon={<Database size={13} />}
            >
              ALL ({catalog.length})
            </BaseButton>
            <BaseButton
              size="sm"
              variant={tierFilter === 'free' ? 'accent' : 'secondary'}
              onClick={() => setTierFilter('free')}
              className="px-2.5 py-1 text-xs font-mono font-bold"
              icon={<Gift size={13} />}
            >
              FREE ({catalog.filter(m => m.isFree).length})
            </BaseButton>
            <BaseButton
              size="sm"
              variant={tierFilter === 'paid' ? 'accent' : 'secondary'}
              onClick={() => setTierFilter('paid')}
              className="px-2.5 py-1 text-xs font-mono font-bold"
              icon={<DollarSign size={13} />}
            >
              PAID ({catalog.filter(m => !m.isFree).length})
            </BaseButton>
          </div>

          <div className="w-full md:w-56 shrink-0">
            <BaseSelect
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              options={providerOptions}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {filteredCatalog.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-500 font-mono text-xs">
              NO_MATCHING_MODELS_FOUND
            </div>
          ) : (
            filteredCatalog.map((model, idx) => {
              const provStat = providerStatuses.find(p => p.providerId === model.providerId)?.status;
              return (
                <ModelCard
                  key={`${model.providerId}-${model.id}-${idx}`}
                  model={model}
                  providerStatus={provStat}
                  onDoubleClick={onOpenChatWithModel}
                  onOpenChat={onOpenChatWithModel}
                  onOpenKeyManager={onOpenKeyManager}
                />
              );
            })
          )}
        </div>
      </div>
    </NeoViewContainer>
  );
};

export default ModelsBrowserView;
