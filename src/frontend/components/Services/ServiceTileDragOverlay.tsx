/**
 * @file ServiceTileDragOverlay.tsx
 * @description Floating visual tile rendered inside @dnd-kit DragOverlay during dragging.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { ServiceAccount } from '@/libraries/core/ServiceAccount';
import { ServiceDefinition } from '@/libraries/types/srkl';
import { getServiceVisualConfig } from './serviceIcons';
import { BaseTile } from '../common/BaseTile';

interface ServiceTileDragOverlayProps {
  account: ServiceAccount;
  definition?: ServiceDefinition;
  isCopyMode?: boolean;
}

export function ServiceTileDragOverlay({
  account,
  definition,
  isCopyMode = false,
}: ServiceTileDragOverlayProps): React.ReactElement {
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
    ? 'Status: INCOMPLETE CREDENTIALS'
    : `Status: ${account.status}`;

  const tooltipText = `${account.name} [${visual.badge}] • ${
    isMissingCreds ? 'INCOMPLETE CREDENTIALS' : account.status
  } • ${credsCount} secrets${description ? ` • ${description}` : ''}`;

  return (
    <div className="relative pointer-events-none transform rotate-1 scale-105 transition-transform duration-75 shadow-2xl">
      {isCopyMode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1 z-30 animate-pulse">
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>COPY TO SECTION</span>
        </div>
      )}
      <BaseTile
        id={`overlay-${account.id}`}
        tooltip={tooltipText}
        title={account.name}
        bgColorClass={visual.tileBg}
        statusColor={statusColor}
        statusTooltip={statusTooltip}
        glowColor={visual.glowColor}
        accentHex={visual.accentHex}
        isDragging={false}
        className={isCopyMode ? 'ring-2 ring-emerald-400' : 'ring-2 ring-amber-400'}
        icon={
          <div
            className={`w-10 h-10 border flex items-center justify-center ${visual.accentBorder} ${visual.accentBg}`}
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
      />
    </div>
  );
}
