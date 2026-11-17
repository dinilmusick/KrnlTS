import type { GraphSettings, Group } from '../domain/BaseGraph.js';

export class GroupSettingsResolver {
  public static resolveEffectiveSetting<K extends keyof GraphSettings>(
    settingKey: K,
    rootSettings: GraphSettings,
    targetOverrides?: Partial<GraphSettings>,
    groupId?: string,
    groups: Group[] = []
  ): GraphSettings[K] {
    // 1. Direct target override
    if (targetOverrides && targetOverrides[settingKey] !== undefined) {
      return targetOverrides[settingKey] as GraphSettings[K];
    }

    // 2. Group hierarchy traversal
    if (groupId) {
      const groupMap = new Map<string, Group>(groups.map(g => [g.id, g]));
      let currentGroup = groupMap.get(groupId);

      while (currentGroup) {
        if (currentGroup.settingsOverrides && currentGroup.settingsOverrides[settingKey] !== undefined) {
          return currentGroup.settingsOverrides[settingKey] as GraphSettings[K];
        }
        // Find parent group that contains currentGroup
        currentGroup = groups.find(g => g.childGroups && g.childGroups.includes(currentGroup!.id));
      }
    }

    // 3. Fallback to root graph setting
    return rootSettings[settingKey];
  }

  public static resolveAllSettings(
    rootSettings: GraphSettings,
    targetOverrides?: Partial<GraphSettings>,
    groupId?: string,
    groups: Group[] = []
  ): GraphSettings {
    const keys = Object.keys(rootSettings) as (keyof GraphSettings)[];
    const resolved: Partial<GraphSettings> = {};

    for (const key of keys) {
      (resolved as any)[key] = this.resolveEffectiveSetting(key, rootSettings, targetOverrides, groupId, groups);
    }

    return resolved as GraphSettings;
  }
}
