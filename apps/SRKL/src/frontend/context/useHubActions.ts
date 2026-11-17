/**
 * @file useHubActions.ts
 * @description Action dispatchers, account CRUD operations, and surveillance sync handlers.
 * File size < 200 lines strictly.
 */

import { useCallback, MutableRefObject } from 'react';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceRegistry } from '@/libraries/services/registry';
import { StorageRuntime, HubSettings } from '@/libraries/runtime/StorageRuntime';
import { ServiceDefinition, SurveillanceMetrics, ActivityRecord } from '@/libraries/types/srkl';
import { UserAccount } from '@/libraries/types/auth';
import { persistServiceAccountApi, deleteServiceAccountApi, persistServiceDefinitionApi } from './userSyncHelper';

interface UseHubActionsProps {
  registry: ServiceRegistry;
  accountsRef: MutableRefObject<ServiceAccount[]>;
  currentUser: UserAccount | null;
  activeWorkspaceId?: string;
  setAccounts: React.Dispatch<React.SetStateAction<ServiceAccount[]>>;
  setMetrics: React.Dispatch<React.SetStateAction<Record<string, SurveillanceMetrics>>>;
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityRecord[]>>;
  setRegistryVersion: React.Dispatch<React.SetStateAction<number>>;
  setSettings: React.Dispatch<React.SetStateAction<HubSettings>>;
}

export function useHubActions({
  registry,
  accountsRef,
  currentUser,
  activeWorkspaceId,
  setAccounts,
  setMetrics,
  setActivityLogs,
  setRegistryVersion,
  setSettings,
}: UseHubActionsProps) {
  const logActivity = useCallback(
    (serviceId: string, actionId: string, status: 'SUCCESS' | 'FAILED', durationMs: number, error?: string | null) => {
      const provider = registry.get(serviceId);
      const newRecord: ActivityRecord = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        serviceId,
        serviceName: provider?.name ?? serviceId,
        actionId,
        actionType: 'EXECUTE',
        status,
        durationMs,
        error,
      };
      setActivityLogs((prev) => {
        const updated = [newRecord, ...prev].slice(0, 100);
        StorageRuntime.saveActivityLogs(updated);
        return updated;
      });
    },
    [registry, setActivityLogs]
  );

  const addAccount = useCallback(
    async (acc: ServiceAccount) => {
      setAccounts((prev) => {
        return [...prev, acc];
      });
      if (!currentUser || !activeWorkspaceId) throw new Error('Select a workspace before saving a service.');
      await persistServiceAccountApi(currentUser.id, acc.toJSON(), activeWorkspaceId);
    },
    [currentUser, activeWorkspaceId, setAccounts]
  );

  const updateAccount = useCallback(
    async (updatedAcc: ServiceAccount) => {
      setAccounts((prev) => {
        return prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a));
      });
      if (!currentUser || !activeWorkspaceId) throw new Error('Select a workspace before saving a service.');
      await persistServiceAccountApi(currentUser.id, updatedAcc.toJSON(), activeWorkspaceId);
    },
    [currentUser, activeWorkspaceId, setAccounts]
  );

  const reorderAccounts = useCallback((reordered: ServiceAccount[]) => {
    setAccounts(reordered);
  }, [setAccounts]);

  const removeAccount = useCallback(
    (accountId: string) => {
      setAccounts((prev) => {
        return prev.filter((a) => a.id !== accountId);
      });
      if (currentUser) deleteServiceAccountApi(currentUser.id, accountId, activeWorkspaceId);
    },
    [currentUser, activeWorkspaceId, setAccounts]
  );

  const syncAccount = useCallback(
    async (accountId: string) => {
      const acc = accountsRef.current.find((a) => a.id === accountId);
      if (!acc) return;
      const provider = registry.get(acc.serviceId);
      if (!provider) return;
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? Object.assign(a, { status: 'SYNCING' as const }) : a)));
      try {
        const statusMetrics = await provider.getStatus(acc);
        setAccounts((prev) => {
          const updated = prev.map((a) => {
            if (a.id === accountId) {
              a.status = 'ONLINE';
              a.updateSyncTimestamp();
            }
            return a;
          });
          return updated;
        });
        setMetrics((prev) => ({ ...prev, [acc.id]: statusMetrics }));
      } catch {
        setAccounts((prev) => {
          const updated = prev.map((a) => (a.id === accountId ? Object.assign(a, { status: 'DEGRADED' as const }) : a));
          return updated;
        });
      }
    },
    [registry, accountsRef, setAccounts, setMetrics]
  );

  const refreshAllSurveillance = useCallback(async () => {
    for (const acc of accountsRef.current) await syncAccount(acc.id);
  }, [syncAccount, accountsRef]);

  const executeAction = useCallback(
    async (accountId: string, actionId: string, payload: Record<string, unknown> = {}) => {
      const acc = accountsRef.current.find((a) => a.id === accountId);
      if (!acc) throw new Error(`Account ${accountId} not found`);
      const provider = registry.get(acc.serviceId);
      if (!provider) throw new Error(`Provider for ${acc.serviceId} not found`);
      const startTime = Date.now();
      try {
        const res = await provider.executeAction(acc, actionId, payload);
        logActivity(acc.serviceId, actionId, 'SUCCESS', Date.now() - startTime);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logActivity(acc.serviceId, actionId, 'FAILED', Date.now() - startTime, msg);
        throw err;
      }
    },
    [registry, accountsRef, logActivity]
  );

  const registerServiceDefinition = useCallback((def: ServiceDefinition) => {
    registry.registerCustomDefinition(def);
    const existing = StorageRuntime.loadCustomDefinitions().filter((d) => d.identifier !== def.identifier);
    StorageRuntime.saveCustomDefinitions([...existing, def]);
    if (currentUser) persistServiceDefinitionApi(currentUser.id, def, activeWorkspaceId);
    setRegistryVersion((v) => v + 1);
  }, [registry, currentUser, activeWorkspaceId, setRegistryVersion]);

  const addServiceFromTemplate = useCallback((templateId: string) => {
    const tpl = ServiceRegistry.getAvailableTemplates().find((t) => t.identifier === templateId);
    if (tpl) registerServiceDefinition(tpl);
  }, [registerServiceDefinition]);

  const removeService = useCallback((serviceId: string) => {
    registry.remove(serviceId);
    const existing = StorageRuntime.loadCustomDefinitions().filter((d) => d.identifier !== serviceId);
    StorageRuntime.saveCustomDefinitions(existing);
    setAccounts((prev) => {
      return prev.filter((a) => a.serviceId !== serviceId);
    });
    setRegistryVersion((v) => v + 1);
  }, [registry, setAccounts, setRegistryVersion]);

  const updateSettings = useCallback((newSettings: Partial<HubSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      StorageRuntime.saveSettings(updated);
      return updated;
    });
  }, [setSettings]);

  const clearActivityLogs = useCallback(() => {
    setActivityLogs([]);
    StorageRuntime.saveActivityLogs([]);
  }, [setActivityLogs]);

  return {
    logActivity, addAccount, updateAccount, reorderAccounts, removeAccount, syncAccount,
    refreshAllSurveillance, executeAction, registerServiceDefinition, addServiceFromTemplate,
    removeService, updateSettings, clearActivityLogs,
  };
}
