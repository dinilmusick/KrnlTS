/**
 * @file useGroupTabHelpers.ts
 * @description Helper functions for disjoint group isolation, cloning, and tab unlinking.
 * Adheres strictly to Skipo Governance (< 200 lines).
 */

import { ServiceGroup, ServiceTab } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';

export interface ClonedTabResult {
  finalTab: ServiceTab;
  newGroupsToAdd: ServiceGroup[];
}

export interface DisjointSanitizationResult {
  updatedTabs: ServiceTab[];
  newGroupsToAdd: ServiceGroup[];
  hasChanges: boolean;
}

export function buildClonedTabGroups(
  tab: ServiceTab,
  existingGroups: ServiceGroup[]
): ClonedTabResult {
  const newGroupIds: string[] = [];
  const newGroupsToAdd: ServiceGroup[] = [];

  for (const srcGid of tab.groupIds) {
    const src = existingGroups.find((g) => g.id === srcGid);
    if (src) {
      const clonedGid = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newGroupsToAdd.push({ ...src, id: clonedGid, isDefault: false });
      newGroupIds.push(clonedGid);
    } else {
      newGroupIds.push(srcGid);
    }
  }

  if (newGroupIds.length === 0) {
    const defaultGid = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const defaultGrp: ServiceGroup = {
      id: defaultGid,
      name: 'General',
      color: 'sky',
      icon: 'Layers',
      isDefault: false,
    };
    newGroupsToAdd.push(defaultGrp);
    newGroupIds.push(defaultGid);
  }

  return {
    finalTab: { ...tab, groupIds: newGroupIds },
    newGroupsToAdd,
  };
}

export function sanitizeDisjointTabGroups(
  tabs: ServiceTab[],
  groups: ServiceGroup[]
): DisjointSanitizationResult {
  const seenGroupIds = new Set<string>();
  const newGroupsToAdd: ServiceGroup[] = [];
  let hasChanges = false;

  const updatedTabs = tabs.map((tab) => {
    if (tab.id === 'tab-all') return tab;
    let tabChanged = false;
    const nextGroupIds: string[] = [];

    for (const gid of tab.groupIds) {
      if (!seenGroupIds.has(gid)) {
        seenGroupIds.add(gid);
        nextGroupIds.push(gid);
      } else {
        hasChanges = true;
        tabChanged = true;
        const src = groups.find((g) => g.id === gid) || newGroupsToAdd.find((g) => g.id === gid);
        const clonedGid = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const clonedGroup: ServiceGroup = {
          ...(src || { name: 'Section', color: 'sky', icon: 'Layers' }),
          id: clonedGid,
          isDefault: false,
        };
        newGroupsToAdd.push(clonedGroup);
        seenGroupIds.add(clonedGid);
        nextGroupIds.push(clonedGid);
      }
    }

    return tabChanged ? { ...tab, groupIds: nextGroupIds } : tab;
  });

  return { updatedTabs, newGroupsToAdd, hasChanges };
}

export function unlinkAccountFromGroup(
  accounts: ServiceAccount[],
  accountId: string,
  groupId: string
): { updated: ServiceAccount[]; deletedId?: string; targetAccount?: ServiceAccount } {
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return { updated: accounts };
  const gids = target.groupIds?.length ? target.groupIds : (target.groupId ? [target.groupId] : []);
  const remaining = gids.filter((id) => id !== groupId);

  if (remaining.length === 0) {
    return { updated: accounts.filter((a) => a.id !== accountId), deletedId: accountId };
  }

  let updatedTarget: ServiceAccount | undefined;
  const updated = accounts.map((acc) => {
    if (acc.id === accountId) {
      acc.groupIds = remaining;
      acc.groupId = remaining[0];
      acc.touch();
      updatedTarget = acc;
    }
    return acc;
  });
  return { updated, targetAccount: updatedTarget };
}

export function resolveSavedTabId(
  activeWorkspaceId: string | undefined,
  loadedTabs: ServiceTab[]
): string {
  const saved = activeWorkspaceId ? localStorage.getItem(`srkl_active_tab_${activeWorkspaceId}`) : null;
  if (saved && loadedTabs.some((t) => t.id === saved)) return saved;
  return loadedTabs.find((t) => t.isDefault)?.id || loadedTabs[0]?.id || 'tab-all';
}

export function removeGroupFromAccounts(
  accounts: ServiceAccount[],
  groupId: string
): ServiceAccount[] {
  return accounts.map((acc) => {
    if (acc.groupIds.includes(groupId)) {
      acc.groupIds = acc.groupIds.filter((id) => id !== groupId);
      acc.groupId = acc.groupIds[0];
      acc.touch();
    }
    return acc;
  });
}
