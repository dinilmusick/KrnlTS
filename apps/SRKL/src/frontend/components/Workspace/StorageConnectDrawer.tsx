'use client';

import { luthFetch } from '../../auth/luthAuthClient';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import { X, Cloud, Plus } from 'lucide-react';
import { BaseIconButton } from '../common/BaseIconButton';
import { BaseButton } from '@skipo/ui';
import { UserStorageConnection } from '@/libraries/types/auth';
import { StorageSavedConnectionsGrid } from './Storage/StorageSavedConnectionsGrid';
import { StorageSyncToClonesBanner } from './Storage/StorageSyncToClonesBanner';
import { StorageNewConnectionForm } from './Storage/StorageNewConnectionForm';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════
interface StorageConnectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSaved?: (conn: UserStorageConnection) => void;
  userId: string;
  activeConnectionId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: STORAGE CONNECT DRAWER
// ═══════════════════════════════════════════════════════════════════════════
export default function StorageConnectDrawer({
  isOpen,
  onClose,
  onConnectionSaved,
  userId,
  activeConnectionId,
}: StorageConnectDrawerProps) {
  const [connections, setConnections] = useState<UserStorageConnection[]>([]);
  const externalConnections = connections.filter((connection) => connection.provider !== 'local_fs');
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingClones, setSyncingClones] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await luthFetch('/api/workspaces/storage/connections', {
        
      });
      const data = await res.json();
      if (data.connections) setConnections(data.connections);
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen, fetchConnections]);

  if (!isOpen) return null;

  const handleSetPrimary = async (conn: UserStorageConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await luthFetch('/api/workspaces/storage/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_primary', id: conn.id }),
      });
      const data = await res.json();
      if (data.success && data.connections) {
        setConnections(data.connections);
        setBannerNotice(`★ Storage elevated to Primary: ${conn.label}`);
        if (onConnectionSaved) onConnectionSaved(conn);
      }
    } catch (err: any) {
      setBannerNotice(`Failed to elevate primary: ${err.message}`);
    }
  };

  const handleDelete = async (connId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Remove this storage connection?')) return;
    try {
      const res = await luthFetch(`/api/workspaces/storage/connections/${connId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.connections) {
        setConnections(data.connections);
        setBannerNotice('Storage connection removed.');
      }
    } catch {}
  };

  const handleSyncClones = async (targetCloneIds?: string[]) => {
    setSyncingClones(true);
    try {
      const res = await luthFetch('/api/workspaces/storage/sync-clones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloneIds: targetCloneIds }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerNotice(`Successfully replicated workspace files to ${data.syncedClones?.length || 0} clone(s)!`);
      }
    } catch (err: any) {
      setBannerNotice(`Sync clones failed: ${err.message}`);
    } finally {
      setSyncingClones(false);
    }
  };

  const handleSaveNewConnection = async (payload: Partial<UserStorageConnection>) => {
    const res = await luthFetch('/api/workspaces/storage/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection: payload }),
    });
    const data = await res.json();
    if (data.success && data.connections) {
      setConnections(data.connections);
      setShowAddForm(false);
      setBannerNotice(data.message || 'Storage connection saved.');
      if (onConnectionSaved && data.connection) onConnectionSaved(data.connection);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-mono">
      <div
        className="w-full max-w-2xl border-2 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          backgroundColor: 'var(--skipo-surface)',
          borderColor: 'var(--skipo-border-color)',
          borderRadius: 'var(--skipo-radius)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm uppercase tracking-wider">WORKSPACE STORAGE &amp; CLONES</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BaseButton
              variant={showAddForm ? 'secondary' : 'accent'}
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-[10px] font-black uppercase flex items-center gap-1"
            >
              <Plus size={11} />
              <span>{showAddForm ? 'SHOW STORAGE' : 'ADD STORAGE'}</span>
            </BaseButton>
            <BaseIconButton tooltip="Close" icon={<X size={16} />} variant="ghost" size="sm" onClick={onClose} />
          </div>
        </div>

        {bannerNotice && (
          <div className="p-2 border border-amber-400/40 bg-amber-400/10 text-amber-300 text-xs font-bold flex items-center justify-between">
            <span>{bannerNotice}</span>
            <BaseIconButton tooltip="Dismiss" icon={<X size={12} />} variant="ghost" size="sm" onClick={() => setBannerNotice(null)} />
          </div>
        )}

        {showAddForm ? (
          <StorageNewConnectionForm
            savedConnections={externalConnections}
            onSave={handleSaveNewConnection}
            onCancel={() => setShowAddForm(false)}
            />
        ) : (
          <>
            <StorageSavedConnectionsGrid
              savedConnections={externalConnections}
              activeConnId={activeConnectionId || externalConnections.find((c) => c.role === 'primary')?.id}
              syncingClones={syncingClones}
              onSelectConnection={(conn) => {
                if (conn.role !== 'primary') handleSetPrimary(conn, {} as any);
              }}
              onDeleteConnection={handleDelete}
              onSetPrimaryConnection={handleSetPrimary}
              onSyncSingleClone={(conn) => handleSyncClones([conn.id])}
            />

            <StorageSyncToClonesBanner
              savedConnections={externalConnections}
              syncingClones={syncingClones}
              onSyncToClones={() => handleSyncClones()}
            />
          </>
        )}
      </div>
    </div>
  );
}
