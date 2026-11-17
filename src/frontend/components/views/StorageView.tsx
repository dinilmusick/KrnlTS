/**
 * ASCII Architecture Flowchart: StorageView
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize StorageView      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           StorageView            │
 *   └──────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { NeoButton } from '../common/NeoButton.js';
import { apiClient } from '../../../libraries/apiClient.js';
import { StorageProviderSelector } from './storage/StorageProviderSelector.js';
import { StorageReplicasPanel, StorageEndpoint } from './storage/StorageReplicasPanel.js';

// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

interface StorageConfigState {
  primary: StorageEndpoint;
  backups: StorageEndpoint[];
  sync: {
    status: 'synced' | 'syncing' | 'error';
    lastSyncTimestamp: number;
    pendingOperations: number;
    divergenceCount: number;
  };
}

// ════ STORAGEVIEW IMPLEMENTATION ═══════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

export const StorageView: React.FC = () => {
  const [config, setConfig] = useState<StorageConfigState>({
    primary: { id: 'ep_local_primary', provider: 'local_fs', label: 'Local Folder', status: 'CONNECTED' },
    backups: [
      { id: 'ep_b2_replica', provider: 'backblaze_b2', label: 'Backblaze B2', status: 'CONNECTED' },
      { id: 'ep_supabase_replica', provider: 'supabase_storage', label: 'Supabase', status: 'CONNECTED' }
    ],
    sync: { status: 'synced', lastSyncTimestamp: Date.now(), pendingOperations: 0, divergenceCount: 0 }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('local_fs');

  const fetchConfig = async () => {
    try {
      const data = await apiClient.getStorageConfig();
      if (data.success && data.config) {
        setConfig(data.config);
        setSelectedProvider(data.config.primary.provider);
      }
    } catch {
      // Standby defaults preserved
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSetPrimary = async (provider: string) => {
    try {
      setSelectedProvider(provider);
      await apiClient.setStoragePrimary(provider);
      await fetchConfig();
    } catch (e) {
      console.warn('Storage provider selection error:', e);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await apiClient.triggerStorageSync();
      await fetchConfig();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-6">
      {/* Top Header Card */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-700 dark:border-slate-400 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.8)] dark:shadow-[4px_4px_0px_0px_rgba(148,163,184,0.3)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border-2 border-slate-700 dark:border-slate-400 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {config.primary.label}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              <span>{config.sync.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NeoButton
            icon={RefreshCw}
            tooltipText="Verify Replicas & Synchronize"
            onClick={handleTriggerSync}
            variant="secondary"
            size="md"
            disabled={isSyncing}
          />
        </div>
      </div>

      {/* Storage Providers Selector */}
      <StorageProviderSelector
        selectedProvider={selectedProvider}
        onSelectProvider={handleSetPrimary}
      />

      {/* Active Replicas Panel */}
      <StorageReplicasPanel backups={config.backups} />
    </div>
  );
};