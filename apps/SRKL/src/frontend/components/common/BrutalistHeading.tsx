'use client';

import React, { HTMLAttributes } from 'react';

export interface BrutalistHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4;
}

export const BrutalistHeading: React.FC<BrutalistHeadingProps> = ({
  level = 3,
  children,
  className = '',
  style,
  ...props
}) => {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  const sizes = {
    1: 'text-2xl font-black uppercase tracking-tight',
    2: 'text-xl font-black uppercase tracking-wide',
    3: 'text-sm font-black uppercase tracking-wider',
    4: 'text-xs font-bold uppercase tracking-wider',
  };

  return (
    <Tag
      className={`${sizes[level]} ${className}`}
      style={{
        color: 'var(--skipo-text)',
        fontFamily: 'var(--skipo-font)',
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
};
