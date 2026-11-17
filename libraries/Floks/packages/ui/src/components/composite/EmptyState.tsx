'use client';
import React, { forwardRef } from 'react';
import { BaseButton } from '../base/BaseButton.js';
import '../../styles/composite.css';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(({
  icon,
  message,
  actionLabel,
  onAction,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-empty-state ${className}`} {...props}>
      {icon && <div>{icon}</div>}
      <p>{message}</p>
      {actionLabel && onAction && <BaseButton onClick={onAction}>{actionLabel}</BaseButton>}
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
