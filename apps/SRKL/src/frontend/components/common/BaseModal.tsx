/**
 * @file BaseModal.tsx
 * @description Master polymorphic parent modal component.
 * Abstracts backdrop, keyboard traps, brutalist styling, and icon-only dismiss controls.
 * File size < 200 lines strictly.
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BaseIconButton } from './BaseIconButton';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  maxWidth = 'xl',
  closeOnBackdropClick = false,
  closeOnEscape = false,
  children,
}: BaseModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} p-5 space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs`}
        style={{
          backgroundColor: 'var(--skipo-surface)',
          color: 'var(--skipo-text)',
          border: 'var(--skipo-border)',
          boxShadow: 'var(--skipo-shadow)',
          borderRadius: 'var(--skipo-radius-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with icon, title, subtitle and icon-only close button */}
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: 'var(--skipo-border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            {icon && (
              <div
                className="w-7 h-7 border flex items-center justify-center shadow-sm"
                style={{
                  backgroundColor: 'var(--skipo-matte-bg)',
                  borderColor: 'var(--skipo-accent)',
                  color: 'var(--skipo-accent)',
                  borderRadius: 'var(--skipo-radius-sm)',
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h2
                className="text-sm font-black tracking-wider uppercase"
                style={{ color: 'var(--skipo-text)' }}
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--skipo-text-muted)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <BaseIconButton
            tooltip="Close (Esc)"
            icon={<X className="w-4 h-4" />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            tooltipPosition="bottom"
          />
        </div>

        {/* Content Body */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
