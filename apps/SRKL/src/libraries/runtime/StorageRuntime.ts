/**
 * @file StorageRuntime.ts
 * @description Local-First durable state persistence for SRKL.
 * Handles UI preferences, custom service definitions, activity logs, and settings.
 * File size < 200 lines strictly.
 */

import { ActivityRecord, DockPosition, ServiceDefinition, ServiceGroup, ServiceTab } from '../types/srkl';

const DEFINITIONS_KEY = 'srkl_custom_defs_v1';
const ACTIVITY_KEY = 'srkl_activity_logs_v1';
const SETTINGS_KEY = 'srkl_settings_v1';
const GROUPS_KEY = 'srkl_groups_v1';
const TABS_KEY = 'srkl_tabs_v1';

export interface HubSettings {
  dockPosition: DockPosition;
  autoHideDock: boolean;
  theme: 'black_and_gold' | 'coffee_theme';
  autoSyncIntervalSec: number;
}

export const DEFAULT_SETTINGS: HubSettings = {
  dockPosition: 'bottom',
  autoHideDock: false,
  theme: 'black_and_gold',
  autoSyncIntervalSec: 60,
};

export class StorageRuntime {
  /**
   * Clears legacy demo seed data from previous versions to guarantee a clean start.
   */
  public static purgeLegacyPlaceholders(): void {
    try {
      const purgedFlag = localStorage.getItem('srkl_clean_slate_v5');
      if (!purgedFlag) {
        // Service credentials belong exclusively in the encrypted workspace vault.
        // Remove the retired browser cache once; it is never read or written.
        localStorage.removeItem('srkl_accounts_v1');
        localStorage.removeItem(DEFINITIONS_KEY);
        // The original tab/group catalogue was demo content. Remove only those
        // known records, preserving anything the user created themselves.
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (!key || (!key.startsWith(GROUPS_KEY) && !key.startsWith(TABS_KEY))) continue;
          try {
            const entries = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = Array.isArray(entries) ? entries.filter((entry: any) =>
              key.startsWith(GROUPS_KEY)
                ? !['grp-ai', 'grp-storage', 'grp-code', 'grp-applets', 'grp-general'].includes(entry.id)
                : !['tab-all', 'tab-ai-applets', 'tab-cloud-dev'].includes(entry.id)
            ) : [];
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch { localStorage.removeItem(key); }
        }
        localStorage.setItem('srkl_clean_slate_v5', 'true');
      }
    } catch {
      // Ignore in restricted storage environments
    }
  }

  public static loadCustomDefinitions(): ServiceDefinition[] {
    StorageRuntime.purgeLegacyPlaceholders();
    try {
      const raw = localStorage.getItem(DEFINITIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ServiceDefinition[];
        // Filter out built-in template IDs so fresh code definitions are always authoritative
        const filtered = parsed.filter(
          (d) =>
            d.identifier !== 'google-ai-studio' &&
            d.identifier !== 'backblaze-b2' &&
            d.identifier !== 'gemini-api' &&
            d.identifier !== 'github-api'
        );
        return filtered;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public static saveCustomDefinitions(defs: ServiceDefinition[]): void {
    try {
      localStorage.setItem(DEFINITIONS_KEY, JSON.stringify(defs));
    } catch {
      // Ignore
    }
  }

  public static loadActivityLogs(): ActivityRecord[] {
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback
    }
    return [];
  }

  public static saveActivityLogs(logs: ActivityRecord[]): void {
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // Ignore
    }
  }

  public static loadSettings(): HubSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: HubSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public static loadGroups(workspaceId?: string): ServiceGroup[] {
    try {
      const key = workspaceId ? `${GROUPS_KEY}_${workspaceId}` : GROUPS_KEY;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  public static saveGroups(groups: ServiceGroup[], workspaceId?: string): void {
    try {
      const key = workspaceId ? `${GROUPS_KEY}_${workspaceId}` : GROUPS_KEY;
      localStorage.setItem(key, JSON.stringify(groups));
    } catch {}
  }

  public static loadTabs(workspaceId?: string): ServiceTab[] {
    try {
      const key = workspaceId ? `${TABS_KEY}_${workspaceId}` : TABS_KEY;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as ServiceTab[];
        return parsed.map((t) =>
          t.id === 'tab-all' && t.name === 'All Workspaces' ? { ...t, name: 'All Services' } : t
        );
      }
    } catch {}
    return [];
  }

  public static saveTabs(tabs: ServiceTab[], workspaceId?: string): void {
    try {
      const key = workspaceId ? `${TABS_KEY}_${workspaceId}` : TABS_KEY;
      localStorage.setItem(key, JSON.stringify(tabs));
    } catch {}
  }
}
