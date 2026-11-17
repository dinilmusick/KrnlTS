/**
 * @file useUserPersistence.ts
 * @description Hook managing workspace vaults, storage connections, and encryption state.
 * File size < 200 lines strictly.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { UserAccount, SrklWorkspace, UserStorageConnection } from '@/libraries/types/auth';
import { fetchWorkspacesApi, syncWorkspaceVaultApi } from './userSyncHelper';

export function useUserPersistence(currentUser: UserAccount | null) {
  const [workspaces, setWorkspaces] = useState<SrklWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    try {
      return localStorage.getItem('srkl_active_workspace_id') || '';
    } catch {
      return '';
    }
  });
  const [storageConnections, setStorageConnections] = useState<UserStorageConnection[]>([]);
  const [isSyncingVault, setIsSyncingVault] = useState(false);

  const reloadWorkspaces = useCallback(async () => {
    if (!currentUser?.id) {
      setWorkspaces([]);
      setActiveWorkspaceId('');
      setStorageConnections([]);
      return;
    }
    const data = await fetchWorkspacesApi(currentUser.id);
    setWorkspaces(data.workspaces || []);
    setStorageConnections(data.storage_connections || []);
    
    // Respect stored workspace id if present; do not auto-default to server activeWorkspaceId so gate is presented on login
    const savedId = (() => {
      try { return localStorage.getItem('srkl_active_workspace_id'); } catch { return null; }
    })();
    if (savedId && (data.workspaces || []).some((w) => w.id === savedId)) {
      setActiveWorkspaceId(savedId);
    } else {
      setActiveWorkspaceId('');
    }
  }, [currentUser?.id]);

  useEffect(() => {
    reloadWorkspaces();
  }, [reloadWorkspaces]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  const activeStorageConnection = useMemo(() => {
    if (activeWorkspace?.storageConnectionId) {
      const found = storageConnections.find((c) => c.id === activeWorkspace.storageConnectionId);
      if (found) return found;
    }
    return storageConnections.find((c) => c.role === 'primary') || storageConnections[0] || null;
  }, [activeWorkspace, storageConnections]);

  const syncVaultNow = useCallback(async () => {
    if (!currentUser?.id) return { success: false, error: 'No active user session' };
    setIsSyncingVault(true);
    try {
      const res = await syncWorkspaceVaultApi(currentUser.id);
      return res;
    } finally {
      setIsSyncingVault(false);
    }
  }, [currentUser?.id]);

  const switchWorkspace = useCallback((wsId: string) => {
    setActiveWorkspaceId(wsId);
    try {
      if (wsId) {
        localStorage.setItem('srkl_active_workspace_id', wsId);
      } else {
        localStorage.removeItem('srkl_active_workspace_id');
      }
    } catch {}
  }, []);

  return {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    storageConnections,
    activeStorageConnection,
    isSyncingVault,
    syncVaultNow,
    switchWorkspace,
    reloadWorkspaces,
    setWorkspaces,
    setStorageConnections,
  };
}

