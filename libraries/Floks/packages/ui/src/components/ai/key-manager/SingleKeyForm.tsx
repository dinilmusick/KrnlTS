/**
 * @file SingleKeyForm.tsx
 * @description Input form for adding a new API key with provider selection and validation
 */

import React, { useState } from 'react';
import { BaseInput } from '../../base/BaseInput.js';
import { BaseButton } from '../../base/BaseButton.js';
import { BaseSelect } from '../../base/BaseSelect.js';

export interface SingleKeyFormProps {
  providers: string[];
  onSubmit: (data: { providerId: string; label: string; key: string }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const SingleKeyForm: React.FC<SingleKeyFormProps> = ({
  providers,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [providerId, setProviderId] = useState(providers[0] || 'google');
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    onSubmit({
      providerId,
      label: label.trim() || `${providerId.toUpperCase()} Key`,
      key: key.trim(),
    });
    setKey('');
    setLabel('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs space-y-3">
      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Add API Key</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Provider</label>
          <BaseSelect
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            options={providers.map((p) => ({ label: p.toUpperCase(), value: p }))}
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Label</label>
          <BaseInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Production Key"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-500 mb-1">API Key / Token</label>
        <BaseInput
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste provider key..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <BaseButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </BaseButton>
        )}
        <BaseButton type="submit" variant="accent" disabled={isLoading || !key.trim()}>
          {isLoading ? 'Saving...' : 'Add Key'}
        </BaseButton>

      </div>
    </form>
  );
};
