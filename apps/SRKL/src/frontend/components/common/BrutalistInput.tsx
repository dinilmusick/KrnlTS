'use client';

// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════
import React, { InputHTMLAttributes } from 'react';
import { useBottomStrip } from '@skipo/ui';

export { BrutalistSelect } from './BrutalistSelect';
export type { BrutalistSelectProps } from './BrutalistSelect';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════
export interface BrutalistInputProps extends InputHTMLAttributes<HTMLInputElement> {
  inspectionLabel?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════
export const BrutalistInput: React.FC<BrutalistInputProps> = ({
  className = '',
  style,
  inspectionLabel,
  placeholder,
  onFocus,
  onBlur,
  ...props
}) => {
  const { setInspectionText } = useBottomStrip();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const text = inspectionLabel || placeholder;
    if (text) setInspectionText(`INPUT: ${text}`);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setInspectionText(null);
    if (onBlur) onBlur(e);
  };

  return (
    <input
      className={`w-full px-2.5 py-1.5 text-xs font-mono font-bold tracking-wider focus:outline-none transition-all ${className}`}
      style={{
        backgroundColor: 'var(--skipo-matte-bg)',
        color: 'var(--skipo-text)',
        border: 'var(--skipo-border-input)',
        borderRadius: 'var(--skipo-radius-sm)',
        ...style,
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      {...props}
    />
  );
};
