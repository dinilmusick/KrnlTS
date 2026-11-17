/**
 * @file ServiceGroupSection.tsx
 * @description Droppable section container rendering a group header and its nested service tiles grid.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { ServiceGroup } from '@/libraries/types/srkl';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceRegistry } from '@/libraries/services/registry';
import { ServicesTileGrid } from '../ServicesTileGrid';
import { BaseIconButton } from '../../common/BaseIconButton';
import { getGroupVisual } from './groupVisualHelpers';

interface ServiceGroupSectionProps {
  group: ServiceGroup;
  accounts: ServiceAccount[];
  registry: ServiceRegistry;
  onEditAccount: (acc: ServiceAccount) => void;
  onOpenEndpoints: (acc: ServiceAccount) => void;
  onExportAccount: (acc: ServiceAccount) => void;
  onDeleteAccount: (accountId: string, groupId: string) => void;
  onSyncAccount: (accountId: string) => void;
  onAddClickForGroup: (groupId: string) => void;
  onEditGroupModal: (group: ServiceGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onImportClick: () => void;
}

export function ServiceGroupSection({
  group,
  accounts,
  registry,
  onEditAccount,
  onOpenEndpoints,
  onExportAccount,
  onDeleteAccount,
  onSyncAccount,
  onAddClickForGroup,
  onEditGroupModal,
  onDeleteGroup,
  onImportClick,
}: ServiceGroupSectionProps): React.ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visual = getGroupVisual(group.color, group.icon);
  const IconComponent = visual.icon;

  const { setNodeRef, isOver } = useDroppable({
    id: `section-${group.id}`,
    data: {
      type: 'section',
      groupId: group.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 backdrop-blur-sm p-4 space-y-4 transition-all ${
        isOver ? 'ring-2 ring-amber-400/80 scale-[1.005]' : ''
      }`}
      style={{
        backgroundColor: isOver ? 'var(--skipo-matte-bg)' : 'var(--skipo-surface)',
        borderColor: isOver
          ? 'var(--skipo-accent)'
          : visual.accentHex
          ? `${visual.accentHex}88`
          : 'var(--skipo-border-color)',
        boxShadow: isOver
          ? `0 0 20px var(--skipo-accent-glow), var(--skipo-shadow-hover)`
          : `0 0 14px ${visual.glowColor || 'rgba(0,0,0,0.2)'}, var(--skipo-shadow)`,
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      {/* Group Header Bar */}
      <div
        className="flex items-center justify-between pb-2.5 border-b"
        style={{ borderColor: visual.accentHex ? `${visual.accentHex}40` : 'var(--skipo-border-color)' }}
      >
        <div className="flex items-center gap-3">
          <BaseIconButton
            tooltip={isCollapsed ? 'Expand Section' : 'Collapse Section'}
            icon={isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ color: visual.accentHex || 'var(--skipo-text-muted)' }}
          />

          <div
            className="w-7 h-7 border flex items-center justify-center transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--skipo-matte-bg)',
              borderColor: visual.accentHex || 'var(--skipo-border-color)',
              color: visual.accentHex || 'var(--skipo-accent)',
              borderRadius: 'var(--skipo-radius-sm)',
              boxShadow: `0 0 8px ${visual.glowColor}`,
            }}
          >
            <IconComponent className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5"
                style={{ color: visual.accentHex || 'var(--skipo-text)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: visual.accentHex || 'var(--skipo-accent)' }}
                />
                {group.name}
              </h2>
              <span
                className="text-[10px] px-1.5 py-0.5 border font-bold uppercase"
                style={{
                  backgroundColor: 'var(--skipo-matte-bg)',
                  borderColor: visual.accentHex ? `${visual.accentHex}60` : 'var(--skipo-border-color)',
                  color: visual.accentHex || 'var(--skipo-accent)',
                  borderRadius: 'var(--skipo-radius-sm)',
                }}
              >
                {accounts.length} SERVICES
              </span>
            </div>
            {group.description && (
              <p
                className="text-[10px] truncate max-w-md"
                style={{ color: 'var(--skipo-text-muted)' }}
              >
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <BaseIconButton
            tooltip="Edit Section Group"
            icon={<Edit2 className="w-3.5 h-3.5 text-neutral-400" />}
            variant="subtle"
            size="sm"
            onClick={() => onEditGroupModal(group)}
            tooltipPosition="bottom"
          />

          <BaseIconButton
            tooltip={`Delete Section "${group.name}"`}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm(`Delete section "${group.name}"? (Services inside will remain in the system)`)) {
                onDeleteGroup(group.id);
              }
            }}
            tooltipPosition="bottom"
          />
        </div>
      </div>

      {/* Grid Body: Always renders tile grid with plus tile even when empty */}
      {!isCollapsed && (
        <ServicesTileGrid
          groupId={group.id}
          accounts={accounts}
          registry={registry}
          onEdit={onEditAccount}
          onOpenEndpoints={onOpenEndpoints}
          onExport={onExportAccount}
          onDelete={(accId) => onDeleteAccount(accId, group.id)}
          onSync={onSyncAccount}
          onAddClick={() => onAddClickForGroup(group.id)}
          onImportClick={onImportClick}
        />
      )}
    </div>
  );
}
