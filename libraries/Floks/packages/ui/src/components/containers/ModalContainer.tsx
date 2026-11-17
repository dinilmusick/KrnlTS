'use client';
import React, { forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/containers.css';

export interface ModalContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
}

export const ModalContainer = forwardRef<HTMLDivElement, ModalContainerProps>(({
  open,
  onClose,
  children,
  className = '',
  ...props
}, ref) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="skipo-modal-overlay overscroll-contain" onClick={onClose} onWheel={e => e.stopPropagation()}>
      <div ref={ref} className={`skipo-modal-content overscroll-contain ${className}`} onClick={e => e.stopPropagation()} onWheel={e => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>,
    document.body
  );
});
ModalContainer.displayName = 'ModalContainer';
