/**
 * @file ServicesView.tsx
 * @description Master Services View organized into Tabs and Section Groups.
 * Supports cross-section drag-and-drop tile management.
 * File size < 200 lines strictly.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Server, FileJson, Plus, Settings } from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ServiceTabsBar } from './Groups/ServiceTabsBar';
import { ServiceGroupSection } from './Groups/ServiceGroupSection';
import { ServiceTileDragOverlay } from './ServiceTileDragOverlay';
import { useCrossSectionDnd } from './useCrossSectionDnd';
import { ServiceAddModal } from './ServiceAddModal';
import { ServiceEditModal } from './ServiceEditModal';
import { ServiceExportModal } from './ServiceExportModal';
import { ServiceEndpointsModal } from './Endpoints/ServiceEndpointsModal';
import { ServiceGroupModal } from './Groups/ServiceGroupModal';
import { ServiceTabModal } from './Groups/ServiceTabModal';
import { ServiceGroupTabManagerModal } from './Groups/ServiceGroupTabManagerModal';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition, ServiceGroup, ServiceTab } from '@/libraries/types/srkl';
import { BaseIconButton } from '../common/BaseIconButton';

export function ServicesView(): React.ReactElement {
  const {
    registry, accounts, reorderAccounts, addAccount, updateAccount, removeAccount,
    syncAccount, logActivity, registerServiceDefinition, groups, tabs,
    activeServiceTabId, setActiveServiceTabId, addGroup, updateGroup, removeGroup,
    addTab, updateTab, removeTab, removeAccountFromGroup,
  } = useHub();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialTab, setAddModalInitialTab] = useState<'choose' | 'import'>('choose');
  const [targetGroupId, setTargetGroupId] = useState<string | undefined>(undefined);
  const [editingAccount, setEditingAccount] = useState<ServiceAccount | null>(null);
  const [endpointsAccount, setEndpointsAccount] = useState<ServiceAccount | null>(null);
  const [exportingAccount, setExportingAccount] = useState<ServiceAccount | null>(null);

  // Group & Tab Modals
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [editingGroupModal, setEditingGroupModal] = useState<{ open: boolean; group: ServiceGroup | null }>({ open: false, group: null });
  const [editingTabModal, setEditingTabModal] = useState<{ open: boolean; tab: ServiceTab | null }>({ open: false, tab: null });

  const { sensors, activeAccount, isCopyMode, collisionDetection, handleDragStart, handleDragEnd } =
    useCrossSectionDnd({ accounts, updateAccount, reorderAccounts });

  const availableDefinitions = useMemo(() => registry.getAll().map((s) => s.definition), [registry]);

  const activeTabObj = useMemo(() => {
    return tabs.find((t) => t.id === activeServiceTabId) || tabs[0] || { id: 'tab-all', name: 'All', groupIds: groups.map((g) => g.id) };
  }, [tabs, activeServiceTabId, groups]);

  const visibleGroups = useMemo(() => {
    const ids = new Set(activeTabObj.groupIds);
    return groups.filter((g) => ids.has(g.id));
  }, [groups, activeTabObj]);

  const handleOpenAddForGroup = (groupId?: string) => {
    setTargetGroupId(groupId);
    setAddModalInitialTab('choose');
    setIsAddModalOpen(true);
  };

  const handleAddAccount = async (newAccount: ServiceAccount, newDef?: ServiceDefinition) => {
    if (newDef) registerServiceDefinition(newDef);
    const chosenGid = targetGroupId || newAccount.groupId || visibleGroups[0]?.id;
    if (chosenGid) {
      newAccount.groupId = chosenGid;
      newAccount.groupIds = [chosenGid];
    }
    await addAccount(newAccount);
    setTimeout(() => syncAccount(newAccount.id), 100);
  };

  const handleDeleteAccountTile = useCallback((accountId: string, groupId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    const gids = target.groupIds?.length ? target.groupIds : (target.groupId ? [target.groupId] : []);
    if (gids.length <= 1) {
      if (window.confirm(`"${target.name}" is only present in this section. Deleting this tile will permanently remove the account entirely.\n\nDo you want to proceed with permanent deletion?`)) {
        removeAccount(accountId);
      }
    } else {
      removeAccountFromGroup(accountId, groupId);
    }
  }, [accounts, removeAccount, removeAccountFromGroup]);

  return (
    <div id="srkl-services-view" className="space-y-4 max-w-7xl mx-auto w-full font-mono pb-16 animate-fade-in">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b-2" style={{ borderColor: 'var(--skipo-border-color)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 border-2 flex items-center justify-center shadow-sm"
            style={{
              borderColor: 'var(--skipo-accent)',
              backgroundColor: 'var(--skipo-matte-bg)',
              color: 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
            }}
          >
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase" style={{ color: 'var(--skipo-text)' }}>
              SERVICES HUB
            </h1>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--skipo-text-muted)' }}>
              {accounts.length} ACTIVE ACCOUNTS • {groups.length} GROUPS • {tabs.length} TABS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BaseIconButton tooltip="Manage Groups & Tabs" icon={<Settings className="w-4 h-4 text-amber-400" />} variant="secondary" size="md" onClick={() => setIsManagerModalOpen(true)} />
          <BaseIconButton tooltip="Import Service Bundle" icon={<FileJson className="w-4 h-4 text-amber-400" />} variant="secondary" size="md" onClick={() => { setAddModalInitialTab('import'); setIsAddModalOpen(true); }} />
          <BaseIconButton tooltip="Create New Tab Category" icon={<Plus className="w-4 h-4 stroke-[2.5]" />} variant="primary" size="md" onClick={() => setEditingTabModal({ open: true, tab: null })} />
        </div>
      </div>

      {/* Service Tabs Navigation Bar */}
      <ServiceTabsBar
        tabs={tabs}
        groups={groups}
        accounts={accounts}
        activeTabId={activeServiceTabId}
        onSelectTab={setActiveServiceTabId}
        onOpenManageModal={() => setIsManagerModalOpen(true)}
        onOpenAddSectionModal={() => setEditingGroupModal({ open: true, group: null })}
      />

      {/* Cross-Section Drag and Drop Zone */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {visibleGroups.map((grp) => {
            const groupAccounts = accounts.filter((acc) => {
              const gids = acc.groupIds || (acc.groupId ? [acc.groupId] : []);
              return gids.includes(grp.id);
            });

            return (
              <ServiceGroupSection
                key={grp.id}
                group={grp}
                accounts={groupAccounts}
                registry={registry}
                onEditAccount={(acc) => setEditingAccount(acc)}
                onOpenEndpoints={(acc) => setEndpointsAccount(acc)}
                onExportAccount={(acc) => setExportingAccount(acc)}
                onDeleteAccount={handleDeleteAccountTile}
                onSyncAccount={syncAccount}
                onAddClickForGroup={handleOpenAddForGroup}
                onEditGroupModal={(g) => setEditingGroupModal({ open: true, group: g })}
                onDeleteGroup={removeGroup}
                onImportClick={() => { setAddModalInitialTab('import'); setIsAddModalOpen(true); }}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeAccount ? (
            <ServiceTileDragOverlay
              account={activeAccount}
              definition={registry.get(activeAccount.serviceId)?.definition}
              isCopyMode={isCopyMode}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <ServiceEndpointsModal account={endpointsAccount} definition={endpointsAccount ? registry.get(endpointsAccount.serviceId)?.definition : undefined} provider={endpointsAccount ? registry.get(endpointsAccount.serviceId) : undefined} isOpen={!!endpointsAccount} onClose={() => setEndpointsAccount(null)} onLogActivity={logActivity} />
      <ServiceAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} availableDefinitions={availableDefinitions} groups={visibleGroups} defaultGroupId={targetGroupId} onAddAccount={handleAddAccount} initialTab={addModalInitialTab} />
      <ServiceEditModal account={editingAccount} definition={editingAccount ? registry.get(editingAccount.serviceId)?.definition : undefined} groups={visibleGroups} isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} onSave={updateAccount} onExport={(acc) => setExportingAccount(acc)} onDelete={(accId) => handleDeleteAccountTile(accId, editingAccount?.groupId || visibleGroups[0]?.id || '')} />
      <ServiceExportModal account={exportingAccount} definition={exportingAccount ? registry.get(exportingAccount.serviceId)?.definition : undefined} isOpen={!!exportingAccount} onClose={() => setExportingAccount(null)} />
      <ServiceGroupModal group={editingGroupModal.group} isOpen={editingGroupModal.open} onClose={() => setEditingGroupModal({ open: false, group: null })} onSave={(g) => { editingGroupModal.group ? updateGroup(g) : addGroup(g); }} onDelete={removeGroup} />
      <ServiceTabModal tab={editingTabModal.tab} availableGroups={groups} isOpen={editingTabModal.open} onClose={() => setEditingTabModal({ open: false, tab: null })} onSave={(t) => { editingTabModal.tab ? updateTab(t) : addTab(t); }} onDelete={removeTab} />
      <ServiceGroupTabManagerModal isOpen={isManagerModalOpen} onClose={() => setIsManagerModalOpen(false)} tabs={tabs} groups={groups} onOpenAddGroup={() => { setIsManagerModalOpen(false); setEditingGroupModal({ open: true, group: null }); }} onOpenEditGroup={(g) => { setIsManagerModalOpen(false); setEditingGroupModal({ open: true, group: g }); }} onDeleteGroup={removeGroup} onOpenAddTab={() => { setIsManagerModalOpen(false); setEditingTabModal({ open: true, tab: null }); }} onOpenEditTab={(t) => { setIsManagerModalOpen(false); setEditingTabModal({ open: true, tab: t }); }} onDeleteTab={removeTab} />
    </div>
  );
}
