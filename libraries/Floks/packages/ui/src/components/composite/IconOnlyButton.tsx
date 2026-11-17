'use client';
import React, { forwardRef } from 'react';
import { BaseTooltip } from '../base/BaseTooltip.js';
import { BaseButton } from '../base/BaseButton.js';
import '../../styles/composite.css';

export interface IconOnlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'accent' | 'secondary' | 'ghost' | 'danger' | 'success';
  active?: boolean;
}

/**
 * IconOnlyButton — Strict icon-only brutalist button.
 * Static text labels are forbidden. Label appears exclusively in the bottom strip center on hover.
 */
export const IconOnlyButton = forwardRef<HTMLButtonElement, IconOnlyButtonProps>(({
  icon,
  label,
  variant = 'secondary',
  active = false,
  className = '',
  ...props
}, ref) => {
  return (
    <BaseTooltip content={label}>
      <BaseButton
        ref={ref}
        variant={active ? 'accent' : variant}
        className={`skipo-icon-btn ${active ? 'skipo-icon-btn--active' : ''} ${className}`}
        aria-label={label}
        {...props}
      >
        {icon}
      </BaseButton>
    </BaseTooltip>
  );
});

IconOnlyButton.displayName = 'IconOnlyButton';
