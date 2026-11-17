'use client';
import React, { forwardRef } from 'react';
import '../../styles/containers.css';

export interface DrawerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'bottom';
}

export const DrawerContainer = forwardRef<HTMLDivElement, DrawerContainerProps>(({
  open,
  onClose,
  position = 'right',
  children,
  className = '',
  ...props
}, ref) => {
  if (!open) return null;
  return (
    <>
      <div className="skipo-modal-overlay" onClick={onClose} />
      <div ref={ref} className={`skipo-drawer-container skipo-drawer--${position} ${className}`} {...props}>
        {children}
      </div>
    </>
  );
});
DrawerContainer.displayName = 'DrawerContainer';
