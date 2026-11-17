'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const BaseBadge = forwardRef<HTMLSpanElement, BaseBadgeProps>(({
  variant = 'neutral',
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <span ref={ref} className={`skipo-badge skipo-badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  );
});
BaseBadge.displayName = 'BaseBadge';
