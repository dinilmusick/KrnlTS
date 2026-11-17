/**
 * @file ConfirmDialog.tsx
 * @description Confirmation modal for destructive actions conforming to Skipo theme protocols.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { BaseIconButton } from './BaseIconButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-5 space-y-4 select-none"
        style={{
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow)',
          borderRadius: 'var(--skipo-radius)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: 'var(--skipo-border-color)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--skipo-warning)' }} />
            <h3 className="text-sm font-black uppercase tracking-wide">{title}</h3>
          </div>
          <BaseIconButton
            tooltip="Dismiss Dialog"
            icon={<X className="w-4 h-4" />}
            variant="ghost"
            size="sm"
            onClick={onCancel}
          />
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--skipo-text-muted)' }}>
          {message}
        </p>

        <div
          className="flex items-center justify-end gap-2 pt-3 border-t text-xs"
          style={{ borderColor: 'var(--skipo-border-color)' }}
        >
          <BrutalistButton
            variant="surface"
            size="sm"
            onClick={onCancel}
            tooltip="Cancel action"
          >
            Cancel
          </BrutalistButton>
          <BrutalistButton
            variant="danger"
            size="sm"
            onClick={onConfirm}
            tooltip="Execute confirmation"
          >
            {confirmLabel}
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
}
