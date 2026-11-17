'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leadingIcon?: React.ReactNode;
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(({
  error,
  leadingIcon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`skipo-input-wrapper ${className}`}>
      {leadingIcon && <span className="skipo-input-icon">{leadingIcon}</span>}
      <input ref={ref} className="skipo-input" data-error={error} {...props} />
    </div>
  );
});
BaseInput.displayName = 'BaseInput';
