import React from 'react';

export interface KrnlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  label?: string;
  icon?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export const KrnlButton: React.FC<KrnlButtonProps> = ({
  variant = 'primary',
  label,
  icon = '⚡',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const content = children || label || 'Action';
  return (
    <button
      className={`krnl-btn krnl-btn-${variant} ${className}`}
      disabled={disabled || loading}
      title={typeof content === 'string' ? content : undefined}
      {...props}
    >
      <span className="krnl-btn-icon">{icon}</span>
      <span className="krnl-btn-label">{loading ? 'Processing...' : content}</span>
    </button>
  );
};
