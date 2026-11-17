/**
 * @file ServiceTileCard.tsx
 * @description Draggable service tile inheriting from BaseTile.
 * Presents custom wrapped and resized user-defined titles with authentic brand badges.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileJson, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition } from '@/libraries/types/srkl';
import { getServiceVisualConfig } from './serviceIcons';
import { BaseTile } from '../common/BaseTile';
import { BaseIconButton } from '../common/BaseIconButton';

export interface ServiceTileCardProps {
  key?: string;
  account: ServiceAccount;
  definition?: ServiceDefinition;
  groupId: string;
  onEdit: (account: ServiceAccount) => void;
  onOpenEndpoints: (account: ServiceAccount) => void;
  onExport: (account: ServiceAccount) => void;
  onDelete: (accountId: string) => void;
  onSync: (accountId: string) => void;
}

export function ServiceTileCard({
  account,
  definition,
  groupId,
  onEdit,
  onOpenEndpoints,
  onExport,
  onDelete,
  onSync,
}: ServiceTileCardProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: account.id,
    data: {
      type: 'tile',
      accountId: account.id,
      groupId,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const customColor = (account.metadata?.customColor as string) || (account.metadata?.color as string);
  const visual = getServiceVisualConfig(account.serviceId, undefined, customColor);
  const IconComponent = visual.icon;
  const credsCount = Object.keys(account.getAllCredentials()).length;
  const description = (account.metadata?.description as string) || definition?.description || '';
  const isGoogleAiStudio = account.serviceId.includes('google-ai-studio');
  const isMissingCreds = isGoogleAiStudio && (!account.getCredential('apiKey') || !account.getCredential('projectId'));

  const statusColor = isMissingCreds
    ? 'var(--skipo-warning)'
    : account.status === 'ONLINE'
    ? 'var(--skipo-success)'
    : 'var(--skipo-warning)';
  const statusTooltip = isMissingCreds
    ? 'Status: INCOMPLETE CREDENTIALS (API Key & Project ID required)'
    : `Status: ${account.status}`;

  const tooltipText = `${account.name} [${visual.badge}] • ${
    isMissingCreds ? 'INCOMPLETE CREDENTIALS' : account.status
  } • ${credsCount} secrets${
    description ? ` • ${description}` : ''
  } • (Double-click to open apps & endpoints • Pen icon to edit)`;

  return (
    <div ref={setNodeRef} style={style} className="relative select-none">
      <BaseTile
        id={account.id}
        tooltip={tooltipText}
        title={account.name}
        bgColorClass={visual.tileBg}
        statusColor={statusColor}
        statusTooltip={statusTooltip}
        glowColor={visual.glowColor}
        accentHex={visual.accentHex}
        isDragging={isDragging}
        onDoubleClick={() => onOpenEndpoints(account)}
        icon={
          <div
            className={`w-10 h-10 border flex items-center justify-center transition-transform group-hover:scale-105 ${visual.accentBorder} ${visual.accentBg}`}
            style={{
              borderColor: visual.accentHex ? `${visual.accentHex}88` : undefined,
              boxShadow: `0 0 10px ${visual.glowColor}`,
            }}
          >
            {visual.brandIcon ? (
              <div className="w-5.5 h-5.5 flex items-center justify-center [&_svg]:w-5.5 [&_svg]:h-5.5 [&_svg]:shrink-0">
                {visual.brandIcon}
              </div>
            ) : (
              <IconComponent
                className="w-5 h-5"
                style={{ color: visual.accentHex || undefined }}
              />
            )}
          </div>
        }
        dragHandle={
          <div
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing text-neutral-600 hover:text-amber-400"
            title="Drag to reorder tile"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        }
        hoverActions={
          <div className="flex items-center gap-1">
            <BaseIconButton
              tooltip="Export JSON Bundle"
              icon={<FileJson className="w-3 h-3" />}
              variant="subtle"
              size="sm"
              onClick={() => onExport(account)}
            />
            <BaseIconButton
              tooltip="Edit Tile & Credentials"
              icon={<Edit3 className="w-3 h-3" />}
              variant="subtle"
              size="sm"
              onClick={() => onEdit(account)}
            />
            <BaseIconButton
              tooltip="Ping Service Health"
              icon={<RefreshCw className="w-3 h-3" />}
              variant="subtle"
              size="sm"
              onClick={() => onSync(account.id)}
            />
            <BaseIconButton
              tooltip="Delete Service Tile"
              icon={<Trash2 className="w-3 h-3" />}
              variant="danger"
              size="sm"
              onClick={() => onDelete(account.id)}
            />
          </div>
        }
      />
    </div>
  );
}
