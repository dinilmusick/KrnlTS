'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const BaseButton = forwardRef<HTMLButtonElement, BaseButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={`skipo-btn skipo-btn--${variant} skipo-btn--${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="skipo-spinner" /> : icon}
      {children}
    </button>
  );
});
BaseButton.displayName = 'BaseButton';
