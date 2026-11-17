/**
 * ASCII Architecture Flowchart: KeyProviderFilterBar
 *
 *   ┌──────────────────────────────────────────┐
 *   │    Initialize KeyProviderFilterBar       │
 *   └──────────────────────────────────────────┘
 */

import React from 'react';
import { Filter } from 'lucide-react';
import { BaseButton } from '@ultrst-armada/floks';
import { ProviderId, ApiKeyEntry } from '../../../types/app.js';
import { PROVIDERS_META } from '../../../../backend/providers.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export interface KeyProviderFilterBarProps {
  keys: ApiKeyEntry[];
  selectedFilter: ProviderId | 'all';
  onFilterChange: (filter: ProviderId | 'all') => void;
}

// ════ KEYPROVIDERFILTERBAR IMPLEMENTATION ════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const KeyProviderFilterBar: React.FC<KeyProviderFilterBarProps> = ({
  keys,
  selectedFilter,
  onFilterChange
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
      <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 mr-1">
        <Filter size={11} /> Filter:
      </span>
      <BaseButton
        type="button"
        size="sm"
        variant={selectedFilter === 'all' ? 'accent' : 'ghost'}
        onClick={() => onFilterChange('all')}
        className="px-2 py-0.5 text-[10px]"
      >
        ALL ({keys.length})
      </BaseButton>
      {Object.values(PROVIDERS_META).map((p) => {
        const count = keys.filter(k => k.providerId === p.id).length;
        const isTarget = selectedFilter === p.id;
        return (
          <BaseButton
            key={p.id}
            type="button"
            size="sm"
            variant={isTarget ? 'warning' : 'ghost'}
            onClick={() => onFilterChange(p.id)}
            className="px-2 py-0.5 text-[10px]"
          >
            {p.name.split(' ')[0]} ({count})
          </BaseButton>
        );
      })}
    </div>
  );
};