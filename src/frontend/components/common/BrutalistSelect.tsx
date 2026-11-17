'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React, { SelectHTMLAttributes } from 'react';
import { useBottomStrip } from '@skipo/ui';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BrutalistSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  inspectionLabel?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export const BrutalistSelect: React.FC<BrutalistSelectProps> = ({
  children,
  className = '',
  style,
  inspectionLabel,
  onFocus,
  onBlur,
  ...props
}) => {
  const { setInspectionText } = useBottomStrip();

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    if (inspectionLabel) setInspectionText(`SELECT: ${inspectionLabel}`);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setInspectionText(null);
    if (onBlur) onBlur(e);
  };

  return (
    <select
      className={`px-2.5 py-1.5 text-xs font-mono font-black uppercase tracking-wider focus:outline-none transition-all cursor-pointer ${className}`}
      style={{
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-text)',
        border: 'var(--skipo-border-input)',
        borderRadius: 'var(--skipo-radius-sm)',
        ...style,
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {children}
    </select>
  );
};
