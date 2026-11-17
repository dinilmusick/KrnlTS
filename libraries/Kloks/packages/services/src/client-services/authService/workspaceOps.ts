import { UserWorkspaceRecord } from '@kloks/state-graph';
import { IAuthStore } from './types';

export async function fetchWorkspaces(store: any): Promise<UserWorkspaceRecord[]> {
  const userId = store.currentUser?.id;
  if (!userId) return [];
  try {
    const res = await fetch(`/api/auth/workspaces?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.workspaces)) {
        if (store.currentUser) {
          store.currentUser.workspaces = data.workspaces;
          if (
            store.currentUser.activeWorkspaceId &&
            !data.workspaces.some((w: any) => w.id === store.currentUser.activeWorkspaceId)
          ) {
            store.currentUser.activeWorkspaceId = data.activeWorkspaceId || null;
          }
        }
        return data.workspaces;
      }
    }
  } catch {
    // fallback
  }

  if (store.currentUser?.workspaces) {
    return store.currentUser.workspaces;
  }
  return [];
}

export async function createWorkspace(
  store: any,
  params: {
    name: string;
    description?: string;
    engine?: any;
    storageProvider?: any;
    storageConnectionId?: string;
    localFolderName?: string;
    localFolderKey?: string;
    workspacePath?: string;
  }
): Promise<UserWorkspaceRecord | null> {
  const userId = store.currentUser?.id;
  if (!userId) return null;
  try {
    const res = await fetch('/api/auth/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, workspace: params }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.workspace) {
        await store.fetchWorkspaces();
        store.notify();
        return data.workspace;
      }
    }
  } catch {
    // fallback
  }

  const newWs: UserWorkspaceRecord = {
    id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: params.name,
    description: params.description || 'Workspace cluster',
    engine: params.engine || 'local_fs',
    workspacePath: params.workspacePath || `depm_${params.name.toLowerCase().replace(/\s+/g, '_')}`,
    storageProvider: params.storageProvider || 'local_fs',
    storageConnectionId: params.storageConnectionId,
    localFolderName: params.localFolderName,
    localFolderKey: params.localFolderKey,
    createdAt: new Date().toISOString(),
    ecosystemName: `${params.name} Ecosystem`,
    appsCount: 0,
    accountsCount: 0,
    deploymentsCount: 0,
  };
  if (store.currentUser) {
    store.currentUser.workspaces = [...(store.currentUser.workspaces || []), newWs];
    store.notify();
  }
  return newWs;
}

export async function updateWorkspace(store: any, workspaceId: string, updates: Partial<UserWorkspaceRecord>): Promise<boolean> {
  const userId = store.currentUser?.id || 'usr_admin_01';
  try {
    const res = await fetch('/api/auth/workspaces', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, workspaceId, updates }),
    });
    if (res.ok) {
      await store.fetchWorkspaces();
      store.notify();
      return true;
    }
  } catch {
    // fallback
  }
  if (store.currentUser && store.currentUser.workspaces) {
    store.currentUser.workspaces = store.currentUser.workspaces.map((w: any) =>
      w.id === workspaceId ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
    );
    store.notify();
    return true;
  }
  return false;
}

export async function deleteWorkspace(store: any, workspaceId: string): Promise<boolean> {
  const userId = store.currentUser?.id || 'usr_admin_01';
  try {
    const res = await fetch(`/api/auth/workspaces?userId=${encodeURIComponent(userId)}&workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (store.currentUser && store.currentUser.activeWorkspaceId === workspaceId) {
        store.currentUser.activeWorkspaceId = null;
      }
      await store.fetchWorkspaces();
      if (store.currentUser && typeof window !== 'undefined') {
        localStorage.setItem('docustack_user_account', JSON.stringify(store.currentUser));
      }
      store.notify();
      return true;
    }
  } catch {
    // fallback
  }
  if (store.currentUser && store.currentUser.workspaces) {
    store.currentUser.workspaces = store.currentUser.workspaces.filter((w: any) => w.id !== workspaceId);
    if (store.currentUser.activeWorkspaceId === workspaceId) {
      store.currentUser.activeWorkspaceId = store.currentUser.workspaces[0]?.id || null;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('docustack_user_account', JSON.stringify(store.currentUser));
    }
    store.notify();
    return true;
  }
  return false;
}

export function setActiveWorkspace(store: any, workspaceId: string) {
  if (store.currentUser) {
    store.currentUser.activeWorkspaceId = workspaceId;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('docustack_user_account', JSON.stringify(store.currentUser));
      }
    } catch {}
    store.notify();
  }
}
