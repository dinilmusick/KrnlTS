/**
 * @file ServiceAddPlusTile.tsx
 * @description Prominent plus tile inheriting from BaseTile.
 * Adheres to Skipo icon-only tile protocol with hover-only tooltip reveal.
 * Fully wired to Skipo theme tokens.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Plus, FileJson } from 'lucide-react';
import { BaseTile } from '../common/BaseTile';
import { BaseIconButton } from '../common/BaseIconButton';

interface ServiceAddPlusTileProps {
  onClick: () => void;
  onImportClick: () => void;
}

export function ServiceAddPlusTile({
  onClick,
  onImportClick,
}: ServiceAddPlusTileProps): React.ReactElement {
  return (
    <BaseTile
      id="add-new-service-tile"
      tooltip="Add New Service Tile (Click to configure or import JSON bundle)"
      statusColor="var(--skipo-accent)"
      statusTooltip="Ready to instantiate"
      glowColor="var(--skipo-accent-glow)"
      onClick={onClick}
      bgColorClass="skipo-theme-surface"
      icon={
        <div
          className="w-12 h-12 border-2 border-dashed flex items-center justify-center transition-all duration-150"
          style={{
            borderColor: 'var(--skipo-accent)',
            backgroundColor: 'var(--skipo-matte-bg)',
            borderRadius: 'var(--skipo-radius-sm)',
          }}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" style={{ color: 'var(--skipo-accent)' }} />
        </div>
      }
      hoverActions={
        <div className="flex items-center gap-1">
          <BaseIconButton
            tooltip="Quick Import Service Bundle JSON"
            icon={<FileJson className="w-3.5 h-3.5" />}
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onImportClick();
            }}
          />
        </div>
      }
      className="border-dashed"
    />
  );
}
