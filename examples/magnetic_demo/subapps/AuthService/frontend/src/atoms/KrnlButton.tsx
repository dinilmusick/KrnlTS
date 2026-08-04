import React from 'react';
export function KrnlButton({ label, onClick, disabled, loading, variant = 'primary', icon = '⚡', type, children }: any) {
  const textLabel = label || (typeof children === 'string' ? children : undefined) || 'Action';
  return (
    <button
      type={type || 'button'}
      className={`krnl-btn krnl-btn-${variant}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={typeof textLabel === 'string' ? textLabel : undefined}
    >
      <span className="krnl-btn-icon">{icon}</span>
      <span className="krnl-btn-label">{loading ? 'Processing...' : (children || textLabel)}</span>
    </button>
  );
}