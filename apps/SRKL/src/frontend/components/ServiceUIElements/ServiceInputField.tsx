/**
 * @file ServiceInputField.tsx
 * @description In-service input field for API parameterization, secret keys, and payload inputs.
 * Supports label, prefix, suffix, password reveal, clear, and copy.
 * File size < 200 lines strictly.
 */

import React, { useState } from 'react';
import { Eye, EyeOff, X, Copy, Check } from 'lucide-react';

export interface ServiceInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  badge?: string;
  helperText?: string;
  error?: string;
  secret?: boolean;
  allowCopy?: boolean;
  onClear?: () => void;
  size?: 'sm' | 'md';
}

export function ServiceInputField({
  label,
  badge,
  helperText,
  error,
  secret = false,
  allowCopy = false,
  onClear,
  size = 'md',
  type = 'text',
  value,
  className = '',
  ...props
}: ServiceInputFieldProps): React.ReactElement {
  const [showSecret, setShowSecret] = useState(!secret);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const inputType = secret ? (showSecret ? 'text' : 'password') : type;

  return (
    <div className="space-y-1 font-mono text-xs w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
            <span>{label}</span>
            {badge && (
              <span className="text-[9px] px-1 py-0.2 bg-neutral-900 border border-neutral-750 text-amber-400 font-normal">
                {badge}
              </span>
            )}
          </label>
          {error && <span className="text-[10px] text-rose-400 font-bold">{error}</span>}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          type={inputType}
          value={value}
          className={`w-full bg-neutral-950 border-2 font-mono text-neutral-100 placeholder-neutral-600 outline-none transition-colors ${
            error ? 'border-rose-600 focus:border-rose-500' : 'border-neutral-750 focus:border-amber-500'
          } ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
            secret || allowCopy || onClear ? 'pr-16' : ''
          } ${className}`}
          {...props}
        />

        {/* Action icons inside input */}
        <div className="absolute right-1.5 flex items-center gap-1 text-neutral-500">
          {onClear && value && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 hover:text-neutral-300 cursor-pointer"
              title="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {allowCopy && value && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 hover:text-amber-400 cursor-pointer"
              title="Copy value"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}

          {secret && (
            <button
              type="button"
              onClick={() => setShowSecret((prev) => !prev)}
              className="p-1 hover:text-amber-400 cursor-pointer"
              title={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {helperText && !error && (
        <p className="text-[10px] text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}
