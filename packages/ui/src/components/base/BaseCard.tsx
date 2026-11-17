'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'subtle' | 'base';
  depth?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(({
  variant = 'surface',
  depth = 'md',
  interactive,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-card skipo-card--${variant} skipo-card--${depth} ${interactive ? 'skipo-card--interactive' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
});
BaseCard.displayName = 'BaseCard';
