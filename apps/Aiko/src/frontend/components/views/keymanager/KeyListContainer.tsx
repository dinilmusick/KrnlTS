import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { EmailProfileCard, type AIKeyEntry, type AIKeyUsageStats } from '@ultrst-armada/floks';
import { ApiKeyEntry, ProviderId, KeyModelUsageStats } from '../../../types/app.js';
import { SingleKeyCard } from './SingleKeyCard.js';
import { ModelCheckResultItem } from './KeyModelVerificationSuite.js';
import { AI_PROVIDER_METADATA } from '../../../../libraries/providerMetadata.js';
import { RuntimeCredentialSection } from './RuntimeCredentialSection.js';

export interface KeyListContainerProps {
  activeTab: 'single' | 'email';
  workspaceId?: string;
  emails: string[];
  keys: ApiKeyEntry[];
  filteredKeys: ApiKeyEntry[];
  selectedFilter: ProviderId | 'all';
  usageStats?: KeyModelUsageStats[];
  activeHighlightKeyId: string | null;
  activeHighlightProviderId: ProviderId | null;
  highlightNonce?: number;
  checkingModelsKeyId: string | null;
  modelCheckResults?: Record<string, ModelCheckResultItem[]>;
  expandedKeys: Record<string, boolean>;
  onToggleExpand: (keyId: string, expand: boolean) => void;
  onCheckModels: (keyId: string) => void;
  onAddKey: (payload: { providerId: ProviderId; label: string; key: string }) => void;
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
}

export const KeyListContainer: React.FC<KeyListContainerProps> = ({ activeTab, workspaceId, emails, keys, filteredKeys, selectedFilter, usageStats, activeHighlightKeyId, activeHighlightProviderId, checkingModelsKeyId, modelCheckResults, expandedKeys, onToggleExpand, onCheckModels, onAddKey, onVerifyKey, onDeleteKey, onUpdateKeyLabel }) => {
  const floksKeys = keys as unknown as AIKeyEntry[];
  const floksUsageStats = usageStats as unknown as AIKeyUsageStats[];

  if (activeTab === 'email') {
    return <div className="space-y-3">
      {emails.length === 0 && <div className="p-4 text-center text-slate-500 font-mono text-xs border-2 border-dashed border-slate-700 rounded-lg">NO_EMAIL_PROFILES_FOUND</div>}
      {emails.map((email) => <React.Fragment key={email}><EmailProfileCard email={email} providers={AI_PROVIDER_METADATA} keys={floksKeys} usageStats={floksUsageStats} targetKeyId={activeHighlightKeyId || undefined} targetProviderId={activeHighlightProviderId || undefined} getAcquisitionLink={(id) => AI_PROVIDER_METADATA.find((item) => item.id === id)?.acquisitionUrl} onAddKey={onAddKey} onVerifyKey={onVerifyKey} onDeleteKey={onDeleteKey} onUpdateKeyLabel={onUpdateKeyLabel} /><RuntimeCredentialSection workspaceId={workspaceId} emailGroup={email} /></React.Fragment>)}
    </div>;
  }

  return <div className="space-y-3">
    <RuntimeCredentialSection workspaceId={workspaceId} />
    <div className="space-y-2">
    {filteredKeys.length === 0 && <div className="p-3 text-center text-amber-700 dark:text-amber-400 font-mono text-xs border-2 border-dashed border-amber-600/70 bg-amber-500/10 rounded-lg flex items-center justify-between"><span className="font-extrabold flex items-center gap-2 text-[11px]"><ShieldAlert size={15} />NO_KEY_REGISTERED: {selectedFilter.toUpperCase()}</span><span className="text-[9px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">ADD_KEY</span></div>}
    {filteredKeys.map((key) => <SingleKeyCard key={key.id} apiKey={key} usageStats={usageStats} isTargetedKey={Boolean(activeHighlightKeyId && key.id === activeHighlightKeyId)} isTargetedProvider={Boolean(!activeHighlightKeyId && activeHighlightProviderId && key.providerId === activeHighlightProviderId)} checkingModelsKeyId={checkingModelsKeyId} modelCheckResults={modelCheckResults} expandedKeys={expandedKeys} onToggleExpand={onToggleExpand} onCheckModels={onCheckModels} onVerifyKey={onVerifyKey} onDeleteKey={onDeleteKey} onUpdateKeyLabel={onUpdateKeyLabel} />)}
    </div>
  </div>;
};
