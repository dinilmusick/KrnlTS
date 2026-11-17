import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { BaseButton } from '../../base/BaseButton.js';
import { EmailProviderRow } from './EmailProviderRow.js';
import type { EmailProfileCardProps } from './contracts.js';

export const EmailProfileCard: React.FC<EmailProfileCardProps> = ({
  email, providers, keys, usageStats, targetKeyId, targetProviderId, onAddKey, onVerifyKey, onDeleteKey, onUpdateKeyLabel, getAcquisitionLink,
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  return (
    <div className="p-4 rounded-xl border-2 border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 font-mono text-xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-700/20"><Mail size={14} /><span className="font-bold text-sm">{email}</span></div>
      <div className="space-y-2">
        {providers.map((provider) => {
          const key = keys.find((entry) => entry.label === email && entry.providerId === provider.id);
          return <EmailProviderRow
            key={provider.id}
            email={email}
            providerMeta={provider}
            providerKey={key}
            usageStats={usageStats}
            isTargetedKey={Boolean(targetKeyId && key?.id === targetKeyId)}
            isTargetedProvider={Boolean(!targetKeyId && targetProviderId && provider.id === targetProviderId && key)}
            acquisitionLink={getAcquisitionLink?.(provider.id)}
            inputValue={inputs[provider.id] || ''}
            onInputChange={(value) => setInputs((current) => ({ ...current, [provider.id]: value }))}
            onSaveKey={() => {
              const value = inputs[provider.id]?.trim();
              if (!value) return;
              onAddKey({ providerId: provider.id, label: email, key: value });
              setInputs((current) => ({ ...current, [provider.id]: '' }));
            }}
            onVerifyKey={onVerifyKey}
            onDeleteKey={onDeleteKey}
            onUpdateKeyLabel={onUpdateKeyLabel}
          />;
        })}
      </div>
    </div>
  );
};
