'use client';
import React, { forwardRef } from 'react';
import '../../styles/base.css';

export interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
  error?: boolean;
}

export const BaseSelect = forwardRef<HTMLSelectElement, BaseSelectProps>(({
  options,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <select ref={ref} className={`skipo-select ${className}`} data-error={error} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
});
BaseSelect.displayName = 'BaseSelect';
