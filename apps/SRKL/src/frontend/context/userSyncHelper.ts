import { SrklWorkspace, UserStorageConnection } from '@/libraries/types/auth';
import { luthFetch } from '../auth/luthAuthClient';

function requestHeaders(workspaceId?: string, json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (workspaceId) headers['x-workspace-id'] = workspaceId;
  return headers;
}

export async function fetchUserServicesApi(_userId: string, workspaceId?: string): Promise<{
  services: any[];
  customDefinitions: any[];
  groups?: any[];
  tabs?: any[];
}> {
  try {
    const res = await luthFetch('/api/user/services', { headers: requestHeaders(workspaceId) });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[UserSync] Failed to fetch services from server:', err);
  }
  return { services: [], customDefinitions: [] };
}

export async function persistGroupApi(_userId: string, group: any, workspaceId?: string): Promise<void> {
  const res = await luthFetch('/api/user/groups', {
    method: 'POST',
    headers: requestHeaders(workspaceId, true),
    body: JSON.stringify({ group, workspaceId }),
  });
  if (!res.ok) throw new Error(`Section save failed (${res.status})`);
}

export async function deleteGroupApi(_userId: string, groupId: string, workspaceId?: string): Promise<void> {
  try {
    await luthFetch(`/api/user/groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
      headers: requestHeaders(workspaceId),
    });
  } catch (err) {
    console.warn('[UserSync] Failed to delete group on server:', err);
  }
}

export async function persistTabApi(_userId: string, tab: any, workspaceId?: string): Promise<void> {
  const res = await luthFetch('/api/user/tabs', {
    method: 'POST',
    headers: requestHeaders(workspaceId, true),
    body: JSON.stringify({ tab, workspaceId }),
  });
  if (!res.ok) throw new Error(`Tab save failed (${res.status})`);
}

export async function deleteTabApi(_userId: string, tabId: string, workspaceId?: string): Promise<void> {
  try {
    await luthFetch(`/api/user/tabs/${encodeURIComponent(tabId)}`, {
      method: 'DELETE',
      headers: requestHeaders(workspaceId),
    });
  } catch (err) {
    console.warn('[UserSync] Failed to delete tab on server:', err);
  }
}

export async function persistServiceAccountApi(_userId: string, serviceAccount: any, workspaceId?: string): Promise<void> {
  const res = await luthFetch('/api/user/services', {
    method: 'POST',
    headers: requestHeaders(workspaceId, true),
    body: JSON.stringify({ serviceAccount, workspaceId }),
  });
  if (!res.ok) throw new Error(`Service save failed (${res.status})`);
  const payload = await res.json();
  const saved = payload.services?.find((account: any) => account.id === serviceAccount.id && account.serviceId === serviceAccount.serviceId);
  if (!saved) throw new Error('The workspace vault did not confirm this service save.');
}

export async function persistServiceDefinitionApi(_userId: string, definition: any, workspaceId?: string): Promise<void> {
  try {
    const res = await luthFetch('/api/user/definitions', {
      method: 'POST',
      headers: requestHeaders(workspaceId, true),
      body: JSON.stringify({ definition, workspaceId }),
    });
    if (!res.ok) throw new Error(`Definition save failed (${res.status})`);
  } catch (err) {
    console.warn('[UserSync] Failed to persist service definition:', err);
  }
}

export async function deleteServiceAccountApi(_userId: string, accountId: string, workspaceId?: string): Promise<void> {
  try {
    await luthFetch(`/api/user/services/${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
      headers: requestHeaders(workspaceId),
    });
  } catch (err) {
    console.warn('[UserSync] Failed to delete service account on server:', err);
  }
}

export async function fetchWorkspacesApi(_userId: string): Promise<{
  workspaces: SrklWorkspace[];
  activeWorkspaceId?: string;
  storage_connections: UserStorageConnection[];
}> {
  try {
    const res = await luthFetch('/api/workspaces', { headers: requestHeaders() });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[UserSync] Failed to fetch workspaces:', err);
  }
  return { workspaces: [], storage_connections: [] };
}

export async function syncWorkspaceVaultApi(_userId: string): Promise<{ success: boolean; synced?: boolean; error?: string }> {
  try {
    const res = await luthFetch('/api/workspaces/sync', {
      method: 'POST',
      headers: requestHeaders(undefined, true),
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Sync failed' };
  }
}
