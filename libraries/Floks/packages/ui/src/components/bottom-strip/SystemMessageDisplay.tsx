'use client';
import React from 'react';
import { useBottomStrip, type SystemMessage } from './BottomStripContext.js';

export interface SystemMessageDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  maxVisible?: number;
}

export const SystemMessageDisplay: React.FC<SystemMessageDisplayProps> = ({
  className = '',
  ...props
}) => {
  const { systemMessages, clearSystemMessage, setInspectionText } = useBottomStrip();
  const latestMessage: SystemMessage | undefined = systemMessages[systemMessages.length - 1];

  if (!latestMessage) return null;

  const colorMap = {
    success: 'var(--skipo-success)',
    error: 'var(--skipo-danger)',
    warning: 'var(--skipo-warning)',
    info: 'var(--skipo-info)',
  };

  const currentColor = colorMap[latestMessage.type] || 'var(--skipo-text)';
  const inspectionLabel = `SYSTEM [${latestMessage.type.toUpperCase()}]: ${latestMessage.message} (CLICK TO DISMISS)`;

  return (
    <div
      className={`skipo-system-msg-display skipo-system-msg-display--${latestMessage.type} ${className}`}
      onMouseEnter={() => setInspectionText(inspectionLabel)}
      onMouseLeave={() => setInspectionText(null)}
      onClick={() => {
        clearSystemMessage(latestMessage.id);
        setInspectionText(null);
      }}
      role="button"
      tabIndex={0}
      aria-label={inspectionLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        color: currentColor,
        fontSize: '11px',
        fontFamily: 'var(--skipo-font-mono)',
        fontWeight: 700,
        cursor: 'pointer',
        maxWidth: '220px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
      {...props}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: currentColor,
          flexShrink: 0
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {latestMessage.message}
      </span>
    </div>
  );
};

SystemMessageDisplay.displayName = 'SystemMessageDisplay';
