/**
 * @file useGroupTabActions.ts
 * @description Reactive state manager for Service Groups and Service Tabs.
 * File size < 200 lines strictly.
 */

import { useState, useCallback, useEffect } from 'react';
import { ServiceGroup, ServiceTab } from '@/libraries/types/srkl';
import { StorageRuntime } from '@/libraries/runtime/StorageRuntime';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { UserAccount } from '@/libraries/types/auth';
import { persistGroupApi, deleteGroupApi, persistTabApi, deleteTabApi, persistServiceAccountApi, deleteServiceAccountApi } from './userSyncHelper';
import { buildClonedTabGroups, sanitizeDisjointTabGroups, unlinkAccountFromGroup, resolveSavedTabId, removeGroupFromAccounts } from './useGroupTabHelpers';

export function useGroupTabActions(
  setAccounts: React.Dispatch<React.SetStateAction<ServiceAccount[]>>,
  activeWorkspaceId?: string,
  currentUser?: UserAccount | null
) {
  const [groups, setGroups] = useState<ServiceGroup[]>(() => StorageRuntime.loadGroups(activeWorkspaceId));
  const [tabs, setTabs] = useState<ServiceTab[]>(() => StorageRuntime.loadTabs(activeWorkspaceId));
  const [activeServiceTabId, setActiveServiceTabIdState] = useState<string>(() =>
    resolveSavedTabId(activeWorkspaceId, StorageRuntime.loadTabs(activeWorkspaceId))
  );

  const setActiveServiceTabId = useCallback((tabId: string) => {
    setActiveServiceTabIdState(tabId);
    if (activeWorkspaceId) {
      try { localStorage.setItem(`srkl_active_tab_${activeWorkspaceId}`, tabId); } catch {}
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!tabs || tabs.length === 0) return;
    const target = resolveSavedTabId(activeWorkspaceId, tabs);
    if (activeServiceTabId !== target && tabs.some((t) => t.id === target)) {
      setActiveServiceTabIdState(target);
    }
  }, [activeWorkspaceId, tabs, activeServiceTabId]);

  // Enforce disjoint group isolation across tabs
  useEffect(() => {
    if (!tabs.length || !groups.length) return;
    const { updatedTabs, newGroupsToAdd, hasChanges } = sanitizeDisjointTabGroups(tabs, groups);
    if (!hasChanges) return;
    if (newGroupsToAdd.length > 0) {
      setGroups((prev) => { const next = [...prev, ...newGroupsToAdd]; StorageRuntime.saveGroups(next, activeWorkspaceId); return next; });
      if (currentUser?.id) newGroupsToAdd.forEach((g) => persistGroupApi(currentUser.id, g, activeWorkspaceId));
    }
    setTabs(updatedTabs);
    StorageRuntime.saveTabs(updatedTabs, activeWorkspaceId);
    if (currentUser?.id) updatedTabs.forEach((t) => persistTabApi(currentUser.id, t, activeWorkspaceId));
  }, [tabs, groups, activeWorkspaceId, currentUser?.id]);

  const addGroup = useCallback(async (group: ServiceGroup) => {
    setGroups((prev) => {
      const updated = [...prev, group];
      StorageRuntime.saveGroups(updated, activeWorkspaceId);
      return updated;
    });

    const targetTabs: ServiceTab[] = [];
    setTabs((prevTabs) => {
      const realTabId = activeServiceTabId !== 'tab-all'
        ? activeServiceTabId
        : (prevTabs.find((t) => t.id !== 'tab-all')?.id || 'tab-all');
      const updated = prevTabs.map((t) => {
        if ((t.id === realTabId || t.id === 'tab-all') && !t.groupIds.includes(group.id)) {
          const u = { ...t, groupIds: [...t.groupIds, group.id] };
          targetTabs.push(u);
          return u;
        }
        return t;
      });
      StorageRuntime.saveTabs(updated, activeWorkspaceId);
      return updated;
    });

    if (currentUser?.id) {
      persistGroupApi(currentUser.id, group, activeWorkspaceId).catch(console.error);
      targetTabs.forEach((t) => persistTabApi(currentUser.id, t, activeWorkspaceId));
    }
  }, [activeServiceTabId, activeWorkspaceId, currentUser?.id]);

  const updateGroup = useCallback(async (group: ServiceGroup) => {
    setGroups((prev) => {
      const updated = prev.map((g) => (g.id === group.id ? group : g));
      StorageRuntime.saveGroups(updated, activeWorkspaceId);
      return updated;
    });
    if (currentUser?.id) persistGroupApi(currentUser.id, group, activeWorkspaceId);
  }, [activeWorkspaceId, currentUser?.id]);

  const removeGroup = useCallback(async (groupId: string) => {
    setGroups((prev) => {
      const updated = prev.filter((g) => g.id !== groupId);
      StorageRuntime.saveGroups(updated, activeWorkspaceId);
      return updated;
    });

    const targetTabs: ServiceTab[] = [];
    setTabs((prevTabs) => {
      const updated = prevTabs.map((t) => {
        if (t.groupIds.includes(groupId)) {
          const u = { ...t, groupIds: t.groupIds.filter((id) => id !== groupId) };
          targetTabs.push(u);
          return u;
        }
        return t;
      });
      StorageRuntime.saveTabs(updated, activeWorkspaceId);
      return updated;
    });

    setAccounts((prev) => {
      const updated = removeGroupFromAccounts(prev, groupId);
      if (currentUser?.id) updated.forEach((a) => persistServiceAccountApi(currentUser.id, a.toJSON(), activeWorkspaceId));
      return updated;
    });

    if (currentUser?.id) {
      deleteGroupApi(currentUser.id, groupId, activeWorkspaceId);
      targetTabs.forEach((t) => persistTabApi(currentUser.id, t, activeWorkspaceId));
    }
  }, [setAccounts, activeWorkspaceId, currentUser?.id]);

  const addTab = useCallback((tab: ServiceTab) => {
    const { finalTab, newGroupsToAdd } = buildClonedTabGroups(tab, groups);
    if (newGroupsToAdd.length > 0) {
      setGroups((prev) => {
        const updated = [...prev, ...newGroupsToAdd];
        StorageRuntime.saveGroups(updated, activeWorkspaceId);
        return updated;
      });
      if (currentUser?.id) newGroupsToAdd.forEach((g) => persistGroupApi(currentUser.id, g, activeWorkspaceId));
    }

    setTabs((prev) => {
      const updated = [...prev, finalTab];
      StorageRuntime.saveTabs(updated, activeWorkspaceId);
      return updated;
    });
    setActiveServiceTabId(finalTab.id);
    if (currentUser?.id) persistTabApi(currentUser.id, finalTab, activeWorkspaceId);
  }, [groups, setActiveServiceTabId, activeWorkspaceId, currentUser?.id]);

  const updateTab = useCallback((tab: ServiceTab) => {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === tab.id ? tab : t));
      StorageRuntime.saveTabs(updated, activeWorkspaceId);
      return updated;
    });
    if (currentUser?.id) persistTabApi(currentUser.id, tab, activeWorkspaceId);
  }, [activeWorkspaceId, currentUser?.id]);

  const removeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const updated = prev.filter((t) => t.id !== tabId);
      StorageRuntime.saveTabs(updated, activeWorkspaceId);
      return updated;
    });
    setActiveServiceTabIdState((cur) => (cur === tabId ? 'tab-all' : cur));
    if (currentUser?.id) deleteTabApi(currentUser.id, tabId, activeWorkspaceId);
  }, [activeWorkspaceId, currentUser?.id]);

  const assignServiceToGroups = useCallback((accountId: string, groupIds: string[]) => {
    setAccounts((prev) => {
      const updated = prev.map((acc) => {
        if (acc.id === accountId) { acc.groupIds = groupIds; acc.groupId = groupIds[0]; acc.touch(); }
        return acc;
      });
      if (currentUser?.id) {
        const a = updated.find((acc) => acc.id === accountId);
        if (a) persistServiceAccountApi(currentUser.id, a.toJSON(), activeWorkspaceId);
      }
      return updated;
    });
  }, [setAccounts, activeWorkspaceId, currentUser?.id]);

  const removeAccountFromGroup = useCallback((accountId: string, groupId: string) => {
    setAccounts((prev) => {
      const res = unlinkAccountFromGroup(prev, accountId, groupId);
      if (currentUser?.id) {
        if (res.deletedId) deleteServiceAccountApi(currentUser.id, res.deletedId, activeWorkspaceId);
        else if (res.targetAccount) persistServiceAccountApi(currentUser.id, res.targetAccount.toJSON(), activeWorkspaceId);
      }
      return res.updated;
    });
  }, [setAccounts, activeWorkspaceId, currentUser?.id]);

  return {
    groups, tabs, setGroups, setTabs,
    activeServiceTabId, setActiveServiceTabId,
    addGroup, updateGroup, removeGroup, addTab, updateTab, removeTab,
    assignServiceToGroups, removeAccountFromGroup,
  };
}
