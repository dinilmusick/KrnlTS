/**
 * @file HubContext.tsx
 * @description Master Reactive State Context for SRKL Service Hub.
 * Wires Registry, Accounts, Surveillance, Activity, and User Database Persistence.
 * File size < 200 lines strictly.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AuthLoadingScreen } from '@ultrst-armada/floks/ui';
import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { StorageRuntime, HubSettings } from '@/libraries/runtime/StorageRuntime';
import { ActivityRecord, SurveillanceMetrics, TabType } from '@/libraries/types/srkl';
import { UserAccount } from '@/libraries/types/auth';
import { HubContextType } from './hubTypes';
import { useUserPersistence } from './useUserPersistence';
import { useTelemetryListener } from './useTelemetryListener';
import { useHubActions } from './useHubActions';
import { useGroupTabActions } from './useGroupTabActions';
import { fetchUserServicesApi } from './userSyncHelper';
import { luthAuthClient, luthFetch } from '../auth/luthAuthClient';

function hasInitialAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(sessionStorage.getItem('luth-session-token') || window.location.search.includes('token='));
  } catch {
    return false;
  }
}

const HubContext = createContext<HubContextType | null>(null);

export function HubProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('SERVICES');
  const [settings, setSettings] = useState<HubSettings>(() => StorageRuntime.loadSettings());
  // Service accounts are always loaded from the active workspace vault. Keeping
  // a browser copy would allow stale or hidden accounts to reappear.
  const [accounts, setAccounts] = useState<ServiceAccount[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityRecord[]>(() => StorageRuntime.loadActivityLogs());
  const [metrics, setMetrics] = useState<Record<string, SurveillanceMetrics>>({});
  const [registryVersion, setRegistryVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authHydrated, setAuthHydrated] = useState(() => !hasInitialAuthToken());

  useEffect(() => {
    if (!hasInitialAuthToken()) {
      setAuthHydrated(true);
      return;
    }
    const timeout = new Promise<{ authenticated: false }>((resolve) =>
      setTimeout(() => resolve({ authenticated: false }), 4000)
    );
    void Promise.race([luthAuthClient.getSession(), timeout])
      .then((session) => {
        if (!session.authenticated || !session.user) {
          luthAuthClient.clearAuthToken();
          return;
        }
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          username: session.user.email.split('@')[0],
          role: 'user',
          avatarGlyph: '👤',
        });
      })
      .catch(() => {
        luthAuthClient.clearAuthToken();
      })
      .finally(() => setAuthHydrated(true));
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    void luthFetch('/api/user/profile').then((response) => response.json()).then((result) => {
      if (!active || !result?.success) return;
      const role = result.user?.role === 'admin' ? 'admin' : 'user';
      setCurrentUser((previous) => previous?.id === currentUser.id && previous.role !== role
        ? { ...previous, role } : previous);
    }).catch(() => {});
    return () => { active = false; };
  }, [currentUser?.id]);

  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    storageConnections,
    activeStorageConnection,
    isSyncingVault,
    syncVaultNow,
    switchWorkspace,
    reloadWorkspaces,
  } = useUserPersistence(currentUser);

  const groupTabActions = useGroupTabActions(setAccounts, activeWorkspaceId, currentUser);
  const { setGroups, setTabs } = groupTabActions;

  useTelemetryListener({ setAccounts, setActivityLogs, setSettings, setRegistryVersion });

  const accountsRef = useRef<ServiceAccount[]>(accounts);
  accountsRef.current = accounts;

  useEffect(() => {
    if (!currentUser || !activeWorkspaceId) {
      setAccounts([]);
      return;
    }
    setAccounts([]);
    // Immediately load workspace-scoped groups & tabs
    setGroups(StorageRuntime.loadGroups(activeWorkspaceId));
    setTabs(StorageRuntime.loadTabs(activeWorkspaceId));

    fetchUserServicesApi(currentUser.id, activeWorkspaceId).then((data) => {
      if (data.services) {
        const hydrated = data.services.map((s: any) => new ServiceAccount(s));
        setAccounts(hydrated);
      }
      if (data.customDefinitions?.length) {
        StorageRuntime.saveCustomDefinitions(data.customDefinitions);
        setRegistryVersion((v) => v + 1);
      }
      // An empty vault is valid. It must replace stale browser data rather than
      // resurrecting the old placeholder tabs and sections.
      if (Array.isArray(data.groups)) {
        setGroups(data.groups);
        StorageRuntime.saveGroups(data.groups, activeWorkspaceId);
      }
      if (Array.isArray(data.tabs)) {
        setTabs(data.tabs);
        StorageRuntime.saveTabs(data.tabs, activeWorkspaceId);
      }
    });
  }, [currentUser?.id, activeWorkspaceId, setGroups, setTabs]);

  const login = useCallback((user: UserAccount) => {
    try { localStorage.removeItem('srkl_active_workspace_id'); } catch {}
    switchWorkspace('');
    setCurrentUser(user);
  }, [switchWorkspace]);

  const logout = useCallback(async () => {
    await luthAuthClient.signOut();
    try {
      localStorage.removeItem('srkl_active_workspace_id');
    } catch {}
    switchWorkspace('');
    setCurrentUser(null);
  }, [switchWorkspace]);

  const registry = useMemo(() => {
    const reg = new ServiceRegistry();
    const customDefs = StorageRuntime.loadCustomDefinitions();
    for (const def of customDefs) reg.registerCustomDefinition(def);
    return reg;
  }, [registryVersion]);

  const hubActions = useHubActions({
    registry,
    accountsRef,
    currentUser,
    activeWorkspaceId,
    setAccounts,
    setMetrics,
    setActivityLogs,
    setRegistryVersion,
    setSettings,
  });

  const contextValue = useMemo(
    () => ({
      activeTab, setActiveTab, registry, accounts, activityLogs, settings, metrics,
      currentUser, login, logout, workspaces, activeWorkspaceId, activeWorkspace,
      storageConnections, activeStorageConnection, isSyncingVault, syncVaultNow,
      switchWorkspace, reloadWorkspaces, ...hubActions, ...groupTabActions,
    }),
    [
      activeTab, registry, accounts, activityLogs, settings, metrics, currentUser,
      login, logout, workspaces, activeWorkspaceId, activeWorkspace, storageConnections,
      activeStorageConnection, isSyncingVault, syncVaultNow, switchWorkspace,
      reloadWorkspaces, hubActions, groupTabActions,
    ]
  );

  if (!authHydrated) return <AuthLoadingScreen label="AUTHENTICATING..." />;

  return <HubContext.Provider value={contextValue}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextType {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used within a HubProvider');
  return ctx;
}
