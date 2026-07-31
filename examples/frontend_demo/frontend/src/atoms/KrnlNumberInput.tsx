import React from 'react';
export function KrnlNumberInput({ label, value, onChange, placeholder }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type="number"
        className="krnl-input"
        value={value ?? ''}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  );
}