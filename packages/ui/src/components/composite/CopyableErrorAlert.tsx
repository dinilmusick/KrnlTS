'use client';
import React, { useState } from 'react';
import { BaseCard } from '../base/BaseCard.js';
import { BaseButton } from '../base/BaseButton.js';
import { BaseBadge } from '../base/BaseBadge.js';
import '../../styles/composite.css';

export interface CopyableErrorAlertProps {
  error: string | Error | null | undefined;
  title?: string;
  className?: string;
  onClear?: () => void;
}

export const CopyableErrorAlert: React.FC<CopyableErrorAlertProps> = ({
  error,
  title = 'System Error',
  className = '',
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || String(error);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(errorMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <BaseCard
      variant="surface"
      depth="sm"
      className={`skipo-error-alert ${className}`}
      style={{
        border: '1px solid var(--skipo-danger, #ef4444)',
        background: 'rgba(239, 68, 68, 0.08)',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          <BaseBadge variant="neutral" style={{ background: 'var(--skipo-danger, #ef4444)', color: 'var(--skipo-danger-fg, #ffffff)' }}>
            ERROR
          </BaseBadge>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--skipo-text)' }}>
            {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <BaseButton
            size="sm"
            variant={copied ? 'success' : 'secondary'}
            onClick={handleCopy}
            type="button"
            title="Copy Error to Clipboard"
            aria-label="Copy Error"
            style={{ fontSize: '10px', height: '24px', padding: '0 8px' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </BaseButton>
          {onClear && (
            <BaseButton
              size="sm"
              variant="ghost"
              onClick={onClear}
              type="button"
              title="Dismiss"
              aria-label="Dismiss"
              style={{ fontSize: '10px', height: '24px', padding: '0 6px' }}
            >
              ✕
            </BaseButton>
          )}
        </div>
      </div>
      <div
        style={{
          fontSize: '12px',
          fontFamily: 'var(--skipo-font-mono, monospace)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          maxHeight: '140px',
          overflowY: 'auto',
          color: 'var(--skipo-text)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          padding: '6px 8px',
          borderRadius: '4px',
        }}
      >
        {errorMessage}
      </div>
    </BaseCard>
  );
};
CopyableErrorAlert.displayName = 'CopyableErrorAlert';
