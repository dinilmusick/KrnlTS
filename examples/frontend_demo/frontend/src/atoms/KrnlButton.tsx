import React from 'react';
export function KrnlButton({ label, onClick, disabled, loading, variant = 'primary', type, children }: any) {
  return (
    <button
      type={type || 'button'}
      className={`krnl-btn krnl-btn-${variant}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Processing...' : (children || label)}
    </button>
  );
}