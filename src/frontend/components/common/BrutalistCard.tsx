'use client';

import React, { HTMLAttributes } from 'react';

export interface BrutalistCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'subtle' | 'base';
  interactive?: boolean;
  depth?: 'sm' | 'md' | 'lg';
}

export const BrutalistCard: React.FC<BrutalistCardProps> = ({
  children,
  variant = 'surface',
  interactive = false,
  depth = 'md',
  className = '',
  style,
  ...props
}) => {
  const getCardBg = () => {
    switch (variant) {
      case 'surface':
        return 'var(--skipo-surface)';
      case 'subtle':
        return 'var(--skipo-matte-bg)';
      case 'base':
        return 'var(--skipo-bg)';
    }
  };

  return (
    <div
      className={`p-3 select-none transition-all duration-100 ${
        interactive
          ? 'cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]'
          : ''
      } ${className}`}
      style={{
        backgroundColor: getCardBg(),
        color: 'var(--skipo-text)',
        border: 'var(--skipo-border)',
        boxShadow: 'var(--skipo-shadow)',
        borderRadius: 'var(--skipo-radius)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
