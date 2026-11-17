'use client';
import React, { forwardRef } from 'react';
import '../../styles/composite.css';

export const LoadingOverlay = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`skipo-loading-overlay ${className}`} {...props}>
      <span className="skipo-spinner">Loading...</span>
    </div>
  );
});
LoadingOverlay.displayName = 'LoadingOverlay';
