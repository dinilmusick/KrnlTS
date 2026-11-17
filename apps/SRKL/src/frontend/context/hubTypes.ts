/**
 * @file hubTypes.ts
 * @description Context type contracts for SRKL Hub State.
 * File size < 200 lines strictly.
 */

import { ServiceRegistry } from '@/libraries/services/registry';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { HubSettings } from '@/libraries/runtime/StorageRuntime';
import { ActivityRecord, ServiceDefinition, ServiceGroup, ServiceTab, SurveillanceMetrics, TabType } from '@/libraries/types/srkl';
import { UserAccount, SrklWorkspace, UserStorageConnection } from '@/libraries/types/auth';

export interface HubContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  registry: ServiceRegistry;
  accounts: ServiceAccount[];
  groups: ServiceGroup[];
  tabs: ServiceTab[];
  activeServiceTabId: string;
  setActiveServiceTabId: (tabId: string) => void;
  addGroup: (group: ServiceGroup) => void;
  updateGroup: (group: ServiceGroup) => void;
  removeGroup: (groupId: string) => void;
  addTab: (tab: ServiceTab) => void;
  updateTab: (tab: ServiceTab) => void;
  removeTab: (tabId: string) => void;
  assignServiceToGroups: (accountId: string, groupIds: string[]) => void;
  removeAccountFromGroup: (accountId: string, groupId: string) => void;
  activityLogs: ActivityRecord[];
  settings: HubSettings;
  updateSettings: (newSettings: Partial<HubSettings>) => void;
  metrics: Record<string, SurveillanceMetrics>;
  addAccount: (account: ServiceAccount) => void;
  updateAccount: (account: ServiceAccount) => void;
  reorderAccounts: (accounts: ServiceAccount[]) => void;
  removeAccount: (accountId: string) => void;
  syncAccount: (accountId: string) => Promise<void>;
  logActivity: (serviceId: string, actionId: string, status: 'SUCCESS' | 'FAILED', durationMs: number, error?: string | null) => void;
  registerServiceDefinition: (def: ServiceDefinition) => void;
  removeService: (serviceId: string) => void;
  addServiceFromTemplate: (templateId: string) => void;
  executeAction: (accountId: string, actionId: string, payload?: Record<string, unknown>) => Promise<unknown>;
  clearActivityLogs: () => void;
  refreshAllSurveillance: () => Promise<void>;
  currentUser: UserAccount | null;
  login: (user: UserAccount) => void;
  logout: () => Promise<void>;
  workspaces: SrklWorkspace[];
  activeWorkspaceId: string;
  activeWorkspace: SrklWorkspace | null;
  storageConnections: UserStorageConnection[];
  activeStorageConnection: UserStorageConnection | null;
  isSyncingVault: boolean;
  syncVaultNow: () => Promise<{ success: boolean; synced?: boolean; error?: string }>;
  switchWorkspace: (wsId: string) => void;
  reloadWorkspaces: () => Promise<void>;
}
