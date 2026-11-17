'use client';
import React, { forwardRef } from 'react';
import '../../styles/containers.css';

export const PanelContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-panel-container ${className}`} {...props}>
      {children}
    </div>
  );
});
PanelContainer.displayName = 'PanelContainer';
