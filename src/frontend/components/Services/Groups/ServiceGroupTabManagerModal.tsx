/**
 * @file ServiceGroupTabManagerModal.tsx
 * @description Master management modal for organizing Tabs and Section Groups.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Settings, FolderKanban, Layers, Plus, Edit2, Trash2 } from 'lucide-react';
import { ServiceTab, ServiceGroup } from '@/libraries/types/srkl';
import { BaseButton } from '@skipo/ui';
import { BaseModal } from '../../common/BaseModal';
import { BaseIconButton } from '../../common/BaseIconButton';
import { getGroupVisual } from './groupVisualHelpers';

interface ServiceGroupTabManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: ServiceTab[];
  groups: ServiceGroup[];
  onOpenAddGroup: () => void;
  onOpenEditGroup: (group: ServiceGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenAddTab: () => void;
  onOpenEditTab: (tab: ServiceTab) => void;
  onDeleteTab: (tabId: string) => void;
}

export function ServiceGroupTabManagerModal({
  isOpen,
  onClose,
  tabs,
  groups,
  onOpenAddGroup,
  onOpenEditGroup,
  onDeleteGroup,
  onOpenAddTab,
  onOpenEditTab,
  onDeleteTab,
}: ServiceGroupTabManagerModalProps): React.ReactElement | null {
  const [activeSubTab, setActiveSubTab] = useState<'TABS' | 'GROUPS'>('TABS');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Organize Service Tabs & Section Groups"
      subtitle="STRUCTURE SERVICES INTO CUSTOM SECTIONS AND NAVIGATION TABS"
      icon={<Settings className="w-4 h-4 text-amber-400" />}
      maxWidth="xl"
    >
      <div className="space-y-4 font-mono text-xs">
        {/* Navigation Selector */}
        <div className="flex border-b border-neutral-800 text-xs gap-1 pb-1">
          <BaseButton
            type="button"
            size="sm"
            variant={activeSubTab === 'TABS' ? 'accent' : 'ghost'}
            onClick={() => setActiveSubTab('TABS')}
            className="flex items-center gap-2 px-4 py-2 uppercase font-bold"
          >
            <FolderKanban className="w-4 h-4 mr-1" />
            Navigational Tabs ({tabs.length})
          </BaseButton>
          <BaseButton
            type="button"
            size="sm"
            variant={activeSubTab === 'GROUPS' ? 'accent' : 'ghost'}
            onClick={() => setActiveSubTab('GROUPS')}
            className="flex items-center gap-2 px-4 py-2 uppercase font-bold"
          >
            <Layers className="w-4 h-4 mr-1" />
            Section Groups ({groups.length})
          </BaseButton>
        </div>

        {/* TABS LIST PANEL */}
        {activeSubTab === 'TABS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase">CONFIGURE TABS THAT GROUP SECTIONS TOGETHER</span>
              <BaseButton
                type="button"
                size="sm"
                variant="accent"
                onClick={onOpenAddTab}
                className="flex items-center gap-1 font-bold uppercase"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add New Tab
              </BaseButton>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tabs.map((tab) => (
                <div key={tab.id} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase text-xs">{tab.name}</span>
                      {tab.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 font-bold uppercase">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {tab.description && <p className="text-[10px] text-neutral-400 mt-0.5">{tab.description}</p>}
                    <span className="text-[10px] text-amber-500/80 mt-1 block">
                      GROUPS: {tab.groupIds.map((id) => groups.find((g) => g.id === id)?.name || id).join(', ') || 'None'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BaseIconButton
                      tooltip="Edit Tab"
                      icon={<Edit2 className="w-3.5 h-3.5 text-neutral-300" />}
                      variant="subtle"
                      size="sm"
                      onClick={() => onOpenEditTab(tab)}
                    />
                    {!tab.isDefault && (
                      <BaseIconButton
                        tooltip="Delete Tab"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                        variant="subtle"
                        size="sm"
                        onClick={() => onDeleteTab(tab.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUPS LIST PANEL */}
        {activeSubTab === 'GROUPS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 uppercase">CONFIGURE SECTIONS THAT HOLD SERVICE TILES</span>
              <BaseButton
                type="button"
                size="sm"
                variant="accent"
                onClick={onOpenAddGroup}
                className="flex items-center gap-1 font-bold uppercase"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Section Group
              </BaseButton>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {groups.map((grp) => {
                const visual = getGroupVisual(grp.color, grp.icon);
                const IconComp = visual.icon;

                return (
                  <div key={grp.id} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 border border-neutral-700 bg-neutral-950 ${visual.text} flex items-center justify-center`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white uppercase text-xs">{grp.name}</span>
                        {grp.description && <p className="text-[10px] text-neutral-400 mt-0.5">{grp.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BaseIconButton
                        tooltip="Edit Group"
                        icon={<Edit2 className="w-3.5 h-3.5 text-neutral-300" />}
                        variant="subtle"
                        size="sm"
                        onClick={() => onOpenEditGroup(grp)}
                      />
                      <BaseIconButton
                        tooltip="Delete Group"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                        variant="subtle"
                        size="sm"
                        onClick={() => onDeleteGroup(grp.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
