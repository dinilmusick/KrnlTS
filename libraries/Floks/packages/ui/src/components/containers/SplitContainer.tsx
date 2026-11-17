'use client';
import React, { forwardRef } from 'react';
import '../../styles/containers.css';

export interface SplitContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

export const SplitContainer = forwardRef<HTMLDivElement, SplitContainerProps>(({
  direction = 'horizontal',
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-split-container skipo-split--${direction} ${className}`} {...props}>
      {children}
    </div>
  );
});
SplitContainer.displayName = 'SplitContainer';
