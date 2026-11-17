/**
 * @file ServiceTabsBar.tsx
 * @description Tab navigation bar for arranging service groups into tabs.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Plus, Settings, FolderKanban } from 'lucide-react';
import { BaseButton } from '@skipo/ui';
import { BaseIconButton } from '../../common/BaseIconButton';
import { ServiceTab, ServiceGroup } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';

interface ServiceTabsBarProps {
  tabs: ServiceTab[];
  groups: ServiceGroup[];
  accounts: ServiceAccount[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onOpenManageModal: () => void;
  onOpenAddSectionModal: () => void;
}

export function ServiceTabsBar({
  tabs,
  groups,
  accounts,
  activeTabId,
  onSelectTab,
  onOpenManageModal,
  onOpenAddSectionModal,
}: ServiceTabsBarProps): React.ReactElement {
  // Helper to calculate total accounts present in a tab's group list
  const getTabAccountCount = (tab: ServiceTab) => {
    const tabGroups = new Set(tab.groupIds);
    return accounts.filter((acc) => {
      const gids = acc.groupIds || (acc.groupId ? [acc.groupId] : []);
      return gids.some((gid) => tabGroups.has(gid));
    }).length;
  };

  return (
    <div
      id="service-tabs-bar"
      className="flex items-center justify-between border-b p-2 font-mono"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      {/* Scrollable Tab Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const count = getTabAccountCount(tab);

          return (
            <div
              key={tab.id}
              className="flex items-center border transition-all"
              style={{
                backgroundColor: isActive ? 'var(--skipo-accent)' : 'var(--skipo-matte-bg)',
                borderColor: isActive ? 'var(--skipo-accent)' : 'var(--skipo-border-color)',
                boxShadow: isActive ? 'var(--skipo-shadow-btn-active)' : 'none',
                borderRadius: 'var(--skipo-radius-sm)',
              }}
            >
              <BaseButton
                type="button"
                size="sm"
                variant={isActive ? 'accent' : 'ghost'}
                onClick={() => onSelectTab(tab.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase select-none"
                style={{
                  color: isActive ? 'var(--skipo-accent-fg)' : 'var(--skipo-text-muted)',
                }}
              >
                <FolderKanban
                  className="w-3.5 h-3.5"
                  style={{ color: isActive ? 'var(--skipo-accent-fg)' : 'var(--skipo-text-muted)' }}
                />
                <span className="tracking-wide">{tab.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: 'var(--skipo-matte-bg)',
                    color: isActive ? 'var(--skipo-accent-fg)' : 'var(--skipo-text-muted)',
                    borderColor: 'var(--skipo-border-color)',
                  }}
                >
                  {count}
                </span>
              </BaseButton>

            </div>
          );
        })}
      </div>

      {/* Control Actions: Add Section to Tab & Manage Groups/Tabs */}
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <BaseIconButton
          tooltip="Create New Section in Current Tab"
          icon={<Plus className="w-3.5 h-3.5 text-amber-400" />}
          variant="secondary"
          size="sm"
          onClick={onOpenAddSectionModal}
          tooltipPosition="bottom"
        />

        <BaseIconButton
          tooltip="Manage Tabs & Service Groups"
          icon={<Settings className="w-3.5 h-3.5 text-neutral-300" />}
          variant="subtle"
          size="sm"
          onClick={onOpenManageModal}
          tooltipPosition="bottom"
        />
      </div>
    </div>
  );
}
