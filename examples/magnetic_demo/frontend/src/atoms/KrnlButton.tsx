import React from 'react';
export function KrnlButton({ label, onClick, disabled, loading }: any) {
  return (
    <button className="krnl-btn" onClick={onClick} disabled={disabled || loading}>
      {loading ? 'Processing...' : label}
    </button>
  );
}