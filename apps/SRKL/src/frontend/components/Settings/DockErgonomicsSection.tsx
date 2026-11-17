'use client';

/**
 * @file DockErgonomicsSection.tsx
 * @description Dock position & toolbar ergonomics card for Settings.
 * Adheres strictly to Skipo code limits (<200 lines).
 */

import React from 'react';
import { Sliders, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';
import { DockPosition } from '@/libraries/types/srkl';
import { BaseToggle } from '@skipo/ui';
import { BaseIconButton } from '../common/BaseIconButton';

interface DockErgonomicsSectionProps {
  dockPosition: DockPosition;
  autoHideDock: boolean;
  onPositionChange: (pos: DockPosition) => void;
  onAutoHideToggle: (autoHide: boolean) => void;
}

export function DockErgonomicsSection({
  dockPosition,
  autoHideDock,
  onPositionChange,
  onAutoHideToggle,
}: DockErgonomicsSectionProps): React.ReactElement {
  const positionIcons: Record<DockPosition, React.ReactElement> = {
    bottom: <ArrowDown className="w-4 h-4" />,
    top: <ArrowUp className="w-4 h-4" />,
    left: <ArrowLeft className="w-4 h-4" />,
    right: <ArrowRight className="w-4 h-4" />,
  };

  return (
    <div
      className="p-4 border-2 space-y-3"
      style={{
        backgroundColor: 'var(--skipo-surface)',
        borderColor: 'var(--skipo-border-color)',
        boxShadow: 'var(--skipo-shadow)',
        borderRadius: 'var(--skipo-radius)',
      }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: 'var(--skipo-text)' }}>
        <Sliders className="w-4 h-4" style={{ color: 'var(--skipo-accent)' }} />
        <span>macOS-Style Dock Toolbar Ergonomics</span>
      </div>

      <div className="space-y-3 pt-1">
        <div>
          <span className="block mb-1.5 uppercase font-bold text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>
            Dock Edge Position
          </span>
          <div className="flex items-center gap-2">
            {(['bottom', 'top', 'left', 'right'] as const).map((pos) => (
              <BaseIconButton
                key={pos}
                tooltip={`Dock to ${pos.toUpperCase()} edge`}
                icon={positionIcons[pos]}
                variant={dockPosition === pos ? 'primary' : 'secondary'}
                active={dockPosition === pos}
                size="md"
                onClick={() => onPositionChange(pos)}
              />
            ))}
          </div>
        </div>

        <div
          className="pt-2 flex items-center justify-between border-t"
          style={{ borderColor: 'var(--skipo-border-color)' }}
        >
          <div>
            <span className="font-bold block uppercase text-[11px]" style={{ color: 'var(--skipo-text)' }}>
              Auto-Hide Dock Toolbar
            </span>
            <span className="text-[10px]" style={{ color: 'var(--skipo-text-muted)' }}>
              Show subtle ghost trigger until hovered.
            </span>
          </div>
          <BaseToggle
            checked={autoHideDock}
            onChange={(e) => onAutoHideToggle(e.target.checked)}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
