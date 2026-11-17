/**
 * @file useAuthWorkspaceEngine.ts
 * @description Master Auth and Workspace State Engine.
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient, luthAuthClient } from '../../libraries/apiClient.js';
import { UserAccount, UserWorkspaceRecord, SystemDbStatus, GuestSession } from '../types/auth.js';

export * from '../types/auth.js';

export function useAuthWorkspaceEngine() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<UserWorkspaceRecord[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isWorkspacesMenuOpen, setIsWorkspacesMenuOpen] = useState(false);
  const [systemDbStatus, setSystemDbStatus] = useState<SystemDbStatus>({});
  const [storageConnections, setStorageConnections] = useState<any[]>([]);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [guestAvailable] = useState(true);

  const refreshSystemDbStatus = useCallback(async () => {
    try {
      const res = await apiClient.getSystemDatabaseStatus();
      if (res?.success && res.cluster) {
        setSystemDbStatus({
          connected: res.cluster.status === 'connected',
          latencyMs: typeof res.cluster.latencyMs === 'number' ? res.cluster.latencyMs : undefined,
          clusterName: typeof res.cluster.clusterName === 'string' ? res.cluster.clusterName : undefined,
          engine: typeof res.cluster.engine === 'string' ? res.cluster.engine : undefined,
        });
      }
    } catch { setSystemDbStatus((prev) => ({ ...prev, connected: false })); }
  }, []);

  const syncUserWorkspaces = useCallback((user: UserAccount) => {
    const wsList = user.workspaces || [];
    setWorkspaces(wsList);
    const targetId = (wsList.some((w: any) => w.id === user.activeWorkspaceId) ? user.activeWorkspaceId : wsList[0]?.id) || null;
    setActiveWorkspaceId(targetId);
    if (targetId) localStorage.setItem('aiko_active_workspace_id', targetId);
    else localStorage.removeItem('aiko_active_workspace_id');
    refreshSystemDbStatus();
  }, [refreshSystemDbStatus]);

  useEffect(() => {
    const savedWsId = typeof window !== 'undefined' ? localStorage.getItem('aiko_active_workspace_id') : null;
    let active = true;
    refreshSystemDbStatus();
    (async () => {
      let luthUser: UserAccount | null = null;
      try {
        const session = await luthAuthClient.getSession();
        if (session?.authenticated && session.user) {
          luthUser = { id: session.user.id, email: session.user.email, name: session.user.name, role: (session.user as any).role || 'user' };
        }
      } catch {}
      const res = await apiClient.getMe().catch(() => null);
      if (!active) return;
      if (res?.success && res.user) {
        setCurrentUser(res.user);
        const userWs = res.user.workspaces || [];
        setWorkspaces(userWs);
        const workspaceData = await apiClient.getWorkspaces().catch(() => null);
        setStorageConnections(Array.isArray(workspaceData?.storage_connections) ? workspaceData.storage_connections : []);
        const validSaved = userWs.some((w: any) => w.id === savedWsId) ? savedWsId : null;
        const validUserActive = userWs.some((w: any) => w.id === res.user.activeWorkspaceId) ? res.user.activeWorkspaceId : null;
        setActiveWorkspaceId(validSaved || validUserActive || userWs[0]?.id || null);
      } else if (luthUser) {
        setCurrentUser(luthUser); setWorkspaces([]); setActiveWorkspaceId(null);
      }
    })().finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, [refreshSystemDbStatus]);

  const handleLogin = async (email: string, password: string) => {
    const res = await apiClient.login({ email, password });
    if (res.success && res.user) {
      setGuestSession(null);
      setCurrentUser(res.user);
      syncUserWorkspaces(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Authentication failed' };
  };

  const handleRegister = async (data: { email: string; password: string; name?: string; role?: string }) => {
    const res = await apiClient.register(data);
    if (res.success && res.user) {
      setGuestSession(null);
      setCurrentUser(res.user);
      syncUserWorkspaces(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const handleGuestLogin = async () => {
    setCurrentUser(null);
    setGuestSession({
      leaseId: 'guest-session',
      workspaceId: 'ephemeral',
      appId: 'aiko',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
      capabilities: ['workspace.read', 'workspace.write'],
    });
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    localStorage.removeItem('aiko_active_workspace_id');
    return { success: true };
  };

  const handleGuestLogout = useCallback(async () => {
    setGuestSession(null);
    setActiveWorkspaceId(null);
    setCurrentUser(null);
    localStorage.removeItem('aiko_active_workspace_id');
  }, []);

  const handleLogout = async () => {
    try { await apiClient.logout(); } catch {}
    luthAuthClient.clearAuthToken();
    setGuestSession(null);
    setCurrentUser(null);
    setActiveWorkspaceId(null);
    localStorage.removeItem('aiko_active_workspace_id');
  };

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id); localStorage.setItem('aiko_active_workspace_id', id);
    setIsWorkspacesMenuOpen(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await luthAuthClient.ensureRegistered();
      const val = (await luthAuthClient.signInWithGoogle()) as { url?: string } | null;
      const redirectUrl = val && typeof val === 'object' ? val.url : undefined;
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.assign(redirectUrl);
        return { success: true, redirectUrl };
      }
      const session = await luthAuthClient.getSession();
      if (session.authenticated && session.user) {
        setCurrentUser(session.user as any);
        return { success: true, user: session.user };
      }
      return { success: false, error: 'Google sign-in did not complete.' };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Google sign-in failed.' };
    }
  };

  const handleCreateWorkspace = async (name: string, description?: string, engineOrOptions?: string | Record<string, any>) => {
    const opts = typeof engineOrOptions === 'object' ? engineOrOptions : { engine: engineOrOptions };
    const res = await apiClient.createWorkspace({ name, description, ...opts, userId: currentUser?.id });
    if (res.success && res.workspace) {
      const updatedList = res.workspaces || [...workspaces, res.workspace];
      setWorkspaces(updatedList);
      if (currentUser) currentUser.workspaces = updatedList;
      setActiveWorkspaceId(res.workspace.id);
      localStorage.setItem('aiko_active_workspace_id', res.workspace.id);
      setIsWorkspacesMenuOpen(false);
      return true;
    }
    return false;
  };

  const handleDeleteWorkspace = async (id: string) => {
    const res = await apiClient.deleteWorkspace(id);
    if (res.success && res.workspaces) {
      setWorkspaces(res.workspaces);
      if (activeWorkspaceId === id) {
        const nextId = res.workspaces[0]?.id || null;
        setActiveWorkspaceId(nextId);
        if (nextId) localStorage.setItem('aiko_active_workspace_id', nextId);
        else localStorage.removeItem('aiko_active_workspace_id');
      }
      return true;
    }
    return false;
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  return {
    currentUser, userToken: (luthAuthClient as any).tokenStore.get() || null,
    storageConnections,
    activeWorkspaceId, activeWorkspace, workspaces, authChecked, systemDbStatus,
    guestSession, guestAvailable, isWorkspacesMenuOpen, setIsWorkspacesMenuOpen,
    handleLogin, handleRegister, handleGoogleLogin, handleGuestLogin,
    handleGuestLogout, handleLogout, handleSelectWorkspace,
    handleCreateWorkspace, handleDeleteWorkspace, refreshSystemDbStatus,
  };
}
