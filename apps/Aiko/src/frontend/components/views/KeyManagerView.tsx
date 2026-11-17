/**
 * ASCII Architecture Flowchart: KeyManagerView
 *
 *   ┌──────────────────────────────────┐
 *   │    Initialize KeyManagerView     │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │          KeyManagerView          │
 *   └──────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Key, Mail, User } from 'lucide-react';
import { NeoViewContainer } from '../common/NeoViewContainer.js';
import { BaseButton, KeyBackupModal, EmailProfileRegistrationForm } from '@ultrst-armada/floks';
import { ApiKeyEntry, ProviderId, RotationStrategy, KeyModelUsageStats } from '../../types/app.js';
import { SingleKeyForm } from './keymanager/SingleKeyForm.js';
import { KeyBackupHeaderBar } from './keymanager/KeyBackupHeaderBar.js';
import { KeyListContainer } from './keymanager/KeyListContainer.js';
import { useKeyTargeting } from './keymanager/useKeyTargeting.js';
import { apiClient } from '../../../libraries/apiClient.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface KeyManagerViewProps {
  workspaceId?: string;
  onCloseToGraph: () => void;
  keys: ApiKeyEntry[];
  usageStats?: KeyModelUsageStats[];
  strategy: RotationStrategy;
  initialProviderId?: ProviderId;
  targetKeyId?: string;
  highlightNonce?: number;
  onAddKey: (payload: { providerId: ProviderId; label: string; key: string }) => void;
  onVerifyKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
  onUpdateKeyLabel: (id: string, label: string) => void;
  onSetStrategy: (strat: RotationStrategy) => void;
  onRefreshKeys?: () => void;
}

// ════ KEYMANAGERVIEW IMPLEMENTATION ═══════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const KeyManagerView: React.FC<KeyManagerViewProps> = ({
  workspaceId,
  onCloseToGraph,
  keys,
  usageStats = [],
  initialProviderId,
  targetKeyId,
  highlightNonce,
  onAddKey,
  onVerifyKey,
  onDeleteKey,
  onUpdateKeyLabel,
  onRefreshKeys
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'email'>(initialProviderId ? 'single' : 'email');
  const [selectedFilter, setSelectedFilter] = useState<ProviderId | 'all'>(initialProviderId || 'all');
  const [newEmail, setNewEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [checkingModelsKeyId, setCheckingModelsKeyId] = useState<string | null>(null);
  const [modelCheckResults, setModelCheckResults] = useState<Record<string, Array<{ modelId: string; name: string; status: 'working' | 'failed'; error?: string; latencyMs?: number }>>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const { activeHighlightKeyId, activeHighlightProviderId, isEmail } = useKeyTargeting(
    keys,
    emails,
    initialProviderId,
    targetKeyId,
    highlightNonce,
    setActiveTab,
    setSelectedFilter
  );

  const handleCheckKeyModels = async (keyId: string) => {
    setCheckingModelsKeyId(keyId);
    try {
      const res = await apiClient.checkKeyModels(keyId);
      if (res.success && res.results) {
        setModelCheckResults(prev => ({ ...prev, [keyId]: res.results }));
        setExpandedKeys(prev => ({ ...prev, [keyId]: true }));
      }
      onRefreshKeys?.();
    } catch (err) {
      console.error('Error checking key models:', err);
    } finally {
      setCheckingModelsKeyId(null);
    }
  };

  useEffect(() => {
    const scanned = Array.from(new Set(keys.map(k => k.label).filter(isEmail)));
    setEmails(prev => Array.from(new Set([...prev, ...scanned])));
  }, [keys]);

  useEffect(() => {
    if (!workspaceId) return;
    let active = true;
    apiClient.getRuntimeAccounts(workspaceId).then((result: any) => {
      if (!active || !result?.success) return;
      const savedGroups = (result.accounts || [])
        .map((account: any) => String(account.metadata?.emailGroup || ''))
        .filter(isEmail);
      if (savedGroups.length) setEmails(prev => Array.from(new Set([...prev, ...savedGroups])));
    }).catch(error => console.error('Unable to load runtime email groups:', error));
    return () => { active = false; };
  }, [workspaceId]);

  const targetProviderHasKeys = initialProviderId ? keys.some(k => k.providerId === initialProviderId) : false;
  const isNewKeyNeeded = Boolean(!targetKeyId && initialProviderId && !targetProviderHasKeys);
  const nonEmailKeys = keys.filter(k => !isEmail(k.label));
  const filteredKeys = selectedFilter === 'all' ? nonEmailKeys : nonEmailKeys.filter(k => k.providerId === selectedFilter);

  return (
    <NeoViewContainer titleIcon={Key} onCloseToGraph={onCloseToGraph}>
      <KeyBackupHeaderBar onOpenBackup={() => setIsBackupModalOpen(true)} />

      <div className="flex items-center gap-1.5 p-1 rounded-lg border-2 border-slate-700 bg-slate-100 dark:bg-slate-900 font-mono text-xs">
        <BaseButton
          variant={activeTab === 'email' ? 'accent' : 'ghost'}
          onClick={() => setActiveTab('email')}
          className="flex-1 flex items-center justify-center gap-2 py-1.5"
        >
          <Mail size={14} />
          <span>EMAIL GROUPS</span>
        </BaseButton>
        <BaseButton
          variant={activeTab === 'single' ? 'accent' : 'ghost'}
          onClick={() => setActiveTab('single')}
          className="flex-1 flex items-center justify-center gap-2 py-1.5"
        >
          <User size={14} />
          <span>SINGLE KEYS</span>
        </BaseButton>
      </div>

      {activeTab === 'single' ? (
        <SingleKeyForm
          keys={keys}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          onAddKey={onAddKey}
          targetProviderId={initialProviderId}
          highlightNonce={highlightNonce}
          isNewKeyNeeded={isNewKeyNeeded}
        />
      ) : (
        <EmailProfileRegistrationForm
          value={newEmail}
          onChange={setNewEmail}
          onSubmit={(event) => {
            event?.preventDefault();
            const mail = newEmail.trim();
            if (mail && isEmail(mail) && !emails.includes(mail)) setEmails(prev => [...prev, mail]);
            setNewEmail('');
          }}
        />
      )}

      <KeyListContainer
        activeTab={activeTab}
        workspaceId={workspaceId}
        emails={emails}
        keys={keys}
        filteredKeys={filteredKeys}
        selectedFilter={selectedFilter}
        usageStats={usageStats}
        activeHighlightKeyId={activeHighlightKeyId}
        activeHighlightProviderId={activeHighlightProviderId}
        highlightNonce={highlightNonce}
        checkingModelsKeyId={checkingModelsKeyId}
        modelCheckResults={modelCheckResults}
        expandedKeys={expandedKeys}
        onToggleExpand={(id, exp) => setExpandedKeys(prev => ({ ...prev, [id]: exp }))}
        onCheckModels={handleCheckKeyModels}
        onAddKey={onAddKey}
        onVerifyKey={onVerifyKey}
        onDeleteKey={onDeleteKey}
        onUpdateKeyLabel={onUpdateKeyLabel}
      />

      <KeyBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        loadExportPayload={apiClient.exportKeysBackup}
        onImport={apiClient.importKeysBackup}
        onRefreshKeys={() => onRefreshKeys?.()}
      />
    </NeoViewContainer>
  );
};