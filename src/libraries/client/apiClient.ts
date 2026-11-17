// ══════════════════════════════════════════════════════════════════════════════
// SKIPO CANONICAL API CLIENT
// Encapsulates network communication so UI components remain transport-agnostic.
// ══════════════════════════════════════════════════════════════════════════════

import { useInspectionStore } from '../../frontend-state/inspectionStore';
import { luthAuthClient, luthFetch } from './luthAuthClient';

async function wrappedFetch(url: string, init?: RequestInit): Promise<Response> {
  const store = useInspectionStore.getState();
  store.incrementApiCount();
  try {
    return await luthFetch(url, init);
  } finally {
    store.decrementApiCount();
  }
}

async function jsonOrThrow<T = any>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `API request failed: ${res.status}`);
  return data as T;
}

export const apiClient = {
  async login(email?: string, password?: string, isAdmin: boolean = false) {
    if (isAdmin) throw new Error('Administrative authentication is not provided by Luth user login.');
    await luthAuthClient.signInWithEmail({ email: email || '', password: password || '' });
    return luthAuthClient.getSession();
  },

  async register(data: { name: string; email: string; password: string; role?: string }) {
    await luthAuthClient.signUpWithEmail({ name: data.name, email: data.email, password: data.password });
    return luthAuthClient.getSession();
  },

  async getWorkspaces() {
    return jsonOrThrow(await wrappedFetch('/api/auth/workspaces'));
  },

  async createWorkspace(_userId: string, data: Record<string, unknown>) {
    const result = await jsonOrThrow<any>(await wrappedFetch('/api/auth/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace: data }),
    }));
    return result.workspace ?? result;
  },

  async updateWorkspace(workspaceId: string, updates: Record<string, unknown>) {
    return jsonOrThrow(await wrappedFetch('/api/auth/workspaces', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, updates }),
    }));
  },

  async deleteWorkspace(workspaceId: string) {
    return jsonOrThrow(await wrappedFetch(`/api/auth/workspaces?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    }));
  },

  async getSrklAccounts(service?: string) {
    const query = service ? `?service=${encodeURIComponent(service)}` : '';
    return jsonOrThrow(await wrappedFetch(`/api/srkl/accounts${query}`));
  },
};
