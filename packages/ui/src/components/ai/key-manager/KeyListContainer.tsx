/**
 * @file KeyListContainer.tsx
 * @description Master container organizing key filtering, list rendering, and adding
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import { SingleKeyCard, type SingleKeyCardProps } from './SingleKeyCard.js';
import { KeyProviderFilterBar } from './KeyProviderFilterBar.js';
import { SingleKeyForm } from './SingleKeyForm.js';

export interface KeyListContainerProps {
  keys: SingleKeyCardProps[];
  providers: string[];
  onAddKey: (data: { providerId: string; label: string; key: string }) => void;
  onVerifyKey?: (id: string) => void;
  onDeleteKey?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

export const KeyListContainer: React.FC<KeyListContainerProps> = ({
  keys,
  providers,
  onAddKey,
  onVerifyKey,
  onDeleteKey,
  onToggleActive,
}) => {
  const [filter, setFilter] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);

  const filteredKeys = filter
    ? keys.filter((k) => k.providerId.toLowerCase() === filter.toLowerCase())
    : keys;

  const counts: Record<string, number> = {};
  for (const k of keys) {
    counts[k.providerId] = (counts[k.providerId] || 0) + 1;
  }

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between gap-3">
        <KeyProviderFilterBar
          providers={providers}
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        <BaseButton
          size="sm"
          variant="accent"
          onClick={() => setShowForm(!showForm)}

          className="flex items-center gap-1.5 shrink-0"
        >
          <Plus size={13} />
          {showForm ? 'Close Form' : 'New Key'}
        </BaseButton>
      </div>

      {showForm && (
        <SingleKeyForm
          providers={providers}
          onSubmit={(data) => {
            onAddKey(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-2">
        {filteredKeys.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs">
            No API keys found for current filter. Add one to enable inference.
          </div>
        ) : (
          filteredKeys.map((k) => (
            <SingleKeyCard
              key={k.id}
              {...k}
              onVerify={onVerifyKey}
              onDelete={onDeleteKey}
              onToggleActive={onToggleActive}
            />
          ))
        )}
      </div>
    </div>
  );
};
