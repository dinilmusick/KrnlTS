'use client';
import React from 'react';
import { useBottomStrip } from './BottomStripContext.js';
import { BaseButton } from '../base/BaseButton.js';

export interface AutoSaveToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onToggle?: () => void;
}

export const AutoSaveToggle: React.FC<AutoSaveToggleProps> = ({
  onToggle,
  className = '',
  ...props
}) => {
  const { autoSave, setInspectionText } = useBottomStrip();
  const isEnabled = autoSave.enabled;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onToggle) onToggle();
    else autoSave.toggle();
    if (props.onClick) props.onClick(e);
  };

  const inspectionLabel = isEnabled
    ? 'AUTO-SAVE: ACTIVE (AUTOMATIC BACKGROUND PERSISTENCE)'
    : 'AUTO-SAVE: PAUSED (CHANGES REQUIRE MANUAL SAVE)';

  return (
    <BaseButton
      variant="ghost"
      size="sm"
      className={`skipo-autosave-toggle ${isEnabled ? 'skipo-autosave-toggle--active' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setInspectionText(inspectionLabel)}
      onMouseLeave={() => setInspectionText(null)}
      onFocus={() => setInspectionText(inspectionLabel)}
      onBlur={() => setInspectionText(null)}
      aria-label={inspectionLabel}
      style={{
        padding: '2px 4px',
        color: isEnabled ? 'var(--skipo-success)' : 'var(--skipo-text-muted)',
      }}
      {...props}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    </BaseButton>
  );
};

AutoSaveToggle.displayName = 'AutoSaveToggle';
