/**
 * @file ServiceButton.tsx
 * @description Universal neo-brutalist button for service UI components.
 * Supports primary, secondary, danger, and subtle variants with loading and tooltip states.
 * File size < 200 lines strictly.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ServiceButtonVariant = 'primary' | 'secondary' | 'danger' | 'subtle' | 'accent';

export interface ServiceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ServiceButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function ServiceButton({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ServiceButtonProps): React.ReactElement {
  const variantClasses: Record<ServiceButtonVariant, string> = {
    primary:
      'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black border-amber-400 font-black shadow-[2px_2px_0px_#000]',
    secondary:
      'bg-neutral-850 hover:bg-neutral-800 active:bg-neutral-900 text-neutral-200 border-neutral-700 shadow-[2px_2px_0px_#000]',
    danger:
      'bg-rose-950/80 hover:bg-rose-900 active:bg-rose-950 text-rose-300 border-rose-600 shadow-[2px_2px_0px_#000]',
    subtle:
      'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700',
    accent:
      'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-blue-400 font-bold shadow-[2px_2px_0px_#000]',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4.5 py-2 text-sm gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-mono uppercase tracking-wider border-2 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
    </button>
  );
}
