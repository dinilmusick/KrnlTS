/**
 * @file BaseIconButton.tsx
 * @description Master polymorphic parent component for all icon-only buttons.
 * Enforces zero text labels on button surfaces, monochromatic SVG icons,
 * 2.5D neo-brutalist tactile styling, and collision-aware hover tooltips.
 * File size < 200 lines strictly.
 */

import React, { useState, ButtonHTMLAttributes, ReactNode, MouseEvent } from 'react';
import { Tooltip } from './Tooltip';

export type IconButtonVariant = 'primary' | 'secondary' | 'surface' | 'subtle' | 'danger' | 'ghost' | 'accent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface BaseIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  position?: 'top' | 'bottom' | 'left' | 'right';
  badge?: string | number;
}

export function BaseIconButton({
  tooltip,
  icon,
  variant = 'surface',
  size = 'md',
  active = false,
  tooltipPosition,
  position,
  badge,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...restProps
}: BaseIconButtonProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const resolvedPosition = tooltipPosition || position || 'top';
  const resolvedVariant = variant === 'accent' ? 'primary' : variant;

  // Sizing definitions: strictly square, icon-centered
  const sizeClasses: Record<IconButtonSize, string> = {
    sm: 'w-7 h-7 p-1 text-xs',
    md: 'w-8 h-8 p-1.5 text-sm',
    lg: 'w-10 h-10 p-2 text-base',
  };

  // Neo-brutalist 2.5D theme-aware variants
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

    switch (resolvedVariant) {
      case 'primary':
        return {
          backgroundColor: 'var(--skipo-accent)',
          color: 'var(--skipo-accent-fg)',
          border: 'var(--skipo-border)',
          boxShadow: isHovered ? 'var(--skipo-shadow-btn-hover)' : 'var(--skipo-shadow-btn)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--skipo-matte-bg)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
          boxShadow: isHovered ? 'var(--skipo-shadow-btn-hover)' : 'var(--skipo-shadow-btn)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--skipo-matte-bg)',
          color: 'var(--skipo-danger)',
          border: '1px solid var(--skipo-danger)',
          boxShadow: isHovered ? 'var(--skipo-shadow-btn-hover)' : 'var(--skipo-shadow-btn)',
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
          backgroundColor: isHovered ? 'var(--skipo-surface-hover)' : 'transparent',
          color: 'var(--skipo-text)',
          border: '1px solid transparent',
        };
      case 'surface':
      default:
        return {
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
          boxShadow: isHovered ? 'var(--skipo-shadow-btn-hover)' : 'var(--skipo-shadow-btn)',
        };
    }
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
  };

  const buttonElement = (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center justify-center font-mono transition-all duration-100 select-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:translate-x-[1px] active:translate-y-[1px] ${sizeClasses[size]} ${className}`}
      style={{
        borderRadius: 'var(--skipo-radius-sm)',
        ...getVariantStyles(),
      }}
      aria-label={tooltip}
      {...restProps}
    >
      <span className="flex items-center justify-center pointer-events-none">
        {icon}
      </span>

      {badge !== undefined && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-black flex items-center justify-center border shadow-sm"
          style={{
            backgroundColor: 'var(--skipo-accent)',
            color: 'var(--skipo-accent-fg)',
            borderColor: 'var(--skipo-border-color)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <Tooltip content={tooltip} position={resolvedPosition}>
      {buttonElement}
    </Tooltip>
  );
}
