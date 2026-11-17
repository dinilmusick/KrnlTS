'use client';

import React, { ButtonHTMLAttributes } from 'react';
import { useBottomStrip } from '@skipo/ui';

export interface BrutalistButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'secondary' | 'surface' | 'subtle' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
  tooltip?: string;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  children,
  variant = 'surface',
  size = 'md',
  active = false,
  tooltip,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}) => {
  const { setInspectionText } = useBottomStrip();

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tooltip) setInspectionText(tooltip);
    else if (typeof children === 'string' && children.length <= 40) setInspectionText(children);
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (tooltip || typeof children === 'string') setInspectionText(null);
    if (onMouseLeave) onMouseLeave(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (tooltip) setInspectionText(tooltip);
    else if (typeof children === 'string' && children.length <= 40) setInspectionText(children);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (tooltip || typeof children === 'string') setInspectionText(null);
    if (onBlur) onBlur(e);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-[11px] h-7 font-black uppercase',
    md: 'px-3 py-1.5 text-xs h-9 font-black uppercase',
    lg: 'px-4 py-2.5 text-sm h-11 font-black uppercase',
    icon: 'h-8 w-8 flex items-center justify-center font-black',
  };

  const getVariantStyles = (): React.CSSProperties => {
    if (active) {
      return {
        backgroundColor: 'var(--skipo-accent)',
        color: 'var(--skipo-accent-fg)',
        border: 'var(--skipo-border)',
        boxShadow: 'var(--skipo-shadow-btn-active)',
        transform: 'translate(1px, 1px)',
      };
    }

    switch (variant) {
      case 'accent':
        return {
          backgroundColor: 'var(--skipo-accent)',
          color: 'var(--skipo-accent-fg)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow-btn)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--skipo-danger)',
          color: 'var(--skipo-danger-fg)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow-btn)',
        };
      case 'secondary':
      case 'surface':
        return {
          backgroundColor: 'var(--skipo-matte-bg)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow-btn)',
        };
      case 'subtle':
        return {
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text-muted)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow-btn)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--skipo-text)',
          border: '1px solid transparent',
        };
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 transition-all duration-100 select-none cursor-pointer active:translate-x-[1px] active:translate-y-[1px] ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: 'var(--skipo-font-mono)',
        borderRadius: 'var(--skipo-radius-sm)',
        ...getVariantStyles(),
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label={tooltip || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </button>
  );
};
