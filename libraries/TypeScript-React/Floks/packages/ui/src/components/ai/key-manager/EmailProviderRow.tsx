import React from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { BaseButton, BaseInput } from '../../base/index.js';
import { ExistingKeyControl } from './ExistingKeyControl.js';
import type { EmailProviderRowProps } from './contracts.js';

export const EmailProviderRow: React.FC<EmailProviderRowProps> = ({
  providerMeta, providerKey, usageStats, isTargetedKey, isTargetedProvider, acquisitionLink, inputValue,
  onInputChange, onSaveKey, onVerifyKey, onDeleteKey, onUpdateKeyLabel,
}) => {
  const highlighted = isTargetedKey || isTargetedProvider;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-md border gap-2 ${isTargetedKey ? 'border-cyan-400 ring-2 ring-cyan-400' : isTargetedProvider ? 'border-amber-500 ring-2 ring-amber-500' : 'border-slate-700/60'}`} data-highlighted={highlighted}>
      <div className="flex items-center gap-2 shrink-0"><span className="font-bold text-[10px] w-20">{providerMeta.name.split(' ')[0].toUpperCase()}</span></div>
      {providerKey ? (
        <ExistingKeyControl providerKey={providerKey} usageStats={usageStats} onVerifyKey={onVerifyKey} onDeleteKey={onDeleteKey} onUpdateKeyLabel={onUpdateKeyLabel} />
      ) : (
        <div className="flex items-center flex-1 gap-2">
          <BaseInput type="password" placeholder={`Paste ${providerMeta.name.split(' ')[0]} Key`} value={inputValue} onChange={(e) => onInputChange(e.target.value)} className="flex-1 text-[10px]" />
          <BaseButton size="sm" variant="accent" onClick={onSaveKey} disabled={!inputValue.trim()}><Plus size={12} /></BaseButton>
          {acquisitionLink && <a href={acquisitionLink} target="_blank" rel="noreferrer" className="p-1 rounded border border-slate-700"><ExternalLink size={12} /></a>}
        </div>
      )}
    </div>
  );
};
