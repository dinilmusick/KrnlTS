import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { NeoButton } from '../../common/NeoButton.js';
import { NeoSelect } from '../../common/NeoSelect.js';
import { BaseInput } from '@ultrst-armada/floks';
import { ProviderId, ApiKeyEntry } from '../../../types/app.js';
import { AI_PROVIDER_METADATA } from '../../../../libraries/providerMetadata.js';
import { KeyProviderFilterBar } from './KeyProviderFilterBar.js';

interface SingleKeyFormProps {
  keys: ApiKeyEntry[];
  selectedFilter: ProviderId | 'all';
  setSelectedFilter: (filter: ProviderId | 'all') => void;
  onAddKey: (payload: { providerId: ProviderId; label: string; key: string }) => void;
  targetProviderId?: ProviderId;
  highlightNonce?: number;
  isNewKeyNeeded?: boolean;
}

export const SingleKeyForm: React.FC<SingleKeyFormProps> = ({ keys, selectedFilter, setSelectedFilter, onAddKey, targetProviderId, highlightNonce, isNewKeyNeeded = false }) => {
  const [providerId, setProviderId] = useState<ProviderId>(targetProviderId || (selectedFilter !== 'all' ? selectedFilter : 'google'));
  const [label, setLabel] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const target = targetProviderId || (selectedFilter !== 'all' ? selectedFilter : null);
    if (!target) return;
    setProviderId(target);
    if (!label) {
      const meta = AI_PROVIDER_METADATA.find((item) => item.id === target);
      if (meta) setLabel(`${meta.name.split(' ')[0]} Key`);
    }
  }, [selectedFilter, targetProviderId, highlightNonce]);

  useEffect(() => {
    if (!isNewKeyNeeded) return;
    setIsHighlighted(true);
    keyInputRef.current?.focus();
    const timer = setTimeout(() => setIsHighlighted(false), 4000);
    return () => clearTimeout(timer);
  }, [isNewKeyNeeded, targetProviderId, highlightNonce]);

  const handleProviderChange = (provider: ProviderId) => {
    setProviderId(provider);
    setSelectedFilter(provider);
    const meta = AI_PROVIDER_METADATA.find((item) => item.id === provider);
    if (meta) setLabel(`${meta.name.split(' ')[0]} Key`);
  };

  const handleCreate = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!keyInput.trim()) return;
    const meta = AI_PROVIDER_METADATA.find((item) => item.id === providerId);
    onAddKey({ providerId, label: label.trim() || `${meta?.name.split(' ')[0] || 'API'} Key`, key: keyInput.trim() });
    setLabel('');
    setKeyInput('');
    setIsHighlighted(false);
  };

  const currentProvider = AI_PROVIDER_METADATA.find((item) => item.id === providerId);

  return (
    <form onSubmit={handleCreate} className={`p-3 rounded-lg border-2 transition-all font-mono text-xs space-y-3 ${isHighlighted ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500' : 'border-slate-700/80 bg-slate-200/40 dark:bg-slate-800/40'}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div><label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">PROVIDER</label><NeoSelect value={providerId} onChange={(value) => handleProviderChange(value as ProviderId)} options={AI_PROVIDER_METADATA.map((item) => ({ value: item.id, label: item.name }))} /></div>
        <div><label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">KEY LABEL</label><BaseInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`e.g. ${currentProvider?.name.split(' ')[0] || 'Primary'} Key`} /></div>
        <div className="col-span-2"><label className="text-[10px] font-extrabold text-slate-500 block mb-0.5">API SECRET KEY ({currentProvider?.name || providerId})</label><BaseInput ref={keyInputRef} type="password" value={keyInput} onChange={(event) => setKeyInput(event.target.value)} placeholder={`Paste ${currentProvider?.name || providerId} secret key...`} /></div>
      </div>
      <div className="flex items-center justify-between pt-1"><KeyProviderFilterBar keys={keys} selectedFilter={selectedFilter} onFilterChange={(filter) => filter === 'all' ? setSelectedFilter('all') : handleProviderChange(filter)} /><NeoButton icon={Plus} tooltipText="Add Key & Verify Live" onClick={() => handleCreate()} variant="accent" size="sm" /></div>
    </form>
  );
};
