/**
 * @file ServiceTabModal.tsx
 * @description Modal dialog for creating or editing a Service Tab and mapping section groups.
 * File size < 200 lines strictly.
 */

import React, { useState, useEffect } from 'react';
import { FolderKanban, CheckSquare, Square } from 'lucide-react';
import { BaseButton, BaseInput } from '@skipo/ui';
import { ServiceTab, ServiceGroup } from '@/libraries/types/srkl';
import { BaseModal } from '../../common/BaseModal';

interface ServiceTabModalProps {
  tab: ServiceTab | null;
  availableGroups: ServiceGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (tab: ServiceTab) => void;
  onDelete?: (tabId: string) => void;
}

export function ServiceTabModal({
  tab,
  availableGroups,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ServiceTabModalProps): React.ReactElement | null {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  useEffect(() => {
    if (tab) {
      setName(tab.name);
      setDescription(tab.description || '');
      setSelectedGroupIds(tab.groupIds || []);
    } else {
      setName('');
      setDescription('');
      setSelectedGroupIds([]);
    }
  }, [tab, availableGroups, isOpen]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedTab: ServiceTab = {
      id: tab ? tab.id : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description: description.trim(),
      groupIds: selectedGroupIds,
      isDefault: tab ? tab.isDefault : false,
    };

    onSave(savedTab);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={tab ? `Edit Tab • ${tab.name}` : 'Create New Service Tab'}
      subtitle="ARRANGE SECTION GROUPS INTO NAVIGATIONAL TABS"
      icon={<FolderKanban className="w-4 h-4 text-amber-400" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">Tab Name *</label>
          <BaseInput
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Production Stack"
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-neutral-400 uppercase font-bold">Description</label>
          <BaseInput
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Production databases, storage buckets and repositories"
            className="w-full"
          />
        </div>

        {/* Section Groups Selector */}
        <div className="space-y-2 border border-neutral-800 bg-neutral-950 p-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
            <span className="text-[10px] text-amber-400 uppercase font-bold">{tab ? 'ASSIGNED SECTION GROUPS' : 'SECTION TEMPLATES (COPIED AS UNIQUE SECTIONS)'}</span>
            <span className="text-[10px] text-neutral-500">{selectedGroupIds.length} SELECTED</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {availableGroups.map((grp) => {
              const isChecked = selectedGroupIds.includes(grp.id);
              return (
                <BaseButton
                  key={grp.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleGroup(grp.id)}
                  className={`w-full flex items-center justify-between p-2 text-left border transition-colors ${
                    isChecked
                      ? 'bg-neutral-900 border-amber-500/50 text-white'
                      : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-600" />
                    )}
                    <span className="font-bold text-xs">{grp.name}</span>
                  </div>
                  {grp.description && <span className="text-[10px] text-neutral-500 truncate max-w-xs">{grp.description}</span>}
                </BaseButton>
              );
            })}
          </div>
        </div>

        <div className="p-2 border border-neutral-800 bg-neutral-950/80 text-[10px] text-neutral-400">
          ℹ Tab Isolation: Each tab owns its own unique sections and service tiles. Sections are not shared across tabs.
        </div>

        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          {tab && onDelete && !tab.isDefault ? (
            <BaseButton
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                onDelete(tab.id);
                onClose();
              }}
              className="text-xs uppercase font-bold"
            >
              Delete Tab
            </BaseButton>
          ) : <div />}

          <div className="flex items-center gap-2">
            <BaseButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="text-xs uppercase"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="accent"
              className="font-bold text-xs uppercase"
            >
              {tab ? 'Save Tab' : 'Create Tab'}
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
