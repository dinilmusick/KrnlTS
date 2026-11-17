import { luthFetch } from '../../auth/luthAuthClient';
'use client';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { HardDrive, Cloud, RefreshCw, CheckCircle2, Copy, Check, Plus } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { BaseIconButton } from '../common/BaseIconButton';
import { BaseButton } from '@skipo/ui';
import StorageConnectDrawer from '../Workspace/StorageConnectDrawer';
import { StorageSavedConnectionsGrid } from '../Workspace/Storage/StorageSavedConnectionsGrid';
import { StorageSyncToClonesBanner } from '../Workspace/Storage/StorageSyncToClonesBanner';
import { UserStorageConnection } from '@/libraries/types/auth';
import { formatCanonicalWorkspaceFolderName } from '@/libraries/functions/workspaceCanonical';


// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: WORKSPACE STORAGE & CLONES SECTION
// ═══════════════════════════════════════════════════════════════════════════
export function WorkspaceStorageSection(): React.ReactElement {
  const {
    currentUser,
    activeWorkspace,
    activeStorageConnection,
    storageConnections,
    isSyncingVault,
    syncVaultNow,
    reloadWorkspaces,
    logout,
  } = useHub();

  const [copied, setCopied] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isStorageDrawerOpen, setIsStorageDrawerOpen] = useState(false);
  const [syncingClones, setSyncingClones] = useState(false);

  const currentUserName = currentUser?.username || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'user');
  const folderName = (activeWorkspace?.workspacePath || '').replace(/^\.\//, '') ||
    formatCanonicalWorkspaceFolderName('srkl', currentUserName, activeWorkspace?.name || 'vault');

  const isB2 = activeWorkspace?.storageProvider === 'backblaze_b2' || Boolean(activeStorageConnection);

  const handleCopy = () => {
    navigator.clipboard.writeText(folderName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSyncVault = async () => {
    setSyncFeedback('Syncing encrypted SQLite vault to storage...');
    const res = await syncVaultNow();
    setSyncFeedback(res.success ? 'Vault synced to storage!' : `Sync note: ${res.error || 'Flushed'}`);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleSetPrimary = async (conn: UserStorageConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    try {
      const res = await luthFetch('/api/workspaces/storage/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_primary', id: conn.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`★ ${conn.label} elevated to Primary!`);
        reloadWorkspaces();
        setTimeout(() => setSyncFeedback(null), 3000);
      }
    } catch (err: any) { setSyncFeedback(`Error: ${err.message}`); }
  };

  const handleDelete = async (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.id || !window.confirm('Remove this storage connection?')) return;
    try {
      await luthFetch(`/api/workspaces/storage/connections/${connId}`, {
        method: 'DELETE',
      });
      reloadWorkspaces();
    } catch {}
  };

  const handleSyncClones = async (targetCloneIds?: string[]) => {
    if (!currentUser?.id) return;
    setSyncingClones(true);
    try {
      const res = await luthFetch('/api/workspaces/storage/sync-clones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloneIds: targetCloneIds }),
      });
      const data = await res.json();
      setSyncFeedback(data.success ? `Replicated vault & files to ${data.syncedClones?.length || 0} clone(s)!` : 'Replication failed.');
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
    } finally {
      setSyncingClones(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div
      className="p-4 border-2 space-y-4 font-mono text-xs select-none"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        boxShadow: 'var(--skipo-shadow)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--skipo-border-color)' }}>
        <div className="flex items-center gap-2">
          {isB2 ? <Cloud className="w-4 h-4 text-amber-400" /> : <HardDrive className="w-4 h-4 text-amber-400" />}
          <span className="text-xs font-bold uppercase" style={{ color: 'var(--skipo-text)' }}>
            Workspace Storage &amp; Clones
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BaseButton variant="secondary" size="sm" onClick={() => setIsStorageDrawerOpen(true)} className="flex items-center gap-1">
            <Plus size={12} />
            <span>CONNECT STORAGE</span>
          </BaseButton>
          <BaseIconButton
            tooltip="Sync encrypted SQLite vault now"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingVault ? 'animate-spin' : ''}`} />}
            variant="primary"
            size="sm"
            onClick={handleSyncVault}
            disabled={isSyncingVault}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border bg-black/25" style={{ borderColor: 'var(--skipo-border-color)' }}>
        <div>
          <span className="text-sm font-black uppercase block text-amber-400">
            {activeWorkspace?.name || 'SRKL Service Hub'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] opacity-60">Canonical Prefix:</span>
            <BaseButton variant="ghost" size="sm" onClick={handleCopy} className="inline-flex items-center gap-1 text-[10px] text-amber-400 px-1.5 py-0.5 border">
              <span>{folderName}</span>
              {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="opacity-60" />}
            </BaseButton>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BaseButton variant="accent" size="sm" onClick={handleSyncVault} disabled={isSyncingVault}>{isSyncingVault ? 'Syncing...' : 'Sync Vault'}</BaseButton>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-2.5 border text-xs flex items-center gap-2 border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold">
          <CheckCircle2 size={14} />
          <span>{syncFeedback}</span>
        </div>
      )}

      <StorageSavedConnectionsGrid
        savedConnections={storageConnections}
        activeConnId={activeStorageConnection?.id}
        syncingClones={syncingClones}
        onSelectConnection={(conn) => { if (conn.role !== 'primary') handleSetPrimary(conn, {} as any); }}
        onDeleteConnection={handleDelete}
        onSetPrimaryConnection={handleSetPrimary}
        onSyncSingleClone={(conn) => handleSyncClones([conn.id])}
      />

      <StorageSyncToClonesBanner
        savedConnections={storageConnections}
        syncingClones={syncingClones}
        onSyncToClones={() => handleSyncClones()}
      />

      {currentUser && (
        <>
          <StorageConnectDrawer
            isOpen={isStorageDrawerOpen}
            onClose={() => setIsStorageDrawerOpen(false)}
            onConnectionSaved={() => { reloadWorkspaces(); }}
            userId={currentUser.id}
            activeConnectionId={activeStorageConnection?.id}
          />
        </>
      )}
    </div>
  );
}
