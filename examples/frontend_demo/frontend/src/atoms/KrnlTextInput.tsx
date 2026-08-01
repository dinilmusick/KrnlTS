import React from 'react';
export function KrnlTextInput({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="krnl-form-group">
      {label && <label className="krnl-label">{label}</label>}
      <input
        type={type}
        className="krnl-input"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}