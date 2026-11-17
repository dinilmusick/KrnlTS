'use client';
import { forwardRef } from 'react';
import { ModalContainer } from '../containers/ModalContainer.js';
import { BaseButton } from '../base/BaseButton.js';
import '../../styles/composite.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  danger
}, ref) => {
  return (
    <ModalContainer ref={ref} open={open} onClose={onCancel}>
      <h3>{title}</h3>
      <p>{message}</p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <BaseButton variant="ghost" onClick={onCancel}>Cancel</BaseButton>
        <BaseButton variant={danger ? 'danger' : 'accent'} onClick={onConfirm}>Confirm</BaseButton>
      </div>
    </ModalContainer>
  );
});
ConfirmDialog.displayName = 'ConfirmDialog';
