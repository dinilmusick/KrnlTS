'use client';

import React, { HTMLAttributes } from 'react';

export interface BrutalistBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'secondary' | 'surface' | 'subtle' | 'success' | 'danger' | 'warning';
}

export const BrutalistBadge: React.FC<BrutalistBadgeProps> = ({
  children,
  variant = 'accent',
  className = '',
  style,
  ...props
}) => {
  const getBadgeStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'accent':
        return {
          backgroundColor: 'var(--skipo-accent)',
          color: 'var(--skipo-accent-fg)',
          border: 'var(--skipo-border)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--skipo-success)',
          color: 'var(--skipo-success-fg)',
          border: 'var(--skipo-border)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--skipo-danger)',
          color: 'var(--skipo-danger-fg)',
          border: 'var(--skipo-border)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--skipo-warning)',
          color: 'var(--skipo-warning-fg)',
          border: 'var(--skipo-border)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--skipo-matte-bg)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
        };
      case 'surface':
        return {
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
        };
      case 'subtle':
        return {
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text-muted)',
          border: 'var(--skipo-border)',
        };
    }
  };

  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider select-none inline-block ${className}`}
      style={{
        fontFamily: 'var(--skipo-font-mono)',
        borderRadius: 'var(--skipo-radius-sm)',
        ...getBadgeStyle(),
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
};
